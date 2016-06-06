var logger = require('tracer').colorConsole();

var tools = {
  info         : function (msg) {
    if (process.env.debug) {
      logger.info(msg);
    }
  },
  transferToUrl: function (camelName) {
    var newName = "";
    for (var ch of camelName) {
      if (ch.charCodeAt() >= 65 && ch.charCodeAt() <= 90) {
        newName += "-" + ch.toLowerCase();
      } else {
        newName += ch;
      }
    }
    return newName;
  }

};

module.exports = tools;