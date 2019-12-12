# cloudoll 2.0 based on eggjs

## Quick start

Install

```bash
npm i cloudoll -S
```

Config in package.json

```json
{
  "egg": {
    "framework": "cloudoll",
    "port": 3002
  }
}
```


## rpc

有如下的方法调用：

```js  
await ctx.rpcEve(verb, service, url, params);
await ctx.getEve(service, url, params);
await ctx.postEve(service, url, params);
```

## eve-errors

```
throw errors.CUSTOM("这是一个自定义错误。");
```

调用前请设定 `global.appName = 'your-service-name'`  这是微服务的名称。

如果需要自定义 error，请定义这个文件：`./app/errors.js `，格式参见下面的 ”默认错误“。

WebStorm 等 IDE 会反射出 errors 中的方法。vscode 目前不会，请从下面的拷贝。

### 这个包的默认错误

```
module.exports = {
  CUSTOM               : {code: -1, message: "%s"},
  HSF_ERROR            : {code: -6, message: "HSF 调用失败：%s。"},
  SYSTEM_ERROR         : {code: -10, message: "系统错误。"},
  BAD_REQUEST          : {code: -400, message: "错误的 http 请求。"},
  NOT_FOUND            : {code: -404, message: "您请求的 http 资源没有找到。"},
  INTERNAL_SERVER_ERROR: {code: -500, message: "内部服务器错误。"},

  DB           : {code: -700, message: "%s"},
  DATA_OCCUPIED: {code: -701, message: "数据被占用。"},

  WHAT_REQUIRE           : {code: -1001, message: "缺少参数 %s。"},
  WHAT_WRONG_RANGE       : {code: -1002, message: "%s 的取值范围错误。最小 %s，最大 %s"},
  WHAT_WRONG_FORMAT      : {code: -1003, message: "%s 格式不正确。"},
  WHAT_NOT_SAME          : {code: -1004, message: "输入的 %s 值不一致。"},
  WHAT_NOT_EXISTS        : {code: -1005, message: "%s 不存在。"},
  WHAT_TOO_MUCH          : {code: -1006, message: "%s 太多了。"},
  WHAT_TOO_LITTLE        : {code: -1007, message: "%s 太少了。"},
  WHAT_NOT_BELONGS_TO_YOU: {code: -1008, message: "%s 不属于你。"},
  WHAT_TOO_LONG          : {code: -1009, message: "%s 太长了，请不要超过 %s。"},
  WHAT_TOO_SHORT         : {code: -1010, message: "%s 太短了，请不要少于 %s。"},
  WHAT_EXISTED           : {code: -1011, message: "%s 已经存在。"},
  WHAT_OCCUPIED          : {code: -1012, message: "%s 被占用。"},
  WHAT_TIMEOUT           : {code: -1013, message: "%s 已超时。"},
  WHAT_EXPIRED           : {code: -1014, message: "%s 已过期。"},
  WHAT_ILLEGAL           : {code: -1015, message: "%s 不合法。"},
  WHAT_NOT_FOUND         : {code: -1016, message: "%s 没找到。"},
  WHAT_WRONG_LENGTH_RANGE: {code: -1017, message: "%s 的长度错误，最短是 %s，最长 %s。"},
  WHAT_WRONG_TYPE        : {code: -1018, message: "%s 的类型错误"},

  ACCESS_TOKEN_NOT_FOUND: {code: -2001, message: "access_token 不存在。"},
  ACCESS_TOKEN_EXPIRED  : {code: -2002, message: "access_token 已经过期。"},

  TICKET_EXPIRED      : {code: -2050, message: "票据已经过期，请重新获取。"},
  TICKET_VERIFY_FAILED: {code: -2051, message: "票据校验失败。篡改登录信息是违法行为！"},
  TICKET_ILLEGAL      : {code: -2052, message: "非法票据。篡改登录信息是违法行为！"},
  SIGN_VERIFY_FAILED  : {code: -2053, message: "签名验证失败。"},

  PASSWORD_NOT_STRONG  : {code: -3001, message: "密码太简单。%s"},
  CHINA_MOBILE_ILLEGAL : {code: -3002, message: "不正确的手机号码。"},
  EMAIL_ILLEGAL        : {code: -3003, message: "不正确的Email。"},
  CAPTCHA_VALIDATE_FAIL: {code: -3004, message: "验证码校验失败。"},
  PASSPORT_ILLEGAL     : {code: -3005, message: "不正确的登录凭据，必须是手机或者 Email。"},
  MEMBER_ONLY          : {code: -3006, message: "您还没有登录，请登录。"},
  NO_RIGHTS            : {code: -3007, message: "您没有权限，请联系管理员授权。"},

  LOGIN_ERROR                  : {code: -3050, message: '登录失败'},
  LOGIN_ERROR_BECAUSE          : {code: -3051, message: "登录失败。%s"},
  MEMBER_NOT_EXISTS            : {code: -3052, message: "用户不存在。"},
  MEMBER_NOT_APPROVED          : {code: -3053, message: "尚未审批通过，请耐心等待。"},
  MEMBER_FORBIDDEN             : {code: -3054, message: "您已经被系统禁止。"},
  MEMBER_LOGIN_TOO_MUCH_FAILURE: {code: -3055, message: "您登录失败的次数太多。暂时被系统锁定"},
  IP_LOGIN_TOO_MUCH            : {code: -3056, message: "您登录失败的次数太多。暴力破解他人密码是违法行为！"},
};
```



## mysql orm

mysql 执行的快捷方式。

请首先安装 mysql，并在 app.js 中初始化。

```js
class AppBootHook {
  constructor(app) {
    this.app = app;
  }
  configWillLoad() {
    const mysql = doll.orm.mysql;
    mysql.mysql = require('mysql');
    mysql.debug = this.app.config.debug;
    mysql.connect(this.app.config.mysql);
  }
}
```

 链接字符串配置：

 ```js
//config/config.{env}.js
module.exports.mysql = {
    connectionLimit: 10,
    host: 'xxxx',
    user: 'xxx',
    password: 'xx-xxx',
    database: 'xxxx'
}
```