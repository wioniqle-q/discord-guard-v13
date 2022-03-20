const Bot = require("../../structures/Bot");
const Event = require("../../structures/Event");

module.exports = class ReadyEvent extends Event {
  constructor(bot = Bot) {
    super(bot, "ready");
  }

  async exec(bot = Bot) {
    bot.winston.info("Main bot is running");
    if (bot.danger === false) await bot.util.getBackup();   
  }
};