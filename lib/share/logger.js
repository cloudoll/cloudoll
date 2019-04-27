const os = require('os');
const colors = require('colors');

const logger = require('tracer').colorConsole({
  format: "\n{{timestamp}} \n{{message}} in {{file}} \n{{stack}}",
  dateformat: "yyyy-mm-dd HH:MM:ss.L",
  preprocess: function (data) {
    let stacks = data.stack && data.stack.split(os.EOL);
    data.stack = stacks.length > 1 ? stacks[1] : "";
  }
});

const logger2 = require('tracer').colorConsole({
  format: "{{timestamp}} - {{message}}",
  dateformat: "yyyy-mm-dd HH:MM:ss.L",
  filters: {
    info: [colors.rainbow, colors.bold],
    error: [colors.red, colors.bold]
  }
});

const logger3 = require('tracer').colorConsole(
  {
    format: "{{timestamp}} <{{title}}> {{message}}",
    dateformat: "yyyy-mm-dd HH:MM:ss.L"
  });

module.exports = {
  warn: function () {
    if (global.debug) {
      logger.warn(...arguments);
    }
  },
  error: function () {
    logger2.error(...arguments);
  },
  info: function () {
    if (global.debug) {
      logger.info(...arguments);
    }
  },
  debug: function () {
    if (global.debug) {
      logger.debug(...arguments);
    }
  },
  log: function () {
    if (global.appName)
      logger3.log(`[${global.appName}]`, ...arguments);
    else
      logger3.log(...arguments);
  },
  rainbow: function () {
    // if (global.debug) {
    logger2.info(...arguments);
    // }
  }
};