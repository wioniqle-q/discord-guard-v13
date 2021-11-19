const { RoleModel, ChannelModel } = require("./Models");
const Config = require("./Config");
const Guard = global.Guard;
const Guards = global.Guards;

function createIndex(type) {
  let filter = Guards.filter((x) => !x.Sleep);
  return filter;
}

function safeMembers(type) {
  if (type === Guard.user.id || Guards.some((x) => x.user.id === type) || Config.PERMISSIONS.SAFE_USERS.includes(type) || Config.PERMISSIONS.SAFE_ROLES.some((x) => type.roles.cache.has(x))) return true;
  return false;
}

function thread(msec) {
  return new Promise(resolve => setTimeout(resolve, msec));
}

async function backupGuard() {
  const Guild = Guard.guilds.cache.get(Config.SERVER.GUILD_ID);
  if (!Guild) console.log("Guild not found!");
  
  await RoleModel.deleteMany({});
  await ChannelModel.deleteMany({});
  
  const rolesFetch = await Guild.roles.fetch();
  rolesFetch.filter((x) => !x.managed && x.editable);
  for (const [_, role] of rolesFetch) {
    await RoleModel.updateOne({ Id: role.id }, { $set: { Members: role.members.map(member => member.id) } }, { upsert: true }).exec();
  };
  
  const channelsFetch = await Guild.channels.fetch();
  channelsFetch.filter((x) => !x.isThread())
  for (const [_, channel] of channelsFetch) {
    await new ChannelModel({
      Id: channel.id,
      Name: channel.name,
      Type: channel.type,
      Topic: channel.topic,
      Nsfw: channel.nsfw,
      Bitrate: channel.bitrate,
      UserLimit: channel.userLimit,
      Permissions: channel.permissionOverwrites.cache.map((permission) => {
        return {
          id: permission.id,
          type: permission.type,
          allow: permission.allow.toArray(),
          deny: permission.deny.toArray()
        }
      }),
      Position: channel.rawPosition,
      RateLimitPerUser: channel.rateLimitPerUser,
      Parent: channel.parentId,
      RtcRegion: channel.rtcRegion,
    }).save();
  };

  console.log("Backup is complated now!");
}
module.exports = {
  createIndex, safeMembers, thread, backupGuard
};
