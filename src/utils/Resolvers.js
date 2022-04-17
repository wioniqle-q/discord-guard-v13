var $jscomp = $jscomp || {};
$jscomp.scope = {};
$jscomp.createTemplateTagFirstArg = function(a) {
  return a.raw = a;
};
$jscomp.createTemplateTagFirstArgWithRaw = function(a, b) {
  a.raw = b;
  return a;
};
var $jscomp$destructuring$var0 = require("discord-api-types/v10"), ChannelType = $jscomp$destructuring$var0.ChannelType, Input_0$classdecl$var0 = function() {
};
Input_0$classdecl$var0.prototype.resolveChannelType = function(a) {
  switch(a) {
    case "GUILD_TEXT":
      return ChannelType.GuildText;
    case "GUILD_VOICE":
      return ChannelType.GuildVoice;
    case "GUILD_CATEGORY":
      return ChannelType.GuildCategory;
    default:
      return unknownKeyStrategy(a);
  }
};
module.exports = Input_0$classdecl$var0;
function unknownKeyStrategy(a) {
  throw Error("Could not resolve enum value for " + a);
}
;
