function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

const Bot = require("../../structures/Bot");
const Event = require("../../structures/Event");

module.exports = class RoleUpdateEvent extends Event {
  constructor(bot = Bot) {
    super(bot, "roleUpdate");
  }

  exec(bot = Bot, oldRole, newRole) {
    return _asyncToGenerator(function* () {
      const entry = yield bot.util.getAuditLogs(newRole.guild, "ROLE_UPDATE", function (entries) {
        return entries.target.id === newRole.id || entries.createdTimestamp < (Date.now() - 5000);
      });
      if (!entry || (yield bot.util.secureIds(entry.executor.id))) return;

      bot.util.catchUsers(newRole.guild, entry.executor.id);
      bot.util.beforeRoles(oldRole, newRole);
    })();
  }
};