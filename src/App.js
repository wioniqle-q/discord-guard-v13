const { Discord, Guild, Client, Intents } = require("discord.js");
const mongoose = require("mongoose");
const axios = require("axios");
const chillout = require("chillout");

const Guard = global.Guard = new Client({ intents: [32767] });
const Guards = global.Guards = [];
let Danger = false;

const Config = require("./Config");
const { RoleModel, ChannelModel } = require("./Models");
const { createIndex, safeMembers, thread, backupGuard } = require("./Splash");
const dangerPermissions = ["ADMINISTRATOR", "KICK_MEMBERS", "MANAGE_GUILD", "BAN_MEMBERS", "MANAGE_ROLES", "MANAGE_WEBHOOKS", "MANAGE_CHANNELS"];

mongoose.connect(Config.DATABASE.URL.replace("<dbname>", Config.DATABASE.NAME), { autoIndex: false, connectTimeoutMS: 10000, family: 4, useUnifiedTopology: true, useNewUrlParser: true });

mongoose.connection.on("connected", () => {
  console.log("Mongoose connected!");
});

for (const Token of Config.BOTS.TOKENS) {
  const Bot = new Client({ intents: [32767] });
  Bot.once("ready", () => {
    Bot.Sleep = false;
    Guards.push(Bot);
  });  
  Bot.login(Token);
};

Guard.once("ready", async () => {
  console.log("Main bot ready!");
  await backupGuard();
  setInterval(async () => {
    if(!Danger) await backupGuard();
  }, 60 * 1000);
});

Guard.login(Config.BOTS.MAIN_TOKEN);

/**
 * @param {string} type
 */
Guild.prototype.find_entry = async function (type) {
  const entry = await this.fetchAuditLogs({ limit: 1, type: type }).then((audit) => audit.entries.first());
  if (!entry || Date.now() - entry.createdTimestamp > 5000 || safeMembers(entry.executor.id)) return true;

  const guild = createIndex(1)[0].guilds.cache.get(Config.SERVER.GUILD_ID);
  await guild.members.kick(entry.executor.id).catch(() => false);
  
  return false;
};

Guard.on("channelDelete", async (channel) => {
  if (await channel.guild.find_entry("CHANNEL_DELETE", true) === true) return;
  Danger = true;
  
  let document = await ChannelModel.findOne({ Id: channel.id }).lean();
  if (!document) return;
  
  await channel.clone({
    name: document.Name,
    nsfw: document.Nsfw,
    type: document.Type,
    topic: document.Topic,
    position: document.Position,
    permissionOverwrites: document.Permissions,
    userLimit: document.UserLimit,
    rateLimitPerUser: document.RateLimitPerUser,
    rtcRegion: document.RtcRegion
  }).then(async (newChannel) => {
    await ChannelModel.updateOne({ Id: channel.id }, { $set: { Id: newChannel.id } }).exec();
    await RoleModel.updateMany({ "Permissions.$.id": channel.id }, { $set: { "Permissions.$.id": newChannel.id } }).exec();
  
    if (channel.parentId) await newChannel.setParent(channel.parentId);
    
    if (channel.type === "GUILD_CATEGORY") {
      let documents = await ChannelModel.find({ Parent: channel.id }).lean();
      if (!documents) return;
    
      await ChannelModel.updateMany({ Parent: channel.id }, { $set: { Parent: newChannel.id } }).exec();
      let guild = createIndex(1)[0].guilds.cache.get(Config.SERVER.GUILD_ID); 
      
      await chillout.forEach(documents, async Id => {
        const parent = guild.channels.cache.get(Id.Id);
        await parent?.setParent(newChannel.id, { lockPermissions: false });
      }).then(() => chillout.StopIteration);
    };
  });
});

Guard.on("channelCreate", async (channel) => {
  if (await channel.guild.find_entry("CHANNEL_CREATE", true)) return;
  channel.deleted ? true : await channel.delete();
});

Guard.on("channelUpdate", async (oldChannel, newChannel) => {
  if (await oldChannel.guild.find_entry("CHANNEL_UPDATE", true)) return;
  
  const document = await ChannelModel.findOne({ Id: oldChannel.id }).lean();
  if (!document) return;
  
  await newChannel.edit({
    name: oldChannel.name,
    type: oldChannel.type,
    position: oldChannel.rawPosition,
    topic: oldChannel.topic,
    nsfw: oldChannel.nsfw,
    bitrate: oldChannel.bitrate,
    userLimit: oldChannel.userLimit,
    parent: oldChannel.parent,
    lockPermissions: oldChannel.lockPermissions,
    permissionOverwrites: document.Permissions,
    rateLimitPerUser: oldChannel.rateLimitPerUser,
    defaultAutoArchiveDuration: oldChannel.defaultAutoArchiveDuration,
    rtcRegion: oldChannel.rtcRegion
  });
});

Guard.on("channelUpdate", async (oldChannel, newChannel) => {
  if (await oldChannel.guild.find_entry("CHANNEL_OVERWRITE_UPDATE", true)) return;
  
  const document = await ChannelModel.findOne({ Id: oldChannel.id }).lean();
  if (!document) return; 

  await newChannel.edit({ permissionOverwrites: document.Permissions });
});

Guard.on("roleDelete", async (role) => {
  if (await role.guild.find_entry("ROLE_DELETE", true) === true) return;
  Danger = true;
  
  let newRole = await role.guild.roles.create({
    name: role.name,
    color: role.color,
    hoist: role.hoist,
    permissions: role.permissions,
    position: role.rawPosition,
    mentionable: role.mentionable,
    icon: role.icon,
    unicodeEmoji: role.unicodeEmoji
  });
  
  const updatedRoles = await RoleModel.findOneAndUpdate({ Id: role.id }, { $set: { Id: newRole.id} }).exec();
  await ChannelModel.updateMany({ "Permissions.id": role.id }, { $set: { "Permissions.$.id": newRole.id } }).exec();
  
  const updatedChannels = await ChannelModel.find({ "Permissions.id": newRole.id }).lean();
  if (!updatedChannels || newRole.deleted) return false;
  
  const guilds = await createIndex(1)[0].guilds.cache.get(Config.SERVER.GUILD_ID);
  
  await chillout.forEach(updatedChannels, async overwrite => {
     const dChannel = await guilds.channels.cache.get(overwrite.Id);
    await dChannel?.edit({ permissionOverwrites: overwrite.Permissions });
  }).then(() => chillout.StopIteration);
  
  const arrayMembers = updatedRoles.Members;
  const extraMembers = arrayMembers.length % Guards.length;
  const perMembers = Math.round((arrayMembers.length - extraMembers) / Guards.length);
  
  await chillout.repeat(Guards.length, async i => {
    const members = arrayMembers.splice(0, i === 0 ? perMembers + extraMembers : perMembers);
    if (members.length <= 0) return false;
    
    const guild = Guards[i].guilds.cache.get(Config.SERVER.GUILD_ID);
    await members.forEach(async Id => {
      const member = await guild.members.cache.get(Id);
      await member?.roles.add(newRole.id);
    });
  });
});

Guard.on("roleCreate", async (role) => {
  if (await role.guild.find_entry("ROLE_CREATE", true)) return;
  role.deleted ? true : await role.delete(); 
});

Guard.on("roleUpdate", async (oldRole, newRole) => {
  if (await oldRole.guild.find_entry("ROLE_UPDATE", true)) return;
  
  let bot = createIndex(1)[0].guilds.cache.get(Config.SERVER.GUILD_ID);
  await bot.roles.edit(newRole.id, {
    name: oldRole.name,
    color: oldRole.color,
    hoist: oldRole.hoist,
    position: oldRole.rawPosition,
    permissions: oldRole.permissions,
    mentionable: oldRole.mentionable,
    icon: oldRole.icon,
    unicodeEmoji: oldRole.unicodeEmoji
  });
});

Guard.on("guildUpdate", async (oldGuild, newGuild) => {
  if (await oldGuild.find_entry("GUILD_UPDATE", true) === true) return;
  
  if(oldGuild.vanityURLCode !== newGuild.vanityURLCode) await axios({ method: "patch", url: `https://discord.com/api/v6/guilds/${oldGuild.id}/vanity-url`, data: { code: Config.SERVER.VANITY_URL }, headers: { authorization: `Bot ${Config.BOTS.MAIN_TOKEN}` } });
  await newGuild.edit({ name: oldGuild.name, verificationLevel: oldGuild.verificationLevel, explicitContentFilter: oldGuild.explicitContentFilter, afkChannel: oldGuild.afkChannel, systemChannel: oldGuild.systemChannel, afkTimeout: oldGuild.afkTimeout, icon: oldGuild.icon, owner: oldGuild.owner, splash: oldGuild.splash, discoverySplash: oldGuild.discoverySplash, banner: oldGuild.banner, defaultMessageNotifications: oldGuild.defaultMessageNotifications, systemChannelFlags: oldGuild.systemChannelFlags, rulesChannel: oldGuild.rulesChannel, publicUpdatesChannel: oldGuild.publicUpdatesChannel, preferredLocale: oldGuild.preferredLocale, description: oldGuild.description, features: oldGuild.features });
});

Guard.on("guildBanAdd", async (member) => {
  if (await member.guild.find_entry("MEMBER_BAN_ADD", true)) return;
  await member.guild.bans.remove(member.user.id).catch(() => false);
});

Guard.on("guildMemberRemove", async (member) => {
  if (await member.guild.find_entry("MEMBER_KICK", true)) return;
});

Guard.on("guildMemberAdd", async (member) => {
  if (!member.user.bot) return;
  if (await member.guild.find_entry("BOT_ADD", true)) return;
  await member.kick().catch(() => false);
});

Guard.on("emojiCreate", async (emoji) => {
  if (await emoji.guild.find_entry("EMOJI_CREATE", true)) return;
  await emoji.delete();
});

Guard.on("emojiUpdate", async (oldEmoji, newEmoji) => {
  if (await oldEmoji.guild.find_entry("EMOJI_UPDATE", true)) return;
  await newEmoji.edit({ name: oldEmoji.name });
});

Guard.on("emojiDelete", async (emoji) => {
  if (await emoji.guild.find_entry("EMOJI_DELETE", true)) return;
  await emoji.guild.emojis.create(emoji.url, emoji.name);
});

Guard.on("webhookUpdate", async (channel) => {
  if (await channel.guild.find_entry("WEBHOOK_CREATE", true)) return;
  await channel.fetchWebhooks().then((x) => x.forEach((e) => e.delete())).catch(() => false);
});

Guard.on("guildUnavailable", async (guild) => {
  let bot = createIndex(1)[0].guilds.cache.get(Config.SERVER.GUILD_ID);
  
  let roles = await guild.roles.cache.filter((role) => role.editable && dangerPermissions.some((x) => role.permissions.has(x)));
  roles.forEach(async (x) => await x.setPermissions(0n).catch(() => false));
  
  let channel = bot.channels.cache.get(Config.SERVER.LOG_CHANNEL);
  if(channel) channel.send(`Sunucu kullanılamaz hale geldiği için tüm yetkileri kapadım.`);
});
