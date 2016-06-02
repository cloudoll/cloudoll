# cloudoll

cloudark 生态圈中的共享工具

依赖的微服务：

1. cloudarling

安装：

```
npm i cloudoll --save
```


## koa 的拦截器

```
var KoaMiddleWares = require('cloudoll').KoaMiddleWares;
var koaMiddlewares = new KoaMiddleWares('myService');

```

### 权限验证

使用方法：

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

# 我已经狂晕了。。。。