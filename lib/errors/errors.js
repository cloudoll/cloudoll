var Clouderr = require('./Clouderr');
var util     = require('util');
var logger   = require('tracer').colorConsole();

var errors = {
  /**
   * 从 外部指定一个 json 构造串
   *
   * 示例：
   * ```
   * Clouderr.load({
   *     NoParams  : {errno: -200, errText: '没有参数的'},
   *     NoParams2 : {errno: -201, errText: '第二个没有参数的'},
   *     notFound  : {errno: -198, errText: '需要俩参数我 %s 唉出差错 %s'},
   *     rangeFound: {errno: -199, errText: '取值范文是从  %s 到 %s'}
   *   });
   * ```
   * @param service
   * @param json
   */
  load       : function (json, service) {
    for (var key in json) {
      var xdata   = json[key];
      let errText = xdata.errText;
      let errno   = xdata.errno;
      if (errText.indexOf("%s") < 0) {
        errors[key] = new Clouderr(errno, errText, service);
      } else {
        errors[key] = function () {
          var args     = Array.prototype.slice.call(arguments);
          var errText0 = util.format(errText, ...args);
          return new Clouderr(errno, errText0, service);
        }
      }
    }
  },
  loadDefault: function (service) {
    console.log("===========================");
    console.log('加载 errors @ ' + process.env.appName);
    errors.load(require('./errors-default'), service);
  },
  SUCCESS    : function (data) {
    return {errno: 0, data: data}
  },
  success    : function (data) {
    return {errno: 0, data: data}
  }
};

errors.loadDefault();

module.exports = errors;