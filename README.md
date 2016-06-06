# cloudoll

cloudark 生态圈中的共享工具

依赖的微服务：

1. cloudarling

安装：

```
npm i cloudoll --save
```

程序开始的时候请指定下面的环境变量：

```
process.env.appName = "Shopcart";
process.env.debug   = true;
```

## 错误封装

```
var Clouderr = require('cloudoll').Clouderr;
var errors =  require('cloudoll').errors;
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

//其他代码

app.use(koaMiddle.errorsHandleBehind);

```

** JSON schema validator **

仅当 POST 的时候有效

```
app.use(koaMiddle.jsonValidator().schemaValidator);
```



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
