'use strict';

var path            = require('path');
var logger          = require('tracer').colorConsole();
process.env.appRoot = path.resolve('.');
process.env.appName = path.basename(process.env.appRoot);

function KoaApplication(isDebug) {

  var koa        = require('koa');
  var bodyParser = require('koa-bodyparser');

  process.env.NODE_ENV = process.env.NODE_ENV || "development";
  console.log("加载配置文件：" + process.env.NODE_ENV);
  var config        = require(process.env.appRoot + '/config/' + process.env.NODE_ENV);
  process.env.port  = config.port || config.cloudeer.myPort || 3000;
  process.env.debug = isDebug || config.debug;

  var KoaMiddle = require('./KoaMiddles');
  var koaMiddle = new KoaMiddle();

  var app = koa();

  app.use(bodyParser());
  app.use(koaMiddle.errorsHandleAhead);
  app.use(koaMiddle.jsonValidator(config.app.schemaPath, config.app.controllerDirs).schemaValidator);
  app.use(koaMiddle.queryStringParser);
  app.use(koaMiddle.autoRouters(config.app.controllerDirs).routes());
  app.use(koaMiddle.errorsHandleBehind);

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

  var onServerStartup = function () {

    var Cloudeer = require('../rpc/Cloudeer');
    var cloudeer = new Cloudeer({
      cloudeerUri: config.cloudeer.serviceHost,
      myHost     : config.cloudeer.myHost,
      myPort     : process.env.port

    });
    cloudeer.downloadService();

    cloudeer.registerService();

    console.log('===========================');
    console.log("TODO: 尚未实现自动提交方法到 cloudeer");

  };

  return app;
}

module.exports = KoaApplication;