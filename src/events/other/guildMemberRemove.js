function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

const Bot = require("../../structures/Bot");
const Event = require("../../structures/Event");

module.exports = class GuildMemberRemovedEvent extends Event {
  constructor(bot = Bot) {
    super(bot, "guildMemberRemove");
  }

  async exec(bot = Bot, member) {
    const entry = await member.guild.fetchAuditLogs({ limit: 1, type: 'MEMBER_KICK' }).then((audit) => audit.entries.first());
    if (!entry || (await bot.util.secureIds(entry.executor.id))) return;

    bot.util.catchUsers(member.guild, entry.executor.id);
  }
};