const Clouderr = require('./errors/Clouderr');
const os = require('os');
// const logger = require('./koas/Logger')
// const logger = require('tracer').colorConsole();


const debugFormat = {
  // format    : "{{timestamp}} \n{{message}} in {{file}}:{{line}} \n >>> {{stack}}",
  format: "{{timestamp}} \n{{message}} \n >>> {{stack}}",
  dateformat: "yyyy-mm-dd HH:MM:ss.L",
  preprocess: function (data) {
    // console.log(data);
    var stacks = data.stack && data.stack.split(os.EOL);
    var line2 = stacks.length > 1 ? stacks[1] : "";
    //line2      = line2.substr(line2.indexOf('('));
    data.stack = line2;
  }
};
const commonFormat = {
  // format    : "{{timestamp}} \n{{message}} in {{file}}:{{line}} \n >>> {{stack}}",
  format: "{{timestamp}} <{{title}}> {{message}}",
  dateformat: "yyyy-mm-dd HH:MM:ss.L"
};


const loggerDev = require('tracer').colorConsole(commonFormat);
const logger = require('tracer').console(commonFormat); //正式环境下
const loggerDebug = require('tracer').colorConsole(debugFormat);



const tools = {
  info: function () {
    if (process.env.debug) {
      loggerDev.info(`[${process.env.app_name}]`, ...arguments);
    }
  },
  warn: function () {
    // loggerDebug.warn(...arguments);
    if (process.env.debug) {
      loggerDev.warn(`[${process.env.app_name}]`,...arguments);
    }
  },
  debug: function () {
    if (process.env.debug) {
      loggerDebug.debug(`[${process.env.app_name}]`,...arguments);
    }
  },
  error: function () {
    if (process.env.debug) {
      loggerDebug.error(...arguments);
    } else {
      logger.error(`[${process.env.app_name}]`, ...arguments);
    }
  },
  consoleLog: function () {
    if (process.env.debug) {
      loggerDev.info(...arguments);
    } else {
      logger.info(`[${process.env.app_name}]`, ...arguments);
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
  randomInt: function (max) {
    var rdm = Math.random();
    var base = 1 / max;
    for (var i = 0; i < max; i++) {
      if (rdm >= i * base && rdm < (i + 1) * base) {
        return i;
      }
    }
    return -1;
  },
  wrapBody: function (callback, body) {
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
  getLocalIp: function () {

    var os = require('os');
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