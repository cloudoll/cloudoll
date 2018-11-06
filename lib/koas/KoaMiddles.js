"use strict";

var logger = require('tracer').colorConsole();
var router = require('koa-router')();
var path = require('path');
var fs = require('fs');
var errors = require('../errors/errors');
var myTools = require('../tools');
var querystring = require('querystring');
var Cloudeer = require('../rpc/Cloudeer');
var url = require('url');
const os = require('os');


class KoaMiddles {
  constructor() {
    myTools.consoleLog('Koa 中间件群组已经初始化完成。');
  }

  async blockFavicon(ctx, next) {
    if (ctx.url.match(/favicon\.ico$/)) {
      ctx.body = "";
      return;
    }
    await next;
  };

  /**
   * 这个error handle 要放在 router 之前.
   * @param next
   */
  async errorsHandleAhead(ctx, next) {
    try {
      if (process.env.debug) {
        logger.info(ctx.url);
      }
      await next;
    } catch (err) {
      //logger.error(err);
      // ctx.status = 200;

      if (err.errno && typeof err.errno == "number") {
        ctx.body = err;
      } else if (err.errno && typeof err.errno == "string") {
        ctx.app.emit('error', err, ctx);
        switch (err.errno) {
          case "EACCES":
            ctx.body = errors.CUSTOM("没有访问权限。");
            break;
          case "EADDRINUSE":
            ctx.body = errors.CUSTOM("地址被占用。");
            break;
          case "ECONNREFUSED":
            ctx.body = errors.CUSTOM("连接被拒。");
            break;
          case "EEXIST":
            ctx.body = errors.CUSTOM("文件已存在。");
            break;
          case "EISDIR":
            ctx.body = errors.CUSTOM("需要的是文件不是目录。");
            break;
          case "EMFILE":
            ctx.body = errors.CUSTOM("打开文件的数量太多。");
            break;
          case "ENOENT":
            ctx.body = errors.CUSTOM("没有这个文件或者目录。");
            break;
          case "ENOTDIR":
            ctx.body = errors.CUSTOM("不是一个目录。");
            break;
          case "ENOTEMPTY":
            ctx.body = errors.CUSTOM("目录非空。");
            break;
          case "EPERM":
            ctx.body = errors.CUSTOM("该操作被禁止。");
            break;
          case "EPIPE":
            ctx.body = errors.CUSTOM("写管道损坏。");
            break;
          case "ETIMEDOUT":
            ctx.body = errors.CUSTOM("操作超时。");
            break;
          default:
            ctx.body = err;
        }
      } else {
        ctx.app.emit('error', err, ctx);
        ctx.body = errors.SYSTEM_ERROR;
      }
    }
  }

  /**
   * 这个错误捕获需要放到 router 之后
   * @param next
   */
  async errorsHandleBehind(ctx, next) {
    myTools.error("出错了，当前请求状态：" + ctx.status, ctx.url);
    switch (ctx.status) {
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
      default:
        throw errors.CUSTOM(`http error with status ${ctx.status}!`);
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
                    urlPost = urlPost.toLowerCase();
                    myTools.consoleLog("自动路由 POST: " + urlPost);
                    router.post(urlPost, func);
                  } else {
                    var urlGet = e + '/' + moduleName[0] + '/' + myTools.transferToUrl(method);
                    urlGet = urlGet.toLowerCase();
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

  async queryStringParser(ctx, next) {
    ctx.qs = querystring.parse(ctx.request.querystring);
    await next;
  }

  cloudeerProxy() {
    router.post('/cloudeer', async (ctx) => {
      var form = ctx.request.body;
      if (ctx.cookies.get('ticket')) {
        if (form.url.indexOf("?") > 0) {
          form.url = form.url + "&ticket=" + ctx.cookies.get('ticket');
        } else {
          form.url = form.url + "?ticket=" + ctx.cookies.get('ticket');
        }
      }
      ctx.body = await Cloudeer.invokeCo(form.method, form.service, form.url, form.params);
    });
    if (process.env.debug) {
      router.get('/cloudeer/view', function* () {
        ctx.body = ctx.echo(Cloudeer.config);
      });
    }

    router.post('/cloudeer/get', async ctx => {
      var form = ctx.request.body;
      ctx.body = await Cloudeer.invokeCo("GET", form.service, form.url, form.params);

    });
    router.post('/cloudeer/post', async ctx => {
      var form = ctx.request.body;
      if (form.params && form.params.hasOwnProperty('ticket')) {
        if (form.url.indexOf("?") > 0) {
          form.url = form.url + "&ticket=" + form.params.ticket;
        } else {
          form.url = form.url + "?ticket=" + form.params.ticket;
        }
      }

      ctx.body = await Cloudeer.invokeCo("POST", form.service, form.url, form.params);
    });
    router.get('/inner/cloudeer/mnt-server-info', async ctx => {
      ctx.echo({
        cpus: os.cpus(),
        uptime: os.uptime(),
        totalmem: os.totalmem(),
        freemem: os.freemem(),
        loadavg: os.loadavg(),
        homedir: os.homedir()
      });
    });
    router.get('/inner/cloudeer/mnt-process-info', async ctx => {
      ctx.echo({
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        totalmem: os.totalmem(),
        cpuUsage: process.cpuUsage(),
        hrtime: process.hrtime()
      });
    });
    return router;
  }

  async authenticate(ctx, next) {
    var urls = url.parse(ctx.url);
    var authCode = urls.pathname;
    authCode = authCode.toLowerCase();
    // console.log(urls);
    if (Cloudeer.authUris.indexOf(authCode) < 0) {
      await next;
    } else {
      myTools.info("开始验证权限 %s", ctx.url);
      //当前访问的是 inner 接口，则需要使用 inner 接口的验证。
      if (authCode.startsWith('/inner')) {


        var clientIp = ctx.ip;

        // console.log(Cloudeer.authUris);
        // console.log(clientIp);
        // console.log(Cloudeer.innerIps);


        clientIp = clientIp.replace(/^.*:/, '');
        var isInnerIp = Cloudeer.innerIps[clientIp];
        if (isInnerIp) {
          await next;
        } else {
          throw errors.NO_RIGHTS;
        }
      } else {

        var ticket = ctx.qs.ticket;
        if (!ticket) {
          throw errors.WHAT_REQUIRE('ticket');
        }

        var rights = await Cloudeer.invokeCo("GET", "cloudarling", "/open/account/rights", {
          ticket: ticket,
          service: process.env.app_name
        });

        var myRights = rights.rights;
        var godRight = myRights.filter(function (ele) {
          return ele.id == 0;
        });
        var isGods = godRight && godRight.length > 0;
        if (!isGods) {
          var pathJson = url.parse(ctx.url);

          var myRight = myRights.filter(function (ele) {
            return ele.code == authCode;
          });
          var hasRight = myRight && myRight.length > 0;
          if (!hasRight) {
            throw errors.NO_RIGHTS;
          }
        }
        await next;
      }
    }
  }
}

module.exports = KoaMiddles;