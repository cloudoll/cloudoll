'use strict';

class Clouderr extends Error {
  constructor(errno, errText, service) {
    service = service || process.env.app_name || "unkown-service";
    super(errText + " [" + errno + "]" + " @ " + service);
    this.service = service;
    this.errno = errno;
    this.errText = errText;
  }

  static fromJson(errJson) {
    if (!errJson.hasOwnProperty('service')) {
      errJson.service = "unknown-service";
      //return new Clouderr(-1, "这不是一个标准的 clouderr 的错误");
    }
    return new Clouderr(errJson.errno, errJson.errText, errJson.service);
  }
}

module.exports = Clouderr;
