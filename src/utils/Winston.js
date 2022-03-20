const winston = require("winston");

const logConfiguration = {
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.timestamp({
      format: "MMM-DD-YYYY HH:mm:ss",
    }),
    winston.format.printf((info) => `${info.level}: ${info.message}`)
  ),
};
const logger = winston.createLogger(logConfiguration);

module.exports = class Winston {
  info(object) {
    return logger.info(object);
  }

  warn(object) {
    return logger.warn(object);
  }

  error(object) {
    return logger.error(object);
  }
};
