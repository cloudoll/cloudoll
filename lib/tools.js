var logger   = require('tracer').colorConsole();
var Clouderr = require('./errors/Clouderr');

var tools = {
  info         : function (msg) {
    if (process.env.debug) {
      logger.info(...arguments);
    }
  },
  warn         : function () {
    if (process.env.debug) {
      logger.warn(...arguments);
    }
  },
  error        : function () {
    if (process.env.debug) {
      logger.error(...arguments);
    }
  },
  consoleLog   : function () {
    if (process.env.debug) {
      console.log(...arguments);
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
  },
  getLocalIp   : function () {

    var os     = require('os');
    var ifaces = os.networkInterfaces();

    // var xresult = [];
    for (var enxx in ifaces) {
      var xip = ifaces[enxx];
      for (var en of xip) {
        if (en.family === 'IPv4' && !en.internal) {
          return en.address;
          // xresult.push(en.address);
        }
      }
    }

  }
};

module.exports = tools;