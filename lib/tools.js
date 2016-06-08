var logger   = require('tracer').colorConsole();
var Clouderr = require('./errors/Clouderr');

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
  },
  randomInt    : function (max) {
    var rdm  = Math.random();
    var base = 1 / max;
    for (var i = 0; i < max; i++) {
      if (rdm >= i * base && rdm < (i + 1) * base) {
        return i;
      }
    }
    return -1;
  },
  wrapBody     : function (callback, body) {
    if (typeof body == 'string') {
      body = JSON.parse(body);
    }
    if (body.errno != 0) {
      var err = Clouderr.fromJson(body);
      callback(err);
    } else {
      callback(null, body.data);
    }
  }
};

module.exports = tools;