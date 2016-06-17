// var mongo = require('./').orm.mongo;
// var mysql = require('./').orm.mysql;
// var co    = require('co');
//
// mongo.connect("mongodb://mongoadmin:docker_youku@112.74.29.211:27017/order");
// mysql.connect({
//   //mysql host 在我的 fedora 23 里面的 docker 里。
//   connectionLimit: 10,
//   host           : '10.211.55.15',
//   user           : 'root',
//   password       : 'zhwell',
//   database       : 'cloudarling'
// });
//
// setTimeout(function () {
//   co(function *() {
//     var res = yield mongo.find('order');
//     console.log(res);
//
//     var res2 = yield mysql.loadById("account", 56);
//     console.log(res2);
//   });
// }, 1000);


var KoaApp   = require('./').KoaApplication;
var app      = KoaApp();
// var router   = app.router;
// var cloudeer = app.cloudeer;
// var Cloudeer = require('./').Cloudeer;

// setTimeout(function () {
//
//   console.log('cloudeer:', cloudeer);
//   console.log('config:', Cloudeer.config);
//
//   cloudeer.invoke("POST", "mall.service.goods", '/goods/reduce-stock', {
//     '575fbcdad97d10fb1d5b74d1': 15
//   }, function (err, res) {
//     console.log(err, res);
//   });
// }, 10000);
// console.log(router.stack);


// console.log(require('./').errors.MYAPP_CUSTOM('ddddd'));

// console.log(process.env);
// router.get('/', function *() {
//   console.log("----------------", this.app.cloudeer);
//   this.body = "dddd";
// });


// setTimeout(function () {
//
//   console.log(require('./').Cloudeer.authUris);
// }, 100);
// console.log(router.stack);


// process.env.appName = "Shopcart";
// process.env.debug   = true;
//
// // var errors = require('./').errors;
// // var koas   = require('./').koas;
// var koa        = require('koa');
// var app        = koa();
// var bodyParser = require('koa-bodyparser');
//
//
// // var errHandle  = new koas.ErrorsHandle();
// // var autoRouter = new koas.AutoRouter();
// var KoaMiddle = require('./').KoaMiddle;
// var koaMiddle = new KoaMiddle();
//
// app.use(bodyParser());
// app.use(koaMiddle.errorsHandleAhead);
//
// app.use(koaMiddle.jsonValidator().schemaValidator);
//
// app.use(koaMiddle.queryStringParser);
//
// app.use(koaMiddle.autoRouters().routes());
//
// app.use(koaMiddle.errorsHandleBehind);
//
//
// app.listen(13001);
//
//
// // setTimeout(function () {
// //   var request = require('request');
// //
// //   request({
// //     url: 'http://localhost:3001/open/loveme/hello5', method: 'POST', json: {
// //       goods_id: "ddd"
// //     }
// //   }, function (err, res, body) {
// //     console.log(body);
// //   })
// // }, 2000);
//
// var Cloudeer = require('./lib/rpc/Cloudeer');
// var cloudeer = new Cloudeer({
//   cloudeerUri: 'http://localhost:8801',
//   myHost     : 'localhost',
//   myPort     : '8088'
//
// });
// cloudeer.downloadService();
//
// cloudeer.registerService();
//
// cloudeer.registerMethods([
//   {url: "/summary", name: '统计', method: "GET"},
//   {url: "/pay-way", name: '支付方法', method: "GET", open: true},
//   {url: "/pay-way/delete", name: '支付方法删除', method: "POST"},
//   {url: "/pay-ways", name: '支付方法列表', method: "GET"},
//   {url: "/cash-order", name: '订单编辑', method: "POST"},
//   {url: "/cash-orders", name: '订单列表', method: "GET"},
//   {url: "/cash-order/collect", name: '收款', method: "POST"},
//   {url: "/cash-order/delete", name: '删订单', method: "POST"}
// ]);
//
// setInterval(function () {
//
//   // console.log(Cloudeer.config);
//   cloudeer.invoke("POST", "cloudarling", "/login", {passport: "13006699866", password: "111111"}, function (err, body) {
//     //console.log(err, body);
//   });
// }, 5000);