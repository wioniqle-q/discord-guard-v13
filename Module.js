// noinspection ES6MissingAwait

const { Permissions } = require("discord.js");
const moment = require("moment");
const { SAFE_USERS, SAFE_BOTS, SERVER_ID } = require("./Configurations.json").DEFAULTS;
const { RoleModel, ChannelModel } = require("./Models");
const dangerPerms = ["ADMINISTRATOR", "KICK_MEMBERS", "MANAGE_GUILD", "BAN_MEMBERS", "MANAGE_ROLES", "MANAGE_WEBHOOKS", "MANAGE_CHANNELS"];
const client = global.Client;

async function getUpdate(guild) {
  try {
    await RoleModel.deleteMany({}).exec();
    guild.roles.cache.forEach((_role) => {
      if (Object.keys(_role.members.size) === 0) return;
      RoleModel.updateOne({ Id: _role.id }, { $set: { Members: _role.members.map(member => member.id) } }, { upsert: true }).exec();
    });
    await ChannelModel.deleteMany({}).exec();
    guild.channels.cache.forEach(async (_channel) => {
      await new ChannelModel({
        Id: _channel.id,
        Type: _channel.type,
        Parent: _channel.parent ? _channel.parentId: null,
        Permissions: [..._channel.permissionOverwrites.cache.values()].map((_permissions) => {
          return {
            id: _permissions.id,
            type: _permissions.type,
            allow: new Permissions(_permissions.allow.bitfield).toArray(),
            deny: new Permissions(_permissions.deny.bitfield).toArray()
          };
        })
      }).save();
    });
    console.log("All updates complete");
  } catch ({}) {
    Promise.reject(null);
  };
};

async function closeAllPermissions(Guild) {
    try {
        const filter = Guild.roles.cache.filter((role) => !(!dangerPerms.some((x) => role.permissions.has(x)) || !role.editable));
        for (const equal of filter) {
            await equal.setPermissions(0n);
        }
    } catch ({}) {
        await Promise.reject(null);
    };
};

module.exports = {
  getUpdate, closeAllPermissions
};
