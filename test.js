process.env.appName = "Shopcart";
process.env.debug   = true;

// var errors = require('./').errors;
// var koas   = require('./').koas;
var koa        = require('koa');
var app        = koa();
var bodyParser = require('koa-bodyparser');


// var errHandle  = new koas.ErrorsHandle();
// var autoRouter = new koas.AutoRouter();
var KoaMiddle = require('./').KoaMiddle;
var koaMiddle = new KoaMiddle();

app.use(bodyParser());
app.use(koaMiddle.errorsHandleAhead);

app.use(koaMiddle.jsonValidator().schemaValidator);

app.use(koaMiddle.queryStringParser);

app.use(koaMiddle.autoRouters().routes());

app.use(koaMiddle.errorsHandleBehind);


app.listen(3001);


setTimeout(function () {
  var request = require('request');

  request({
    url: 'http://localhost:3001/open/loveme/hello5', method: 'POST', json: {
      goods_id: "ddd"
    }
  }, function (err, res, body) {
    console.log(body);
  })
}, 2000);