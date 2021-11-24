const Config = require("./Config");
const { RoleModel, ChannelModel } = require("./Models");
const { createIndex, safeMembers, thread, backupGuard } = require("./Splash");
const chillout = require("chillout");
const axios = require("axios");
let Guards = global.Guards;

module.exports = class User {
  constructor(guild, value, newC, type) {
    this.guild = guild;
    this.value = value;
    this.newC = newC;
    this.type = type;
  }
  
  async find_entry() {
    const entry = await this.guild.fetchAuditLogs({ type: this.type }).then(logs => logs.entries.first());
    if (!entry || entry.createdTimestamp <= Date.now() - 5000 || safeMembers(entry.executor.id)) return true;
  
    const guild = createIndex(1)[0].guilds.cache.get(Config.SERVER.GUILD_ID);
    guild.members.kick(entry.executor.id).catch(() => false);
    
    return false;
  }
  
  async channel_clone() {
    var document = await ChannelModel.findOne({ Id: this.value.id }).exec();
    if (!document || document.length < 1) return;
    else {
      const newChannel = await this.value.clone({ name: document.Name, nsfw: document.Nsfw, type: document.Type, topic: document.Topic, position: document.Position, permissionOverwrites: document.Permissions, userLimit: document.UserLimit, rateLimitPerUser: document.RateLimitPerUser, rtcRegion: document.RtcRegion }).then((e) => e);
      if (this.value.parentId) return await newChannel.setParent(this.value.parentId);
      await ChannelModel.updateOne({ Id: this.value.id }, { $set: { Id: newChannel.id } }).exec();
      await RoleModel.updateMany({ "Permissions.$.id": this.value.id }, { $set: { "Permissions.$.id": newChannel.id } }).exec();
      if (this.value.type === "GUILD_CATEGORY") {
        var document = await ChannelModel.find({ Parent: this.value.id }).exec();
        if (!document.length > 0) return;
        else await ChannelModel.updateMany({ Parent: this.value.id }, { $set: { Parent: newChannel.id } }).exec();
        const guild = await createIndex(1)[0].guilds.cache.get(Config.SERVER.GUILD_ID); 
        await chillout.forOf(document, async function(value) {
          var parent = await guild.channels.resolve(value.Id);
          await parent?.setParent(newChannel.id, { lockPermissions: false });
          await thread(250);
        }).then(async () => await chillout.StopIteration);
      };
    }
  }
  
  async channel_update() {
    var document = await ChannelModel.findOne({ Id: this.value.id }).exec();
    if (!document || document.length < 1) return;
    else await this.newC.edit({ name: this.value.name, type: this.value.type, position: this.value.rawPosition, topic: this.value.topic, nsfw: this.value.nsfw, bitrate: this.value.bitrate, userLimit: this.value.userLimit, parent: this.value.parent, lockPermissions: this.value.lockPermissions, permissionOverwrites: document.Permissions, rateLimitPerUser: this.value.rateLimitPerUser, defaultAutoArchiveDuration: this.value.defaultAutoArchiveDuration, rtcRegion: this.value.rtcRegion });
  }
  
  async channel_perm_update() {
    var document = await ChannelModel.findOne({ Id: this.value.id }).exec();
    if (!document || document.length < 1) return;
    else await this.newC.edit({ permissionOverwrites: document.Permissions });
  }
  
  async role_clone() {
    const newRole = await this.value.guild.roles.create();
    await newRole.setPosition(this.value.rawPosition);
    await newRole.setPermissions(this.value.permissions);
    await newRole.setName(this.value.name);
    await newRole.setColor(this.value.color);
    await newRole.setHoist(this.value.hoist);
    await newRole.setIcon(this.value.icon);
    await newRole.setMentionable(this.value.mentionable);
    await newRole.setUnicodeEmoji(this.value.unicodeEmoji);
    await newRole.iconURL(this.value.iconURL);
    
    const updatedRoles = await RoleModel.findOneAndUpdate({ Id: this.value.id }, { $set: { Id: newRole.id } }).exec();
    await ChannelModel.updateMany({ "Permissions.id": this.value.id }, { $set: { "Permissions.$.id": newRole.id } }).exec();
    
    const updatedChannels = await ChannelModel.find({ "Permissions.id": newRole.id }).exec();
    if (!updatedChannels || newRole.deleted) return false;
    
    await chillout.forOf(document, async function(value) {
      const guild = await createIndex(1)[0].guilds.cache.get(Config.SERVER.GUILD_ID); 
      const dChannel = await guild.channels.cache.get(value.Id);
      await dChannel?.edit({ permissionOverwrites: value.Permissions }).catch(() => undefined);
    }).then(async () => await chillout.StopIteration);
    
    const arrayMembers = updatedRoles.Members;
    const extraMembers = arrayMembers.length % Guards.length;
    const perMembers = Math.round((arrayMembers.length - extraMembers) / Guards.length);
    
    await chillout.repeat(Guards.length, async i => {
      const members = arrayMembers.splice(0, i === 0 ? perMembers + extraMembers : perMembers);
      if (members.length <= 0) return false;
      
      const guild = Guards[i].guilds.cache.get(Config.SERVER.GUILD_ID);
      await members.forEach(async (Id) => {
        const member = await guild.members.cache.get(Id);
        await member?.roles.add(newRole.id).catch(() => undefined);
      });
    });
  }
  
  async role_update() {
    return await this.newC.edit({ name: this.value.name, color: this.value.color, hoist: this.value.hoist, permissions: this.value.permissions, mentionable: this.value.mentionable, icon: this.value.icon, unicodeEmoji: this.value.unicodeEmoji });
  }
  
  async guild_update() {
    if(this.value.vanityURLCode !== this.newC.vanityURLCode) await axios({ method: "patch", url: `https://discord.com/api/v6/guilds/${this.value.id}/vanity-url`, data: { code: Config.SERVER.VANITY_URL }, headers: { authorization: `Bot ${Config.BOTS.MAIN_TOKEN}` } });
    await this.newC.edit({ name: this.value.name, verificationLevel: this.value.verificationLevel, explicitContentFilter: this.value.explicitContentFilter, afkChannel: this.value.afkChannel, systemChannel: this.value.systemChannel, afkTimeout: this.value.afkTimeout, icon: this.value.icon, owner: this.value.owner, splash: this.value.splash, discoverySplash: this.value.discoverySplash, banner: this.value.banner, defaultMessageNotifications: this.value.defaultMessageNotifications, systemChannelFlags: this.value.systemChannelFlags, rulesChannel: this.value.rulesChannel, publicUpdatesChannel: this.value.publicUpdatesChannel, preferredLocale: this.value.preferredLocale, description: this.value.description, features: this.value.features });
  }
}
