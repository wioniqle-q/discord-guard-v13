function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

const Bot = require("../../structures/Bot");
const Event = require("../../structures/Event");

module.exports = class GuildUpdateEvent extends Event {
  constructor(bot = Bot) {
    super(bot, "guildUpdate");
  }

  exec(bot = Bot, oldGuild, newGuild) {
    return _asyncToGenerator(function* () {
      if (oldGuild.banner === newGuild.banner && oldGuild.icon === newGuild.icon && oldGuild.name === newGuild.name) return;

      const entry = yield bot.util.getAuditLogs(newGuild, "GUILD_UPDATE", function (entries) {
        return entries.target.id === newGuild.id || entries.createdTimestamp < (Date.now() - 5000);
      });
      if (!entry || (yield bot.util.secureIds(entry.executor.id))) return;

      bot.util.catchUsers(newGuild, entry.executor.id);
      
      yield newGuild.edit({
        name: oldGuild.name,
        icon: oldGuild.iconURL({ dynamic: true }),
        banner: oldGuild.bannerURL()
      });
      
      //if (oldGuild.vanityURLCode !== newGuild.vanityURLCode) yield axios({ method: "patch", url: `https://discord.com/api/v9/guilds/${newGuild.id}/vanity-url`, data: { code: "frekans" }, headers: { authorization: `Bot ${bot.MAIN_TOKEN}` } });
    })();
  }
};