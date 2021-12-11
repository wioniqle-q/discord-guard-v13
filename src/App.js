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
const { bootUpdate } = require("./Updater");
const Base = require("./Base");
const dangerPermissions = ["ADMINISTRATOR", "KICK_MEMBERS", "MANAGE_GUILD", "BAN_MEMBERS", "MANAGE_ROLES", "MANAGE_WEBHOOKS", "MANAGE_CHANNELS"];

mongoose.connect(Config.DATABASE.URL.replace("myFirstDatabase", Config.DATABASE.NAME), {
  "auth": {
    "username": "",
    "password": ""
  },
  "authSource": "admin",
  keepAlive: true, autoIndex: false, connectTimeoutMS: 10000, family: 4, useUnifiedTopology: true, useNewUrlParser: true
}).then(result => console.log("Mongoose connected!")).catch(err => console.log(err));

bootUpdate();

for (const Token of Config.BOTS.TOKENS) {
  const Bot = new Client({ intents: [32767] });
  Bot.once("ready", () => {
    Bot.Sleep = false;
    Guards.push(Bot);
    Guards.user.setPresence({ activities: [{ name: Config.BOTS.STATE }] });
  });  
  Bot.login(Token).then(() => true);
};

Guard.once("ready", async () => {
  console.log("Main bot ready!");
  Guard.user.setPresence({ activities: [{ name: Config.BOTS.STATE }] });
  await backupGuard();
  setInterval(async () => {
    if(!Danger) await backupGuard();
  }, 60 * 1000);
});
Guard.login(Config.BOTS.MAIN_TOKEN).then(() => true);

process.on("unhandledRejection", err => {
	if(err.message && err.message.startsWith("Request timed out")) return;
	try {
		let resp = JSON.parse(err.response);
		if(~[0, 10003, 10008, 40005, 50001, 50013].indexOf(resp.code)) return;
		else throw err;
	} catch(err2) {
    console.error(err.stack);
	}
});

process.on("SIGINT", function(){
  mongoose.connection.close(function(){
    process.exit(0);
  });
});

process.on("uncaughtException", (error) => {});

Guard.on("channelDelete", async (channel) => {
  const base = new Base(channel.guild, channel, "CHANNEL_DELETE");
  if (await base.find_entry() == true) return;
  Danger = true;
  return await base.channel_clone();
});

Guard.on("channelCreate", async channel => {
  if (channel.deleted) return;
  const base = new Base(channel.guild, "CHANNEL_CREATE");
  if (await base.find_entry() == true) return;
  else return await channel.delete();
});

Guard.on("channelUpdate", async (oldChannel, newChannel) => {
  const base = new Base(oldChannel.guild, oldChannel, newChannel, "CHANNEL_UPDATE");
  if (await base.find_entry() == true) return;
  else return await base.channel_update();
});

Guard.on("channelUpdate", async (oldChannel, newChannel) => {
  const base = new Base(oldChannel.guild, oldChannel, newChannel, "CHANNEL_OVERWRITE_UPDATE");
  if (await base.find_entry() == true) return;
  else return await base.channel_perm_update();
});

Guard.on("roleDelete", async (role) => {
  const base = new Base(role.guild, role, null, "ROLE_DELETE");
  if (await base.find_entry() == true) return;
  Danger = true;
  return await base.role_clone();
});

Guard.on("roleCreate", async (role) => {
  if (role.deleted) return;
  const base = new Base(role.guild, "ROLE_CREATE");
  if (await base.find_entry() == true) return;
  else return await role.delete(); 
});

Guard.on("roleUpdate", async (oldRole, newRole) => {
  const base = new Base(oldRole.guild, oldRole, newRole, "ROLE_UPDATE");
  if (await base.find_entry() == true) return;
  else return await base.role_update();
});

Guard.on("guildUpdate", async (oldGuild, newGuild) => {
  const base = new Base(oldGuild, oldGuild, newGuild, "GUILD_UPDATE");
  if (await base.find_entry() == true) return;
  else return await base.guild_update();
});

Guard.on("guildBanAdd", async (member) => {
  const base = new Base(member.guild, "MEMBER_BAN_ADD");
  if (await base.find_entry() == true) return;
  else return await member.guild.bans.remove(member.user.id).catch(() => false);
});

Guard.on("guildMemberRemove", async (member) => {
  const base = new Base(member.guild, "MEMBER_KICK");
  if (await base.find_entry() == true) return;
});

Guard.on("guildMemberAdd", async (member) => {
  if (!member.user.bot) return;
  const base = new Base(member.guild, "BOT_ADD");
  if (await base.find_entry() == true) return;
  else return await member.kick().catch(() => false);
});

Guard.on("emojiCreate", async (emoji) => {
  const base = new Base(emoji.guild, "EMOJI_CREATE");
  if (await base.find_entry() == true) return;
  else return await emoji.delete();
});

Guard.on("emojiUpdate", async (oldEmoji, newEmoji) => {
  const base = new Base(oldEmoji.guild, "EMOJI_UPDATE");
  if (await base.find_entry() == true) return;
  else return await newEmoji.edit({ name: oldEmoji.name });
});

Guard.on("emojiDelete", async (emoji) => {
  const base = new Base(emoji.guild, "EMOJI_DELETE");
  if (await base.find_entry() == true) return;
  else return await emoji.guild.emojis.create(emoji.url, emoji.name);
});

Guard.on("webhookUpdate", async (channel) => {
  const base = new Base(channel.guild, "WEBHOOK_CREATE");
  if (await base.find_entry() == true) return;
  else return await channel.fetchWebhooks().then((x) => x.forEach((e) => e.delete())).catch(() => false);
});

Guard.on("guildUnavailable", async (guild) => {
  let bot = createIndex(1)[0].guilds.cache.get(Config.SERVER.GUILD_ID);
  
  let roles = await guild.roles.cache.filter((role) => role.editable && dangerPermissions.some((x) => role.permissions.has(x)));
  roles.forEach(async (x) => await x.setPermissions(0n).catch(() => false));
  
  let channel = bot.channels.cache.get(Config.SERVER.LOG_CHANNEL);
  if(channel) channel.send(`Sunucu kullanılamaz hale geldiği için tüm yetkileri kapadım.`);
});
