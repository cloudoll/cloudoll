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
    myTools.consoleLog('Koa 中间件群组已经初始化完成。');
  }

  /**
   * 这个error handle 要放在 router 之前.
   * @param next
   */
  *errorsHandleAhead(next) {
    try {
      if (process.env.debug) {
        logger.info(this.url);
      }
      yield next;
    } catch (err) {
      //logger.error(err);
      // this.status = 200;

      if (err.errno && typeof err.errno == "number") {
        this.body = err;
      } else if (err.errno && typeof err.errno == "string") {
        this.app.emit('error', err, this);
        switch (err.errno) {
          case "EACCES":
            this.body = errors.CUSTOM("没有访问权限。");
            break;
          case "EADDRINUSE":
            this.body = errors.CUSTOM("地址被占用。");
            break;
          case "ECONNREFUSED":
            this.body = errors.CUSTOM("连接被拒。");
            break;
          case "EEXIST":
            this.body = errors.CUSTOM("文件已存在。");
            break;
          case "EISDIR":
            this.body = errors.CUSTOM("需要的是文件不是目录。");
            break;
          case "EMFILE":
            this.body = errors.CUSTOM("打开文件的数量太多。");
            break;
          case "ENOENT":
            this.body = errors.CUSTOM("没有这个文件或者目录。");
            break;
          case "ENOTDIR":
            this.body = errors.CUSTOM("不是一个目录。");
            break;
          case "ENOTEMPTY":
            this.body = errors.CUSTOM("目录非空。");
            break;
          case "EPERM":
            this.body = errors.CUSTOM("该操作被禁止。");
            break;
          case "EPIPE":
            this.body = errors.CUSTOM("写管道损坏。");
            break;
          case "ETIMEDOUT":
            this.body = errors.CUSTOM("操作超时。");
            break;
          default:
            this.body = err;
        }
      } else {
        this.app.emit('error', err, this);
        this.body = errors.SYSTEM_ERROR;
      }
    }
  }

  /**
   * 这个错误捕获需要放到 router 之后
   * @param next
   */
  *errorsHandleBehind(next) {
    myTools.info("出错了，当前请求状态：" + this.status);
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
    myTools.consoleLog("===========================");
    watchDir = watchDir || ['/api/open', '/api/admin', '/api/inner'];
    myTools.consoleLog('自动路由规则已经启动，请参考文档，按照约定放置您的文件（controller）。');
    myTools.consoleLog('当前配置的监视目录：' + watchDir);
    watchDir.forEach(function (e) {
      var routers_dir = path.resolve('./' + e);
      var rightAccess = false;
      try {
        fs.accessSync(routers_dir, fs.F_OK);
        rightAccess = true;
      } catch (e) {
        myTools.warn("目录 %s 不可访问。", routers_dir);
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
                    urlPost     = urlPost.toLowerCase();
                    myTools.consoleLog("自动路由 POST: " + urlPost);
                    router.post(urlPost, func);
                  } else {
                    var urlGet = e + '/' + moduleName[0] + '/' + myTools.transferToUrl(method);
                    urlGet     = urlGet.toLowerCase();
                    myTools.consoleLog("自动路由 GET:  " + urlGet);
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

  cloudeerProxy() {
    router.post('/cloudeer', function *() {
      var form = this.request.body;
      if (this.cookies.get('ticket')) {
        if (form.url.indexOf("?") > 0) {
          form.url = form.url + "&ticket=" + this.cookies.get('ticket');
        } else {
          form.url = form.url + "?ticket=" + this.cookies.get('ticket');
        }
      }
      this.body = yield this.app.cloudeer.invokeCo(form.method, form.service, form.url, form.params);
    });
    router.post('/cloudeer/get', function *() {
      var form = this.request.body;
      if (this.cookies.get('ticket')) {
        if (form.url.indexOf("?") > 0) {
          form.url = form.url + "&ticket=" + this.cookies.get('ticket');
        } else {
          form.url = form.url + "?ticket=" + this.cookies.get('ticket');
        }
      }
      this.body = yield this.app.cloudeer.invokeCo("GET", form.service, form.url, form.params);

    });
    router.post('/cloudeer/post', function *() {
      var form = this.request.body;
      if (this.cookies.get('ticket')) {
        if (form.url.indexOf("?") > 0) {
          form.url = form.url + "&ticket=" + this.cookies.get('ticket');
        } else {
          form.url = form.url + "?ticket=" + this.cookies.get('ticket');
        }
      }
      this.body = yield this.app.cloudeer.invokeCo("POST", form.service, form.url, form.params);
    });
    return router;
  }

  *authenticate(next) {
    var urls     = url.parse(this.url);
    var authCode = urls.pathname;
    authCode     = authCode.toLowerCase();
    // console.log(urls);
    //console.log(Cloudeer.authUris);
    if (Cloudeer.authUris.indexOf(authCode) < 0) {
      yield next;
    } else {
      myTools.info("开始验证权限 %s", this.url);
      //当前访问的是 inner 接口，则需要使用 inner 接口的验证。
      if (authCode.startsWith('/inner')) {
        var clientIp = this.ip;
        clientIp = clientIp.replace(/^.*:/, '');
        var isInnerIp = Cloudeer.innerIps[clientIp];
        if (isInnerIp) {
          yield next;
        } else {
          throw errors.NO_RIGHTS;
        }
      } else {

        var ticket = this.qs.ticket;
        if (!ticket) {
          throw errors.WHAT_REQUIRE('ticket');
        }

        var rights = yield this.app.cloudeer.invokeCo("GET", "cloudarling", "/open/account/rights",
          {
            ticket: ticket, service: process.env.app_name
          });

        var myRights = rights.rights;
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
    }
  }
}

module.exports = KoaMiddles;