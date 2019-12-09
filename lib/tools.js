// const errors = require('./eve-errors').errors;
const EveError = require('./eve-errors').EveError;
const Response = require('./Response');
const os = require('os');

const tools = {
  randomInt      : function (max) {
    let rdm = Math.random();
    let base = 1 / max;
    for (let i = 0; i < max; i++) {
      if (rdm >= i * base && rdm < (i + 1) * base) {
        return i;
      }
    }
    return -1;
  },
  unWrapBody     : function (body) {
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
    body = body || {};
    if (body.success) {
      return body.data;
    } else {
      throw EveError.fromJson(body);
    }
  },
  wrapBody       : function (data, csrfId, action) {
    const res = new  Response();
    return res.body(data);
  },
  getLocalIp     : function () {
    let ifaces = os.networkInterfaces();
    for (let enxx in ifaces) {
      let xip = ifaces[enxx];
      for (let en of xip) {
        if (en.family === 'IPv4' && !en.internal) {
          return en.address;
        }
      }
    }
  },
  base64Encode   : function (str) {
    return new Buffer(str).toString('base64');
  },
  base64Decode   : function (str) {
    return new Buffer(str, 'base64').toString();
  }
};

module.exports = tools;