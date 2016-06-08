"use strict";

var logger      = require('tracer').colorConsole();
var router      = require('koa-router')();
var path        = require('path');
var fs          = require('fs');
var errors      = require('../errors/errors');
var myTools     = require('../tools');
var querystring = require('querystring');
var Cloudeer    = require('../rpc/Cloudeer');
var Clouderr    = require('../errors/Clouderr');
var url         = require('url');


class KoaMiddles {
  constructor() {
    console.log('Koa 中间键群组已经初始化完成。')
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
      logger.info(this.url);
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
        logger.error("目录 %s 不可访问。", routers_dir);
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
                    var urlPost = e + '/' + moduleName[0] + '/' + myTools.transferToUrl(method.substr(1));
                    console.log("自动路由 POST: " + urlPost);
                    router.post(urlPost, func);
                  } else {
                    var urlGet = e + '/' + moduleName[0] + '/' + myTools.transferToUrl(method);
                    console.log("自动路由 GET:  " + urlGet);
                    router.get(urlGet, func);
                  }
                }
              }
            }
          }
        });
      }
    });
    // console.log(router.stack);
    return router;
  }

  jsonValidator(schemaPath, watchDir) {
    var JsonValidator = require('./JsonValidator');
    return new JsonValidator(schemaPath, watchDir);
  }

  *queryStringParser(next) {
    this.qs = querystring.parse(this.request.querystring);
    yield next;
  }


  *authenticate(next) {
    var urls     = url.parse(this.url);
    var authCode = urls.pathname;
    // console.log(urls);
    //console.log(Cloudeer.authUris);
    if (Cloudeer.authUris.indexOf(authCode) < 0) {
      yield next;
    } else {
      if (process.env.debug) {
        logger.info("开始验证权限 %s", this.url);
      }
      var ticket = this.qs.ticket;
      if (!ticket) {
        throw errors.WHAT_REQUIRE('ticket');
      }

      // var mine = yield this.app.cloudeer.invokeCo("POST", "cloudarling", "/login",
      //   {
      //     passport: '13006699866', password: '111111'
      //   });
      // console.log(mine);

      var rights = yield this.app.cloudeer.invokeCo("GET", "cloudarling", "/rights",
        {
          ticket: ticket, service: process.env.appName
        });

      var jRights = rights;
      if (typeof jRights == "string") {
        jRights = JSON.parse(rights);
      }
      if (jRights.errno != 0) {
        throw Clouderr.fromJson(jRights);
      }
      console.log(jRights.data.rights);
      var myRights = jRights.data.rights;
      var godRight = myRights.filter(function (ele) {
        return ele.id == 0;
      });
      var isGods   = godRight && godRight.length > 0;
      if (!isGods) {
        var pathJson = url.parse(this.url);

        var myRight  = myRights.filter(function (ele) {
          return ele.code == authCode;
        });
        var hasRight = myRight && myRight.length > 0;
        if (!hasRight) {
          throw errors.NO_RIGHTS;
        }
      }
      yield next;
    }


    //
    // yield next;
  }
}


module.exports = KoaMiddles;