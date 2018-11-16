const os = require('os');
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


const loggerDebug = require('tracer').colorConsole(debugFormat);
const logger = require('tracer').console(commonFormat);

module.exports = {
    info: function () {
        const mLogger = process.env.debug ? loggerDebug : logger;
        mLogger.info(...arguments);
    },
    warn: function () {
        const mLogger = process.env.debug ? loggerDebug : logger;
        mLogger.warn(...arguments);
    },
    debug: function () {
        const mLogger = process.env.debug ? loggerDebug : logger;
        mLogger.debug(...arguments);
    },
    error: function () {
        const mLogger = process.env.debug ? loggerDebug : logger;
        mLogger.error(...arguments);
    },
    consoleLog: function () {
        // const mLogger = process.env.debug ? loggerDebug : logger;
        console.log(...arguments);
    },

}