'use strict';

const EveError = require('./EveError');
const util = require('util');
const path = require('path');
const fs = require('fs');

const errors = {
  /**
   * 从 外部指定一个 json 构造串
   *
   * 示例：
   * ```
   * errors.load({
   *     NoParams  : {code: "-200", message: '没有参数的'},
   *     NoParams2 : {code: -201, message: '第二个没有参数的'},
   *     notFound  : {code: -198, message: '需要俩参数我 %s 唉出差错 %s'},
   *     rangeFound: {code: -199, message: '取值范文是从  %s 到 %s'}
   *   });
   * ```
   * @param service
   * @param json
   * @param cluster
   */
  load: function (json, service, cluster) {
    for (let key in json) {
      if (key !== "EveError") {
        let xdata = json[key];
        let message = xdata.message;
        let code = xdata.code;
        if (message.indexOf("%s") < 0) {
          errors[key] = new EveError(code, message, service, cluster);
        } else {
          errors[key] = function () {
            let args = Array.prototype.slice.call(arguments);
            let message0 = util.format(message, ...args);
            return new EveError(code, message0, service, cluster);
          }
        }
      }
    }
  },
  loadDefault: function (service, cluster) {
    service = service || global.appName;
    //console.log();
    //console.log('Load default errors @ ' + global.appName);
    errors.load(require('./errors-default'), service, cluster);
  }
};

errors.loadDefault();



const mRoot = process.cwd();
//默认加载根目录的 errors.js 文件
let myErrors = './app/eve-errors.js';
let errPath = path.resolve(process.cwd(), myErrors);
try {
  fs.accessSync(errPath, fs.F_OK);
  errors.load(require(errPath));
  //console.log();
  //console.log('Load my custom errors @ %s', global.appName);
} catch (e) {
  console.warn("File [%s] not exits. Skip errors loading.", errPath);
}


module.exports = errors;