const { Permissions } = require("discord.js");
const moment = require("moment");
const { SAFE_USERS, SAFE_BOTS, SERVER_ID } = require("./Configurations.json").DEFAULTS;
const { RoleModel, ChannelModel } = require("./Models");
const dangerPerms = ["ADMINISTRATOR", "KICK_MEMBERS", "MANAGE_GUILD", "BAN_MEMBERS", "MANAGE_ROLES", "MANAGE_WEBHOOKS", "MANAGE_CHANNELS"];
const client = global.Client;

async function roleBackup(guild) {
  await RoleModel.deleteMany({});
  guild.roles.cache.forEach(role => {
    if(role.members.size <= 0) return;
    RoleModel.updateOne({ Id: role.id }, { $set: { Members: role.members.map(member => member.id) } }, { upsert: true }).exec();
  });
  console.log("Role data is saved!");
};

async function channelBackup(guild) {
  await ChannelModel.deleteMany({});
  guild.channels.cache.forEach(async function (channel){
    await new ChannelModel({
      Id: channel.id,
      Type: channel.type,
      Parent: channel.parent ? channel.parentId: null,
      Permissions: [...channel.permissionOverwrites.cache.values()].map(function(permissions){
        return {
          id: permissions.id,
          type: permissions.type,
          allow: new Permissions(permissions.allow.bitfield).toArray(),
          deny: new Permissions(permissions.deny.bitfield).toArray()
        }
      })
    }).save();
  });
  console.log("Channel data is saved!");
};

async function closeAllPermissions(Guild) {
  Guild.roles.cache.filter((role) => role.editable && dangerPerms.some((x) => role.permissions.has(x))).forEach(async (require) => {
    await require.setPermissions(0n);
  });
};

module.exports = {
  roleBackup, channelBackup, closeAllPermissions
};
