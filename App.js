const { MessageEmbed, Guild, Client, Intents } = require("discord.js");
const { SERVER_ID, STATUS, MAIN_TOKEN, SAFE_BOTS, SAFE_USERS, SAFE_ROLES, LOG_CHANNEL, VANITY_URL } = require("./Configurations.json").DEFAULTS;
const { getUpdate, closeAllPermissions } = require("./Module.js");
const { RoleModel, ChannelModel } = require("./Models");
const client = (global.Client = new Client({ intents: [32767] }));
require("./Connection");
const Bots = global.Bots = [];
let dangerMode = false;
const axios = require("axios");

client.on("ready", async () => {
  client.user.setPresence({ activities: [{ name: STATUS }] });
  setInterval(async () => {
    if (dangerMode === true) return;
    await getUpdate(client.guilds.cache.get(SERVER_ID));
  }, 60 * 60 * 1000);
});

client.on("roleCreate", async (role) => {
  if (await role.guild.checkLog("ROLE_CREATE", true)) return;
  return new Promise(async (resolve) => {
    try {
      if (!role.deleted) role.delete();
      resolve();
    } catch (Expect) {
      console.log("roleCreate", Expect);
    }
  });
});

client.on("roleUpdate", async(oldRole, newRole) => {
  if (await oldRole.guild.checkLog("ROLE_UPDATE", true)) return;
  return new Promise(async (resolve) => {
    try {
      newRole.edit({ color: oldRole.color, hoist: oldRole.hoist, mentionable: oldRole.mentionable, name: oldRole.name, permissions: oldRole.permissions, position: oldRole.rawPosition });
      resolve();
    } catch (Expect) {
      console.log("roleUpdate", Expect);
    };
  });
});

client.on("roleDelete", async (role) => {
  if (await role.guild.checkLog("ROLE_DELETE", true) === true) return;
  dangerMode = true;
  setTimeout(() => {
    dangerMode = false;
    console.log("Role delete dangerMode is now false!");
  }, 1000*60*30);
  
  return new Promise(async function (resolve) {
    let nrole = await role.guild.roles.create({
      name: role.name,
      color: role.color,
      hoist: role.hoist,
      permissions: role.permissions,
      position: role.rawPosition,
      mentionable: role.mentionable,
      icon: role.icon ? role.icon : null,
      unicodeEmoji: role.unicodeEmoji
    });

    let changeData  = await RoleModel.findOneAndUpdate({ Id: role.id }, { $set: { Id: nrole.id } }).exec();
    if(!changeData) return;
  
    await ChannelModel.updateMany({ "Permissions.id": role.id }, { $set: { "Permissions.$.id": nrole.id } });
  
    const _Bot = giveBot(1)[0];
    
    const updatedChannels = await ChannelModel.find({ "Permissions.id": nrole.id });
    if (!updatedChannels || nrole.deleted) return false;
  
    for (var i=0, n = updatedChannels.length; i < n; ++i){
      var equal = updatedChannels[i];
      let channel = _Bot.guilds.cache.get(SERVER_ID).channels.cache.get(equal.Id);
      if (channel) await channel.edit({ type: equal.Type, permissionOverwrites: equal.Permissions });
    };
  
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

client.on("channelCreate", async(channel) => {
  if (await channel.guild.checkLog("CHANNEL_CREATE", true)) return;
  return new Promise((resolve, reject) => {
    if (!channel.deleted) resolve(channel.delete()).catch((e) => { 
      reject(e);
    });
  });
});

client.on("channelUpdate", async(oldChannel, newChannel) => {
  if (await oldChannel.guild.checkLog("CHANNEL_UPDATE", true)) return;
  let data = await ChannelModel.findOne({ Id: oldChannel.id }).exec();
  if(!data) return;
  return new Promise((resolve, reject) => {
    resolve(newChannel.edit({ type: oldChannel.type, name: oldChannel.name, topic: oldChannel.topic, nsfw: oldChannel.nsfw, bitrate: oldChannel.bitrate, userLimit: oldChannel.userLimit, permissionOverwrites: data.Permissions, position: oldChannel.rawPosition, rateLimitPerUser: oldChannel.rateLimitPerUser })).catch((e) => { 
      reject(e);
    });
  });
});

client.on("channelUpdate", async(oldChannel, newChannel) => {
  if (await oldChannel.guild.checkLog("CHANNEL_OVERWRITE_UPDATE", true)) return;
  let data = await ChannelModel.findOne({ Id: oldChannel.id }).exec();
  if(!data) return;
  return new Promise((resolve, reject) => {
    resolve(newChannel.edit({ permissionOverwrites: data.Permissions })).catch((e) => { 
      reject(e);
    });
  });
});

client.on("channelDelete", async (channel) => {
  if (await channel.guild.checkLog("CHANNEL_DELETE", true) === true) return;
  
  let newChannel;
  ChannelModel.find({ Id: channel.id }, async (error, doc) => {
    if (error) console.log(error);
    
    newChannel = await channel.guild.channels.create(channel.name, { nsfw: channel.nsfw, parent: channel.parent, type: channel.type, topic: channel.topic, position: channel.rawPosition, permissionOverwrites: doc.Permissions, userLimit: channel.userLimit, rateLimitPerUser: channel.rateLimitPerUser, defaultAutoArchiveDuration: channel.defaultAutoArchiveDuration, rtcRegion: channel.rtcRegion });
    await RoleModel.updateMany({ "Permissions.$.id": channel.id }, { $set: { "Permissions.$.id": newChannel.id } }),
    await ChannelModel.updateOne({ Id: channel.id }, { Id: newChannel.id });
    
    if (newChannel.type === "GUILD_CATEGORY") {
      let Bot = giveBot(1)[0];
      ChannelModel.find({ Parent: channel.id }, async (err, res) => {
        for (var i=0, n = res.length; i < n; ++i){
          var equal = res[i];
          let channels = Bot.guilds.cache.get(SERVER_ID).channels.cache.get(equal.Id);
          if (channels) await resolveTimeout(await channels.setParent(newChannel.id, { lockPermissions: false }), channels.length * 750);
          await ChannelModel.updateMany({ Parent: channel.id }, { Parent: newChannel.id });
        };
      });
    };
  });
});

client.on("guildUpdate", async(oldGuild, newGuild) => {
  if (await oldGuild.checkLog("GUILD_UPDATE", true)) return;
  return new Promise(async function (resolve) {
    if(oldGuild.vanityURLCode !== newGuild.vanityURLCode) axios({ method: "patch", url: `https://discord.com/api/v6/guilds/${oldGuild.id}/vanity-url`, data: { code: VANITY_URL }, headers: { authorization: `Bot ${client.MAIN_TOKEN}` } });
    await newGuild.edit({ name: oldGuild.name, icon: oldGuild.iconURL({ dynamic: true }), banner: oldGuild.bannerURL() });
    resolve(true);
  });
});

client.on("guildBanAdd", async (member) => {
  if (await member.guild.checkLog("MEMBER_BAN_ADD", true)) return;
  return new Promise(async function (resolve) {
    await member.guild.bans.remove(member.user.id);
    resolve(true);
  });
});

client.on("guildMemberRemove", async(member) => {
  await member.guild.checkLog("MEMBER_KICK", true);
});

client.on("guildMemberAdd", async(member) => {
  if (!member.user.bot) return;
  if (await member.guild.checkLog("BOT_ADD", true)) return;
  return new Promise(async function (resolve) {
    member.kick();
    resolve(true);
  });
});

client.on("guildUnavailable", async(guild) => {
  return new Promise(async function (resolve) {
    let bot = giveBot(1)[0];  
    guild = bot.guilds.cache.get(SERVER_ID);
    await closeAllPermissions(guild);
    let channel = bot.channels.cache.get(LOG_CHANNEL);
    if(channel) channel.send(`Sunucu kullanılamaz hale geldiği için tüm yetkileri kapadım.`);
    resolve(true);
  });
});

function resolveTimeout(value, delay) {
  return new Promise(
    resolve => setTimeout(() => resolve(value), delay)
  );
}

Guild.prototype.checkLog = async function (type, close = false) {
  const Log = await this.fetchAuditLogs({ limit: 1, type }).then((this_audit) => this_audit.entries.first());
  if (!Log) return true;
  const Id = Log.executor.id;
  if (safeUsers(Id) || Date.now() - Log.createdTimestamp > 5000) return true;
  let Bot = giveBot(1)[0];
  processBot(Bot, true, 1);
  let Guild = Bot.guilds.cache.get(SERVER_ID);
  let Member = Guild.members.cache.get(Id);
  if (Member && Member.kickable) Member.kick().catch(() => false);
  if (close === true) await closeAllPermissions(Guild);
  processBot(Bot, false, 1);
  return false;
};

function giveBot(length){
  if(length >= Bots.length) length = Bots.length;
  let availableBots = Bots.every(userA => userA && !userA.Busy);
  if(Object.keys(availableBots).length === 0) availableBots = Bots.sort((userA, userB) => userA.Task - userB.Task).slice(0, length);
  return availableBots;
}

function processBot(bot, busy, job, equal = false){
  bot.Busy = busy;
  if (equal == true ? bot.Task = job : bot.Task += job);
  let Index = Bots.findIndex((obj) => obj.user.id == bot.user.id);  
  Bots[Index] = bot;
};

function safeUsers(id){
  if(id == client.user.id || SAFE_BOTS.includes(id) || Bots.some(e => e.user.id == id) || SAFE_USERS.includes(id) || SAFE_ROLES.some((_id) => id.roles.cache.has(_id))) return true;
  return false;
};

