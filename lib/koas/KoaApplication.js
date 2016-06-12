'use strict';

var path             = require('path');
var logger           = require('tracer').colorConsole();
process.env.app_root = path.resolve('.');
process.env.NODE_ENV = process.env.NODE_ENV || "development";
console.log("加载配置文件：" + process.env.NODE_ENV);
var config = require(process.env.app_root + '/config/' + process.env.NODE_ENV);

if (!config.cloudeer) {
  config.cloudeer = {};
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

function KoaApplication(isDebug) {

  process.env.debug = isDebug || config.debug;
  var koa           = require('koa');
  var bodyParser    = require('koa-bodyparser');


  var KoaMiddle = require('./KoaMiddles');
  var koaMiddle = new KoaMiddle();

  var app = koa();


  app.use(bodyParser());
  app.use(koaMiddle.errorsHandleAhead);

  app.use(koaMiddle.jsonValidator(config.schema_path, config.controller_dirs).schemaValidator);

  app.use(koaMiddle.queryStringParser);

  console.log("===========================");
  console.log("权限验证中间键已应用");
  app.use(koaMiddle.authenticate);


  var router = koaMiddle.autoRouters(config.controller_dirs);
  app.router = router; //暴露到外部，方便增加自定义
  app.use(router.routes());


  app.use(koaMiddle.errorsHandleBehind);

  var postMethods = [];
  router.stack.forEach(function (layer) {
    var xmethods = layer.methods;
    var myMethod = "GET";
    if (xmethods.indexOf("POST") >= 0) {
      myMethod = "POST";
    }
    var isOpen = layer.path.indexOf('/open/') >= 0 || layer.path.indexOf('/inner/') >= 0;
    postMethods.push({url: layer.path, name: layer.path, method: myMethod, open: isOpen});
  });


  var xport = process.env.port;

  var tryListen = function () {
    console.log("===========================");
    console.log('Koa Application 正在启动，尝试端口：' + xport);
    app.listen(process.env.port, function () {
      console.log('Koa Application 启动成功！端口：', xport);
      onServerStartup();
    }).on('error', function (err) {
      if (err.code === "EADDRINUSE") {
        logger.error("端口 [%s] 被占用，重新更换端口连接。", xport);
        xport++;
        process.env.port = xport;
        tryListen();
      }
    });
  };
  tryListen();

  var Cloudeer = require('../rpc/Cloudeer');
  var cloudeer = new Cloudeer({
    cloudeerUri: config.cloudeer.serviceHost || config.cloudeer_url,
    myHost     : config.cloudeer.myHost || config.my_ip,
    myPort     : process.env.port

  });

  app.cloudeer = cloudeer;

  var onServerStartup = function () {

    cloudeer.downloadService();

    cloudeer.registerService();

    console.log('===========================');
    console.log("自动提交路由到 cloudeer, 当前路由数量：" + postMethods.length);
    cloudeer.registerMethods(postMethods);


  };

  return app;
}

module.exports = KoaApplication;