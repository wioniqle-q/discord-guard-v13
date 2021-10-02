const { Permissions } = require("discord.js");
const moment = require("moment");
const { SAFE_USERS, SAFE_BOTS, SERVER_ID } = require("./Configurations.json").DEFAULTS;
const { RoleModel, ChannelModel } = require("./Models");
const dangerPerms = ["ADMINISTRATOR", "KICK_MEMBERS", "MANAGE_GUILD", "BAN_MEMBERS", "MANAGE_ROLES", "MANAGE_WEBHOOKS", "MANAGE_CHANNELS"];
const client = global.Client;

async function roleBackup(guild) {
  try {
    await RoleModel.deleteMany({}).exec();
    guild.roles.cache.forEach((_role) => {
      if (Object.keys(_role.members.size) === 0) return;
      RoleModel.updateOne({ Id: role.id }, { $set: { Members: role.members.map(member => member.id) } }, { upsert: true }).exec();
    });
    console.log("Role data is saved!");
  } catch ({}) {
    Promise.reject(null);
  };
};

async function channelBackup(guild) {
  try {
    await ChannelModel.deleteMany({}).exec();
    guild.channels.cache.forEach(async (_channel) => {
      await new ChannelModel({
        Id: channel.id,
        Type: channel.type,
        Parent: channel.parent ? channel.parentId: null,
        Permissions: [...channel.permissionOverwrites.cache.values()].map((_permissions) => {
          return {
            id: _permissions.id,
            type: _permissions.type,
            allow: new Permissions(_permissions.allow.bitfield).toArray(),
            deny: new Permissions(_permissions.deny.bitfield).toArray()
          };
        })
      }).save();
    });
    console.log("Channel data is saved!");
  } catch ({}) {
    Promise.reject(null);
  };
};

async function closeAllPermissions(Guild) {
  try {
    Guild.roles.cache.filter((role) => role.editable && dangerPerms.some((x) => role.permissions.has(x))).forEach(async (equal) => {
      await equal.setPermissions(0n);
    });
  } catch ({}) {
    Promise.reject(null);
  };
};

module.exports = {
  roleBackup, channelBackup, closeAllPermissions
};
