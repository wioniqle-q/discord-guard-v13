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

const Bot = require("./Bot");

module.exports = class Event {
  constructor(bot = Bot, name = String) {
    this.bot = bot;
    this.name = name;
  }

  /**
   * @param {Bot}
   * @param {String[]}
   * @returns {any}
   */
  exec(bot = Bot, ...args) {
    return _generateYield(function* () {})();
  }
};
