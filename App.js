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

cclient.on("roleDelete", async (deletedRole) => {
    let n;
    let i;
    if (!(true !== await deletedRole.guild.checkLog("ROLE_DELETE", true))) return;
    let newRole;
    newRole = await deletedRole.guild.roles.create({
        name: deletedRole.name,
        color: deletedRole.color,
        hoist: deletedRole.hoist,
        permissions: deletedRole.permissions,
        position: deletedRole.rawPosition,
        mentionable: deletedRole.mentionable,
        icon: deletedRole.icon ? deletedRole.icon : null,
        unicodeEmoji: deletedRole.unicodeEmoji
    });

    const updatedRoles = await RoleModel.findOneAndUpdate({ Id: deletedRole.id }, { Id: newRole.id });
    await ChannelModel.updateMany({ "Permissions.id": deletedRole.id }, { $set: { "Permissions.$.id": newRole.id } });

    const _Bot = giveBot(1)[0];

    const updatedChannels = await ChannelModel.find({ "Permissions.id": newRole.id });
    if (!updatedChannels || newRole.deleted) return false;

    for (; i < n; ++i){
        const equal = updatedChannels[i];
        let channel = _Bot.guilds.cache.get(SERVER_ID).channels.cache.get(equal.Id);
        if (channel) await channel.edit({ type: equal.Type, permissionOverwrites: equal.Permissions });
    };

    const arrayMembers = updatedRoles.Members;
    const extraMembers = arrayMembers.length % Bots.length;
    const perMembers = Math.round((arrayMembers.length - extraMembers) / Bots.length);

    let index = 0;
    n = Bots.length;
    for (; index < n; ++index){
        const members = arrayMembers.splice(0, index === 0 ? perMembers + extraMembers : perMembers);
        if (members.length <= 0) return;
        const {deleted} = newRole;
        if (deleted) break;

        const guild = Bots[index].guilds.cache.get(SERVER_ID);
        for (const Id of members) {
            const {deleted: deleted1} = newRole;
            if (deleted1) false;
            const roles = await RoleModel.find({ Members: Id });
            const member = guild.members.cache.get(Id);
            if (member) await member.roles.add(newRole.id);
        }
    };
});

client.on("channelCreate", async(channel) => {
    if (!(true !== await channel.guild.checkLog("CHANNEL_CREATE", true))) return;
    if (!channel["deleted"]) await channel.delete();
});

client.on("channelUpdate", async(oldChannel, newChannel) => {
    if (!(true !== await oldChannel.guild.checkLog("CHANNEL_UPDATE", true))) return;
    const x = await Promise.all([ChannelModel.findOne({Id: oldChannel.id})]);
    if (!x[0]) return;

    await newChannel.edit({ name: oldChannel.name, type: oldChannel.type, position: oldChannel["rawPosition"], topic: oldChannel.topic ? oldChannel.topic : null, nsfw: oldChannel.nsfw, bitrate: oldChannel.bitrate, userLimit: oldChannel.userLimit, parent: !oldChannel.parent ? null : oldChannel["parentId"], lockPermissions: false, permissionOverwrites: x[0].Permissions, rateLimitPerUser: oldChannel.rateLimitPerUser, defaultAutoArchiveDuration: oldChannel.defaultAutoArchiveDuration, rtcRegion: oldChannel.rtcRegion });
});

client.on("channelUpdate", async(oldChannel, newChannel) => {
    if (!(true !== await oldChannel.guild.checkLog("CHANNEL_OVERWRITE_UPDATE", true))) return;
    let x = await Promise.all([ChannelModel.findOne({Id: oldChannel.id})]);
    if(!x[0]) return;

    await newChannel.edit({ permissionOverwrites: x[0].Permissions });
});

client.on("channelDelete", async (channel) => {
    const {
        userLimit,
        topic,
        id,
        name,
        parent,
        rateLimitPerUser,
        rtcRegion,
        guild,
        rawPosition,
        nsfw,
        defaultAutoArchiveDuration,
        type
    } = channel;
    if (!(true !== await channel.guild.checkLog("CHANNEL_DELETE", true))) return;

    let newChannel;
    ChannelModel.find({ Id: id }, async (error, doc) => {
        if (error) console.log(error);
        const {channels: channels1} = channel["guild"];
        const {Permissions} = doc;
        [newChannel] = await Promise.all([channels1.create(name, {
            nsfw: nsfw,
            parent: parent,
            type: type,
            topic: topic,
            position: rawPosition,
            permissionOverwrites: Permissions,
            userLimit: userLimit,
            rateLimitPerUser: rateLimitPerUser,
            defaultAutoArchiveDuration: defaultAutoArchiveDuration,
            rtcRegion: rtcRegion
        })]);
        await RoleModel.updateMany({ "Permissions.$.id": id }, { $set: { "Permissions.$.id": newChannel.id } }),
            await ChannelModel.updateOne({ Id: id }, { Id: newChannel.id });

        if (newChannel.type === "GUILD_CATEGORY") {
            let Bot = giveBot(1)[0];
            ChannelModel.find({ Parent: id }, async (err, res) => {
                let i = 0, n = res.length;
                for (; i < n; ++i){
                    const equal = res[i];
                    let channels;
                    channels = Bot.guilds.cache.get(SERVER_ID).channels.cache.get(equal.Id);
                    if (channels) await resolveTimeout(await channels.setParent(newChannel.id, { lockPermissions: false }), channels.length * 750);
                };
                await ChannelModel.updateMany({ Parent: id }, { Parent: newChannel.id });
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

Object.prototype.checkLog = async function (type, close = false) {
    const [Log] = await Promise.all([this.fetchAuditLogs({
        limit: 1,
        type
    }).then((this_audit) => {
        return this_audit.entries.first();
    })]);
    if (!Log) return true;
    let Id = Log["executor"];
    if (safeUsers(Id) || Date.now() - Log["createdTimestamp"] > 5000) return true;
    let Bot = giveBot(1)[0];
    processBot(Bot, true, 1);
    let Guild;
    const {cache: cache1} = Bot.guilds;
    Guild = cache1.get(SERVER_ID);
    const {cache} = Guild["members"];
    let Member = cache.get(Id);
    if (Member ? Member.kickable : undefined) {
        Member.kick().catch(() => false);
    }
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

