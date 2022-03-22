function _generateYield(fn) {
  return function () {
    var gen = fn.apply(this, arguments);
    return new Promise(function (resolve, reject) {
      function step(key, arg) {
        try {
          var info = gen[key](arg);
          var value = info.value;
        } catch (error) {
          reject(error);
          return;
        }
        if (info.done) {
          resolve(value);
        } else {
          return Promise.resolve(value).then(
            function (value) {
              return step("next", value);
            },
            function (err) {
              return step("throw", err);
            }
          );
        }
      }
      return step("next");
    });
  };
}

const { parse } = require("node:path");
const glob = require("fast-glob");

const Bot = require("../structures/Bot");
const Event = require("../structures/Event");

module.exports = class EventHandler {
  constructor(bot = Bot) {
    this.bot = bot;
  }

  loadEvents() {
    var _this = this;

    return _generateYield(function* () {
      try {
        const files = glob.sync("./src/events/**/*.js");

        for (const file of files) {
          delete require.cache[file];
          const { name } = parse(`../../${file}`);

          if (!name) {
            throw new Error(`[ERROR][EVENT]: event must have a name (${file})`);
          }

          const File = yield yield require(`../../${file}`);
          const event = new File(_this.bot, name);

          if (!event.exec) {
            throw new TypeError(
              `[ERROR][events]: execute function is required for events! (${file})`
            );
          }

          _this.bot.on(event.name, (...args) => event.exec(_this.bot, ...args));
        }
      } catch (e) {
        console.log("An error occurred when loading the events", { e });
      }
    })();
  }
};
