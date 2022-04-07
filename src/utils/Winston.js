var $jscomp = $jscomp || {};
$jscomp.scope = {};
$jscomp.createTemplateTagFirstArg = function(a) {
  return a.raw = a;
};
$jscomp.createTemplateTagFirstArgWithRaw = function(a, b) {
  a.raw = b;
  return a;
};
var winston = require("winston"), logConfiguration = {transports:[new winston.transports.Console()], format:winston.format.combine(winston.format.timestamp({format:"MMM-DD-YYYY HH:mm:ss",}), winston.format.printf(function(a) {
  return a.level + ": " + a.message;
})),}, logger = winston.createLogger(logConfiguration), Input_0$classdecl$var0 = function() {
};
Input_0$classdecl$var0.prototype.info = function(a) {
  return logger.info(a);
};
Input_0$classdecl$var0.prototype.warn = function(a) {
  return logger.warn(a);
};
Input_0$classdecl$var0.prototype.error = function(a) {
  return logger.error(a);
};
module.exports = Input_0$classdecl$var0;
