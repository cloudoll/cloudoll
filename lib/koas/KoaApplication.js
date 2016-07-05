'use strict';

var path             = require('path');
var tools            = require('../tools');
var logger           = require('tracer').colorConsole();
var errors           = require('../errors/errors');
process.env.app_root = path.resolve('.');
process.env.NODE_ENV = process.env.NODE_ENV || "development";

console.log("加载配置文件：" + process.env.NODE_ENV);
var config = {};
try {
  config = require(process.env.app_root + '/config/' + process.env.NODE_ENV);
} catch (e) {
  config.not_cloudeer_app = true;
  logger.warn("没有发现配置文件，跳过配置文件加载。");
}

if (!config.cloudeer) {
  config.cloudeer = {};
}
if (!config.cloudeer_url && !config.cloudeer.server) {
  logger.warn("没有发现 cloudeer 配置项，将禁用 cloudeer 分布式功能。");
  config.not_cloudeer_app = true;
}

for (var key in config) {
  if (config.hasOwnProperty(key) && typeof config[key] != 'object') {
    process.env[key] = config[key];
  }
}

if (!process.env.app_name) {
  process.env.app_name = path.basename(process.env.app_root);
}

process.env.port = parseInt(config.port) || parseInt(config.cloudeer.myPort) || 3000;

function KoaApplication(options) {
  options           = options || {};
  process.env.debug = config.debug ? "true" : "";
  var koa           = require('koa');
  var app           = koa();


  app.context.echo = function (data) {
    this.body = {errno: 0, data: data};
  };

  app.context.getTicket = function () {
    return this.qs.ticket || this.cookies.get('ticket') || this.request.body.ticket;
  };

  app.context.getUser = function *() {
    let ticket = this.qs.ticket || this.cookies.get('ticket') || this.request.body.ticket;
    if (!ticket) {
      throw errors.WHAT_REQUIRE('ticket');
    }
    return yield this.getCloudeer("cloudarling", "/open/account/info",
      {
        ticket: ticket
      });
  };

  var preMiddles = options.middles;
  if (preMiddles) {
    if (Array.isArray(preMiddles)) {
      for (var mi of preMiddles) {
        app.use(mi);
      }
    } else {
      app.use(preMiddles);
    }
  }


  var KoaMiddle = require('./KoaMiddles');
  var koaMiddle = new KoaMiddle();


  var bodyParser = require('koa-bodyparser');
  app.use(bodyParser());

  if (!config.koa_middles_forbidden) {
    config.koa_middles_forbidden = {};
  }

  if (!config.koa_middles_forbidden.clouderr_handle) {
    app.use(koaMiddle.errorsHandleAhead);
  }

  if (!config.koa_middles_forbidden.json_validator) {
    app.use(koaMiddle.jsonValidator(config.schema_path, config.controller_dirs).schemaValidator);
  }
  app.use(koaMiddle.queryStringParser);

  if (!config.koa_middles_forbidden.authenticate && !config.not_cloudeer_app) {
    console.log("===========================");
    console.log("权限验证中间件已应用。");
    console.log("请注意：只有通过 registerMethods 的那些 url 才可以被截获");
    app.use(koaMiddle.authenticate);
  }

  if (!config.not_cloudeer_app) {
    console.log("===========================");
    console.log("添加cloudeer 的映射映射代理：");
    console.log("POST /cloudeer");
    console.log("POST /cloudeer/get");
    console.log("POST /cloudeer/post");
    app.router = koaMiddle.cloudeerProxy();
  }

  if (!config.koa_middles_forbidden.auto_router) {
    app.router = koaMiddle.autoRouters(config.controller_dirs);
  }
  if (app.router) {
    app.use(app.router.routes());
  }


  if (!config.koa_middles_forbidden.clouderr_handle) {
    app.use(koaMiddle.errorsHandleBehind);
  }

  if (!config.not_cloudeer_app) {
    var Cloudeer = require('../rpc/Cloudeer');

    var cloudeer = new Cloudeer({
      cloudeerUri: config.cloudeer.server || config.cloudeer_url,
      myHost     : config.my_host || config.my_ip || process.env.my_host || tools.getLocalIp(),
      myPort     : process.env.port
    });

    app.context.getCloudeer  = function *(service, url, params) {
      return yield cloudeer.invokeCo("GET", service, url, params);
    };
    app.context.postCloudeer = function *(service, url, params) {
      return yield cloudeer.invokeCo("POST", service, url, params);
    };


    var onServerStartup = function () {
      if (!config.cloudeer.not_a_consumer) {
        cloudeer.downloadService();
      }
      if (!config.cloudeer.not_a_service) {
        cloudeer.registerService();
      }
      if (!config.cloudeer.no_methods_register) {
        console.log('===========================');
        console.log("自动提交路由到 cloudeer, 当前路由数量：" + postMethods.length);
        cloudeer.registerMethods(postMethods);
      }
    };
  }

  app.cloudeer = cloudeer;


  var xport = parseInt(process.env.port);

  var tryListen = function () {
    console.log("===========================");
    console.log('Koa Application 正在启动，尝试端口：' + xport);
    app.listen(process.env.port, function () {
      console.log('Koa Application 启动成功！端口：', xport);
      if (!config.not_cloudeer_app) {
        onServerStartup();
      }
    }).on('error', function (err) {
      if (err.code === "EADDRINUSE") {
        logger.error("端口 [%s] 被占用，重新更换端口连接。", xport);
        xport++;
        if (!config.not_cloudeer_app) {
          cloudeer.myPort = xport;
        }
        process.env.port = xport;
        tryListen();
      }
    });
  };
  tryListen();


  if (!config.cloudeer.no_methods_register && !config.not_cloudeer_app) {
    var postMethods = [];
    app.router.stack.forEach(function (layer) {
      var xmethods = layer.methods;
      var myMethod = "GET";
      if (xmethods.indexOf("POST") >= 0) {
        myMethod = "POST";
      }
      if (layer.path.indexOf('/cloudeer') < 0) {
        var isOpen = layer.path.indexOf('/open/') >= 0 || layer.path.indexOf('/inner/') >= 0;
        postMethods.push({url: layer.path, name: layer.path, method: myMethod, open: isOpen});
      }
    });
  }


  return app;
}

module.exports = KoaApplication;
