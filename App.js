client.on("roleDelete", async (role) => {
  if (await role.guild.checkLog("ROLE_DELETE", true) === true) return;
  dangerMode = true;
  setTimeout(() => {
    dangerMode = false;
    console.log("Role delete dangerMode is now false!");
  }, 1000*60*30);
  
  return new Promise(async function (resolve) {
    let nrole = await role.guild.roles.create({
      color: role.color,
      hoist: role.hoist,
      mentionable: role.mentionable,
      name: role.name,
      permissions: role.permissions,
      position: role.rawPosition
    });

    let changeData  = await RoleModel.findOneAndUpdate({ Id: role.id }, { $set: { Id: nrole.id } }).exec();
    if(!changeData) return;
  
    await ChannelModel.updateMany({ "Permissions.id": role.id }, { $set: { "Permissions.$.id": nrole.id } }, { upsert: true }).exec(async (reject, document) => {
      if (reject) Promise.reject(null);
      
      let _Bot = giveBot(1)[0];
      let Channel = await ChannelModel.find({ "Permissions.id": nrole.id }).exec();
      if (!Channel || nrole.deleted) return false;
      
      for (let i = 0; i < Channel.length; i++) {
        var Array = Channel[i];
        if (nrole.deleted) break;
        let _Channel = _Bot.guilds.cache.get(SERVER_ID).channels.cache.get(Array.Id);
        if (!_Channel) continue;
        return new Promise((resolve, reject) => {
          resolve(_Channel.edit({ type: Array.Type, permissionOverwrites: Array.Permissions })).catch((e) => {
            reject(e);
          });
        });
      };
    });
  
    const Chunk = changeData.Members.length;
    if(Chunk.length <= 0) return;
  
    const ReadyUse = Bots.filter((obj) => !obj.Busy);
    if(ReadyUse.length <= 0) ReadyUse = Bots.sort((userA, userB) => userA.Task - userB.Task).slice(0, Math.round(Chunk / Bots.length));
  
    let Falls = Math.floor(Chunk / ReadyUse.length);
    if(Falls < 1) Falls = 1;

    for (let i = 0; i <= ReadyUse.length; i++) {
      const process = ReadyUse[i];
      if(nrole.deleted) break;
      processBot(process, true, Falls);
      const tokens = changeData.Members.slice(i * Falls, (i + 1) * Falls);
      if (tokens.length <= 0) {
        processBot(process, false, -Falls); 
        break;
      };
      const guild = process.guilds.cache.get(SERVER_ID);
      await tokens.every(async (Id) => {
        if (nrole.deleted){
          processBot(process, false, -Falls);
          return false;
        };
        let Member = guild.members.cache.get(Id);
        if(!Member) return true;
        await Member.roles.add(nrole.id).catch(() => false);
      });
      processBot(process, false, -Falls);
    };
    resolve(true);
  });
});
