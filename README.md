# cloudoll

cloudark 生态圈中的共享工具

安装：

```
npm i cloudoll --save
```

程序开始的时候请指定下面的环境变量：

```
process.env.appName = "Shopcart";
process.env.debug   = true;
```

## 快速启动

快速创建一个 koa 应用程序

```
//默认为 development，将自动加载 ./config/develepment.js 配置文件
process.env.NODE_ENV = 'development';

var KoaApplication = require('cloudoll').KoaApplication;

//这是一个标准的 koa app
var app = KoaApplication();
```

上面的程序已经自动应用了必要的中间键。 配置文件 [./config/develpment.js] 如下：

```
module.exports = {
  debug   : true,
  port: 8909,
  cloudeer: {
    serviceHost: "http://112.74.29.211:8801",
    myHost     : 'localhost',
    myPort     : 3000
  },
  app: {
    controllerDirs: ['/api/open'],
    schemaPath: './schema'
  }
};
```

## 数据库访问

### mongo

```
var mongo = require('cloudoll').orm.mongo;

//这个方法只需在应用启动的时候调用一次
mongo.connect('mongodb://localhost:27017/test');

var result = yield ezmongo.find('collectionName', {a:1}, {skip:20, limit:20});

```

支持如下 API

find

count

findOne

exists

insert

findOneAndUpdate

updateById

save

deleteOne

delete

sum


### mysql

```
var mysql = require('cloudoll').orm.mysql;

//只需调用一次
mysql.connect({
             connectionLimit: 10,
             host           : '10.163.11.23',
             user           : 'xxx',
             password       : 'xxx',
             database       : 'xxx'
           });

mysql.debug = true;

var rest = yield db.load("tablename", {
             where : "id=?",
             cols  : ["id", "nick", "email"],
             params: [1]
           });
```

API 列表

query

输入参数： sql, params

```
ezway2mysql.query('select * from table where id>?', [1]);
```

list

参数： table, conditions {cols:[...], limit:1, skip:0, where:'', params:[...], orderBy: ''}


insert

参数：table, model

update (仅支持主键为 id 自增的表)

参数：table, model

updateBatch

load

count

sum

conditions 里增加 col 参数，这个是需要统计的值

loadByKV

输入 table, key, value

loadById

输入 table, id

寻找列 id 的值是 id 的对象。


## 错误封装

```
var Clouderr = require('cloudoll').Clouderr;
var errors =  require('cloudoll').errors;
```

## Cloudeer 客户端工具

这个是cloudeer 的消费端工具

全示例如下：

```

var Cloudeer = require('cloudoll').Cloudeer;

var cloudeer = new Cloudeer({
  cloudeerUri: 'http://localhost:8801',
  myHost     : 'localhost',
  myPort     : '8088'
});

//这是一个服务进程，每隔一段时间从注册中心下载服务器列表
cloudeer.downloadService();

//这是一个服务进程，每隔一段时间将自己提交到注册中心
cloudeer.registerService();

//这是一个方法，提交方法列表到注册中心
cloudeer.registerMethods([
  {url: "/summary", name: '统计', method: "GET"},
  {url: "/pay-way", name: '支付方法', method: "GET", open: true},
  {url: "/pay-way/delete", name: '支付方法删除', method: "POST"},
  {url: "/pay-ways", name: '支付方法列表', method: "GET"},
  {url: "/cash-order", name: '订单编辑', method: "POST"},
  {url: "/cash-orders", name: '订单列表', method: "GET"},
  {url: "/cash-order/collect", name: '收款', method: "POST"},
  {url: "/cash-order/delete", name: '删订单', method: "POST"}
]);

```

## KOA 的 mongo 通用方法基类

### BaseController

```
var BaseController = require('cloudoll').mongo.BaseController;

var myController = BaseController.create({table: 'myCollection'});
```

### BaseService

```
var BaseController = require('cloudoll').mongo.BaseController;

var myService=new BaseService('myCollection');
```


## koa 拦截器

如下的代码示例，各个拦截器位置参考。

```
var KoaMiddle = require('cloudoll').KoaMiddle;
var koaMiddle = new KoaMiddle();

app.use(koaMiddle.errorsHandleAhead);

app.use(koaMiddle.jsonValidator().schemaValidator);

app.use(koaMiddle.queryStringParser);

app.use(koaMiddle.autoRouters().routes());

app.use(koaMiddle.errorsHandleBehind);

```

#### querystring 解析器

这个解析器将 querystring 弄成json 并且放入 this.qs 中。

```
app.use(koaMiddle.queryStringParser);
```

#### koa 错误拦截器

统一了错误，现在所有的错误类型都是 Clouderr 了

用法：

```

app.use(koaMiddle.errorsHandleAhead);

//use routers

app.use(koaMiddle.errorsHandleBehind);

```

#### JSON schema validator

仅当 POST 的时候有效

```
app.use(koaMiddle.jsonValidator().schemaValidator);
```




# 以下内容尚未实现，稍等。。。。

** koa 的权限拦截器 **

```
var KoaMiddleWares = require('cloudoll').KoaMiddleWares;
var koaMiddlewares = new KoaMiddleWares('myService');

```


```
app.use(koaMiddlewares.checkRights);
```


### MySQL 的全库操作

使用方法

```
app.use(koaMiddlewares.ezway2mysql)
```

下面的代码示例是消费端的页面

```
    function getCloudeer(service, api_method, data, callback) {
      $.post('/cloudeer', {
        service    : service,
        http_method: 'GET',
        api_method : api_method,
        data       : data
      }, function (res) {
        if (callback)callback(res);
      }, 'json');
    }

    var data = {
      method    : 'list',
      table     : 'account',
      ticket    : $.cookie('ticket'),
      conditions: {
        where  : 'id>?',
        params : [1],
        cols   : ['id', 'mobile'],
        limit  : 1000,
        orderBy: 'id desc'
      }
    };

    var base64String = base64.encode(JSON.stringify(data));

    getCloudeer('cloudarling', '/crud', base64String, function (res) {
      console.log(res);
    });

```

消费端的服务端

```
router.post("/cloudeer", function *(next) {
  var form = this.request.body;

  console.dir(JSON.stringify(require("cloudeer").config));
  console.log(form);

  if (!form.service) {
    throw error.WHAT_REQUIRE("service");
  }
  if (!form.api_method) {
    throw error.WHAT_REQUIRE("api_method");
  }

  var httpMethod = form.http_method || "GET";
  // var cloudeer = require("cloudeer");
  this.body = yield cloudeer.invokeCo(httpMethod, form.service, form.api_method, form.data);
});
```
