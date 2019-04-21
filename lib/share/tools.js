const EveError = require('../error/EveError');
const errors = require('../error/errors');
const EvePage = require('../midldleware/EvePage');
const os = require('os');

const tools = {
  transferToUrl: (camelName) => {
    let newName = "";
    for (let ch of camelName) {
      if (ch.charCodeAt() >= 65 && ch.charCodeAt() <= 90) {
        newName += "-" + ch.toLowerCase();
      } else {
        newName += ch;
      }
    }
    if (newName.startsWith('-')) {
      newName = newName.substr(1);
    }
    if (newName.startsWith('/-')) {
      newName = "/" + newName.substr(2);
    }
    return newName;
  },
  randomInt: function (max) {
    let rdm = Math.random();
    let base = 1 / max;
    for (let i = 0; i < max; i++) {
      if (rdm >= i * base && rdm < (i + 1) * base) {
        return i;
      }
    }
    return -1;
  },
  wrapBody: function (body, callback) {
    if (typeof body == 'string') {
      body = JSON.parse(body);
    }
    if (body.success) {
      if (callback) {
        callback(null, body.data);
      } else {
        return body.data;
      }
    } else {
      let err = EveError.fromJson(body);
      if (callback) {
        callback(err);
      } else {
        throw err;
      }
    }
  },
  wrapContext: function (ctx, result, defaultPage) {
    if (result instanceof EvePage) {
      if (!result.page) {
        result.page = defaultPage;
      }
      ctx.body = result.render();
    } else
      if (result === undefined) {
      } else {
        ctx.echo(result);
      }
  },
  getLocalIp: function () {
    const ifaces = os.networkInterfaces();
    for (const enxx in ifaces) {
      const xip = ifaces[enxx];
      for (const en of xip) {
        if (en.family === 'IPv4' && !en.internal) {
          return en.address;
        }
      }
    }
    return '127.0.0.1';
  },
  base64Encode: function (str) {
    return Buffer.from(str).toString('base64');
    // return new Buffer(str).toString('base64');
  },
  base64Decode: function (str) {
    return Buffer.from(str, 'base64').toString();
    //return new Buffer(str, 'base64').toString();
  },
};

module.exports = tools;