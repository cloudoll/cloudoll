'use strict';

const path = require('path');

process.env.app_root = path.resolve('.');
if (!process.env.app_name) {
  process.env.app_name = path.basename(process.env.app_root);
}

process.env.NODE_ENV = process.env.NODE_ENV || "development";
console.log("Load config：" + process.env.NODE_ENV);

var tools = require('../tools');
var logger = require('tracer').colorConsole();
var Cloudeer = require('../rpc/Cloudeer');


let config = {};

try {
  config = require(process.env.app_root + '/config/' + process.env.NODE_ENV);
} catch (e) {
  tools.warn("Config file not found, skipping...");
}

if (!config.cloudeer) {
  tools.warn("cloudeer config node not found, cloudeer will be forbidden.");
}

//??
// for (var key in config) {
//   if (config.hasOwnProperty(key) && typeof config[key] != 'object') {
//     process.env[key] = config[key];
//   }
// }

process.env.port = (config.port && parseInt(config.port)) || (config.cloudeer && parseInt(config.cloudeer.myPort)) || 3000;

function KoaApplication(options) {
  options = options || {};
  process.env.debug = config.debug ? "true" : "";

  const Koa = require('koa');
  const app = new Koa();

  app.cloudeer = Cloudeer;
  app.config = config;

  tools.printLogo();
  app.context.echo = (ctx, data) => {
    ctx.set('X-Powered-By', 'cloudoll');
    ctx.body = { errno: 0, data: data };
  };

  app.context.getTicket = function () {
    return this.qs.ticket || this.request.body.ticket;
  };

  //TODO: getUser must changed to async/await
  app.context.getUser = function* () {
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

  if (!config.koa_middles_forbidden.body_parser) {
    //自动解析 POST 请求为: this.request.body
    tools.info("Using middleware: body_parser.");
    var bodyParser = require('koa-bodyparser');
    app.use(bodyParser());
  }

  if (!config.koa_middles_forbidden.query_string_parser) {
    //自动解析 GET 请求为: this.qs
    tools.info("Using middleware: query_string_parser.");
    app.use(koaMiddle.queryStringParser);
  }


  if (!config.koa_middles_forbidden.json_validator) {
    app.use(koaMiddle.jsonValidator(config.schema_path, config.controller_dirs).schemaValidator);
  }
  if (config.cloudeer && !config.koa_middles_forbidden.authenticate) {
    // tools.info("===========================");
    tools.info("Using middleware: authenticate");
    tools.info("Only url via registerMethods can be authenticated.");
    app.use(koaMiddle.authenticate);
  }

  if (config.cloudeer) {
    // tools.info("===========================");
    tools.info("Add cloudeer proxy:");
    tools.info("POST /cloudeer");
    tools.info("POST /cloudeer/get");
    tools.info("POST /cloudeer/post");
    app.router = koaMiddle.cloudeerProxy();
  }

  if (!config.koa_middles_forbidden.auto_router) {
    app.router = koaMiddle.autoRouters(config.controller_dirs, app);
  }
  if (app.router) {
    // tools.consoleLog("auto router middleware applied.");
    app.use(app.router.routes());
  }


  if (!config.koa_middles_forbidden.clouderr_handle) {
    app.use(koaMiddle.errorsHandleBehind);
  }

  var xport = parseInt(process.env.port);


  var tryListen = function () {
    // tools.info("===========================");
    tools.info('Starting at port：' + xport);
    app.listen(process.env.port, function () {
      tools.info('Ok. see: http://127.0.0.1:' + xport);
      if (config.cloudeer) {
        onServerStartup();
      }
    }).on('error', function (err) {
      if (err.code === "EADDRINUSE") {
        logger.error(`端口 [${xport}] 被占用。`);
        process.abort();

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

    app.context.getCloudeer = function* (service, url, params) {
      return yield Cloudeer.invokeCo("GET", service, url, params);
    };
    app.context.postCloudeer = function* (service, url, params) {
      return yield Cloudeer.invokeCo("POST", service, url, params);
    };


    switch (config.cloudeer.type) {
      case "rest":
        tools.info("Connecting registry via http restful api.");
        startRestService();
        break;
      case "tcp":
        tools.info("Connecting registry via http tcp socket.");
        startTcpService();
        break;
      case "zoo":
        tools.error("zookeeper not support now.");
        break;
    }
  }

  function startRestService() {
    let RestClient = require('../rpc/RestClient');

    let restClient = new RestClient({
      cloudeerUri: "http://" + config.cloudeer.host + ":" + config.cloudeer.port,
      myHost: config.my_host || config.my_ip || process.env.my_host || tools.getLocalIp(),
      myPort: process.env.port
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
          postMethods.push({ url: layer.path, name: layer.path, method: myMethod, open: isOpen });
        }
      });

      for (var mm of postMethods) {
        if (!mm.open) {
          if (Cloudeer.authUris.indexOf(mm.url) < 0) {
            Cloudeer.authUris.push(mm.url);
          }
        }
      }

      // tools.consoleLog('===========================');
      tools.info("Auto post router path to registy, methods count: " + postMethods.length);
      restClient.registerMethods(postMethods);

    }

  }

  function startTcpService() {
    var TcpClient = require('../rpc/TcpClient');
    let tcpClient = new TcpClient({
      host: config.cloudeer.host,
      port: config.cloudeer.port,
      username: config.cloudeer.username,
      password: config.cloudeer.password,
      app_name: process.env.app_name,
      app_port: xport,
      app_host: config.my_host || config.my_ip || process.env.my_host || tools.getLocalIp(),
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
          postMethods.push({ url: layer.path, name: layer.path, method: myMethod, open: isOpen });
        }
      });

      for (var mm of postMethods) {
        if (!mm.open) {
          if (Cloudeer.authUris.indexOf(mm.url) < 0) {
            Cloudeer.authUris.push(mm.url);
          }
        }
      }

      // tools.consoleLog('===========================');
      tools.info("Auto post router path to registy, methods count: " + postMethods.length);
      tcpClient.postMethods = postMethods;

    }

    tcpClient.startService();
  }


  return app;
}

module.exports = KoaApplication;
