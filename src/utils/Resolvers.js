const { ChannelType } = require("discord-api-types/v9");

module.exports = class Resolvers {
  resolveChannelType(key) {
    switch (key) {
      case "GUILD_TEXT":
        return ChannelType.GuildText;
      case "GUILD_VOICE":
        return ChannelType.GuildVoice;
      case "GUILD_CATEGORY":
        return ChannelType.GuildCategory;
      default:
        return unknownKeyStrategy(key);
    }
  }
}

function unknownKeyStrategy(val) {
  throw new Error(`Could not resolve enum value for ${val}`);
}