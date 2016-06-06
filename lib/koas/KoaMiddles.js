"use strict";

var logger  = require('tracer').colorConsole();
var router  = require('koa-router')();
var path    = require('path');
var fs      = require('fs');
var errors    = require('../errors/errors');
var myTools = require('../tools');


class KoaMiddles {
  constructor() {
    console.log('Koa 中间键群组已经初始化，请 use 方法。')
  }

  /**
   * 这个error handle 要放在 router 之前.
   * @param next
   */
  *errorsHandleAhead(next) {
    try {
      yield next;
    } catch (err) {
      this.app.emit('error', err, this);
      // this.status = 200;
      if (err.errno) {
        this.body = err;
      } else {
        this.body = errors.SYSTEM_ERROR;
      }
    }
  }

  /**
   * 这个错误捕获需要放到 router 之后
   * @param next
   */
  *errorsHandleBehind(next) {
    if (process.env.debug) {
      logger.info("当前请求状态：" + this.status);
    }
    switch (this.status) {
      case 400:
        throw errors.BAD_REQUEST;
        break;
      case 404:
        throw errors.NOT_FOUND;
        return;
        break;
      case 500:
        throw errors.INTERNAL_SERVER_ERROR;
        break;
      default :
        throw errors.CUSTOM(`http error with status ${this.status}!`);
    }
  }

  /**
   * 自动配置路由
   * @param watchDir
   * @returns {*}
   */
  autoRouters(watchDir) {
    console.log("===========================");
    watchDir = watchDir || ['/api/open', '/api/admin', '/api/inner'];
    console.log('自动路由规则已经启动，请参考文档，按照约定放置您的文件（controller）。');
    console.log('当前配置的监视目录：' + watchDir);
    watchDir.forEach(function (e) {
      var routers_dir = path.resolve('./' + e);
      var rightAccess = false;
      try {
        fs.accessSync(routers_dir, fs.F_OK);
        rightAccess = true;
      } catch (e) {
      }
      if (rightAccess) {
        fs.readdirSync(routers_dir).forEach(function (file, error) {
          var moduleName = file.split(".");
          if (moduleName[moduleName.length - 1] === "js") {
            var action = require(routers_dir + '/' + moduleName[0]);
            /*** 遍历进行映射*/
            for (var method in action) {
              if (action.hasOwnProperty(method)) {
                var func = action[method];
                if (typeof func == "function") {
                  e = e.substring(e.indexOf('/', 1));
                  if (method[0] == '$') {
                    var urlGet = e + '/' + moduleName[0] + '/' + myTools.transferToUrl(method.substr(1));
                    console.log("自动路由 POST: " + urlGet);
                    router.post(urlGet, func);
                  } else {
                    var urlPost = e + '/' + moduleName[0] + '/' + myTools.transferToUrl(method);
                    console.log("自动路由 GET:  " + urlPost);
                    router.get(urlPost, func);
                  }
                }
              }
            }
          }
        });
      }
    });
    return router;
  }

  jsonValidator(schemaPath, watchDir) {
    var JsonValidator = require('./JsonValidator');
    return new JsonValidator(schemaPath, watchDir);
  }
}


module.exports = KoaMiddles;