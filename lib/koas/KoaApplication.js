'use strict';

var path = require('path');

process.env.app_root = path.resolve('.');
if (!process.env.app_name) {
  process.env.app_name = path.basename(process.env.app_root);
}

process.env.NODE_ENV = process.env.NODE_ENV || "development";
console.log("加载配置文件：" + process.env.NODE_ENV);

var tools    = require('../tools');
var logger   = require('tracer').colorConsole();
var Cloudeer = require('../rpc/Cloudeer');


let config = {};

try {
  config = require(process.env.app_root + '/config/' + process.env.NODE_ENV);
} catch (e) {
  tools.warn("没有发现配置文件，跳过配置文件加载。");
}

if (!config.cloudeer) {
  logger.warn("没有发现 cloudeer 配置项，将禁用 cloudeer 分布式功能。");
}

for (var key in config) {
  if (config.hasOwnProperty(key) && typeof config[key] != 'object') {
    process.env[key] = config[key];
  }
}

process.env.port = parseInt(config.port) || parseInt(config.cloudeer.myPort) || 3000;

function KoaApplication(options) {
  options           = options || {};
  process.env.debug = config.debug ? "true" : "";

  var koa = require('koa');
  var app = koa();

  app.cloudeer = Cloudeer;

  app.context.echo = function (data) {
    this.set('X-Powered-By', 'cloudoll');
    this.body = {errno: 0, data: data};
  };

  app.context.getTicket = function () {
    return this.qs.ticket || this.cookies.get('ticket') || this.request.body.ticket;
  };

  app.context.getUser = function *() {
    var errors = require('../errors/errors');
    let ticket = this.qs.ticket || this.request.body.ticket;
    if (!ticket) {
      throw errors.WHAT_REQUIRE('ticket');
    }
    return yield this.getCloudeer("cloudarling", "/open/account/info",
      {
        ticket: ticket
      });
  };


  var KoaMiddle = require('./KoaMiddles');
  var koaMiddle = new KoaMiddle();

  if (!config.koa_middles_forbidden) {
    config.koa_middles_forbidden = {};
  }

  if (!config.koa_middles_forbidden.clouderr_handle) {
    app.use(koaMiddle.errorsHandleAhead);
  }

  app.use(koaMiddle.blockFavicon);

  //自动解析 POST 请求为: this.request.body
  var bodyParser = require('koa-bodyparser');
  app.use(bodyParser());
  //自动解析 GET 请求为: this.qs
  app.use(koaMiddle.queryStringParser);


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


  if (!config.koa_middles_forbidden.json_validator) {
    app.use(koaMiddle.jsonValidator(config.schema_path, config.controller_dirs).schemaValidator);
  }
  if (config.cloudeer && !config.koa_middles_forbidden.authenticate) {
    tools.consoleLog("===========================");
    tools.consoleLog("权限验证中间件已应用。");
    tools.consoleLog("请注意：只有通过 registerMethods 的那些 url 才可以被截获");
    app.use(koaMiddle.authenticate);
  }

  if (config.cloudeer) {
    tools.consoleLog("===========================");
    tools.consoleLog("添加cloudeer 的映射映射代理：");
    tools.consoleLog("POST /cloudeer");
    tools.consoleLog("POST /cloudeer/get");
    tools.consoleLog("POST /cloudeer/post");
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

  var xport = parseInt(process.env.port);


  var tryListen = function () {
    tools.consoleLog("===========================");
    tools.consoleLog('正在启动，尝试端口：' + xport);
    app.listen(process.env.port, function () {
      console.log('应用启动成功！端口：', xport);
      if (config.cloudeer) {
        onServerStartup();
      }
    }).on('error', function (err) {
      if (err.code === "EADDRINUSE") {
        logger.error("端口 [%s] 被占用。", xport);

        // xport++;
        // if (!config.not_cloudeer_app) {
        //   cloudeer.myPort = xport;
        // }
        // process.env.port = xport;
        // tryListen();
      }
    });
  };
  tryListen();


  function onServerStartup() {

    app.context.getCloudeer  = function *(service, url, params) {
      return yield Cloudeer.invokeCo("GET", service, url, params);
    };
    app.context.postCloudeer = function *(service, url, params) {
      return yield Cloudeer.invokeCo("POST", service, url, params);
    };


    switch (config.cloudeer.type) {
      case "rest":
        tools.info("以 rest 方式连接注册中心！");
        startRestService();
        break;
      case "tcp":
        tools.info("以 tcp 长连接方式连接注册中心！");
        startTcpService();
        break;
      case "zoo":
        tools.error("zookeeper 方式目前还未实现！");
        break;
    }
  }

  function startRestService() {
    let RestClient = require('../rpc/RestClient');

    let restClient = new RestClient({
      cloudeerUri: "http://" + config.cloudeer.host + ":" + config.cloudeer.port,
      myHost     : config.my_host || config.my_ip || process.env.my_host || tools.getLocalIp(),
      myPort     : process.env.port
    });

    if (!config.cloudeer.not_a_consumer) {
      restClient.downloadService();
    }
    restClient.registerService();
    // if (!config.cloudeer.not_a_service) {
    //   restClient.registerService();
    // }
    if (!config.cloudeer.not_a_service) {
      var postMethods = [];
      app.router.stack.forEach(function (layer) {
        var xmethods = layer.methods;
        var myMethod = "GET";
        if (xmethods.indexOf("POST") >= 0) {
          myMethod = "POST";
        }
        if (layer.path.indexOf('/cloudeer') < 0) {
          // var isOpen = layer.path.indexOf('/open/') >= 0 || layer.path.indexOf('/inner/') >= 0;
          var isOpen = layer.path.indexOf('/open/') >= 0;
          postMethods.push({url: layer.path, name: layer.path, method: myMethod, open: isOpen});
        }
      });

      for (var mm of postMethods) {
        if (!mm.open) {
          if (Cloudeer.authUris.indexOf(mm.url) < 0) {
            Cloudeer.authUris.push(mm.url);
          }
        }
      }

      tools.consoleLog('===========================');
      tools.consoleLog("自动提交路由到 cloudeer, 当前路由数量：" + postMethods.length);
      restClient.registerMethods(postMethods);

    }

  }

  function startTcpService() {
    var TcpClient = require('../rpc/TcpClient');
    let tcpClient = new TcpClient({
      host          : config.cloudeer.host,
      port          : config.cloudeer.port,
      username      : config.cloudeer.username,
      password      : config.cloudeer.password,
      app_name      : process.env.app_name,
      app_port      : xport,
      app_host      : config.my_host || config.my_ip || process.env.my_host || tools.getLocalIp(),
      not_a_consumer: config.cloudeer.not_a_consumer || false
    });

    app.context.tcpClient = tcpClient;

    if (!config.cloudeer.not_a_service) {
      var postMethods = [];
      app.router.stack.forEach(function (layer) {
        var xmethods = layer.methods;
        var myMethod = "GET";
        if (xmethods.indexOf("POST") >= 0) {
          myMethod = "POST";
        }
        if (layer.path.indexOf('/cloudeer') < 0) {
          // var isOpen = layer.path.indexOf('/open/') >= 0 || layer.path.indexOf('/inner/') >= 0;
          var isOpen = layer.path.indexOf('/open/') >= 0;
          postMethods.push({url: layer.path, name: layer.path, method: myMethod, open: isOpen});
        }
      });

      for (var mm of postMethods) {
        if (!mm.open) {
          if (Cloudeer.authUris.indexOf(mm.url) < 0) {
            Cloudeer.authUris.push(mm.url);
          }
        }
      }

      tools.consoleLog('===========================');
      tools.consoleLog("自动提交路由到 cloudeer, 当前路由数量：" + postMethods.length);
      tcpClient.postMethods = postMethods;

    }

    tcpClient.startService();
  }


  return app;
}

module.exports = KoaApplication;
