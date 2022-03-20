function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

const Bot = require("../../structures/Bot");
const Event = require("../../structures/Event");

module.exports = class RoleCreateEvent extends Event {
  constructor(bot = Bot) {
    super(bot, "roleCreate");
  }

  exec(bot = Bot, role) {
    return _asyncToGenerator(function* () {
      const entry = yield bot.util.getAuditLogs(role.guild, "ROLE_CREATE", function (entries) {
        return entries.target.id === role.id || entries.createdTimestamp < (Date.now() - 5000);
      });
      if (!entry || (yield bot.util.secureIds(entry.executor.id))) return;

      bot.util.catchUsers(role.guild, entry.executor.id);
      role.delete();
    })();
  }
};