'use strict';


function KoaApplication(isDebug) {

  var koa        = require('koa');
  var path       = require('path');
  var bodyParser = require('koa-bodyparser');

  process.env.NODE_ENV = process.env.NODE_ENV || "development";
  process.env.appRoot  = path.resolve('.');
  process.env.appName  = path.basename(process.env.appRoot);
  console.log("加载配置文件：" + process.env.NODE_ENV);
  var config        = require(process.env.appRoot + '/config/' + process.env.NODE_ENV);
  process.env.port  = config.cloudeer.myPort || 3000;
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

  console.log('Koa Application 启动，端口：' + process.env.port);
  app.listen(process.env.port);


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

  return app;
}

module.exports = KoaApplication;