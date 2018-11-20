const logger = require('../share/logger');
const tools = require('../share/tools');
const errors = require('../error/errors');

const request = require('request');
// const rp = require('request-promise-native');
const querystring = require('querystring');

let invoker = module.exports = {
  invoke       : function (httpMethod, serviceName, methodUri, parameters, callback) {
    let _this = this;
    httpMethod = httpMethod || "GET";
    httpMethod = httpMethod.toUpperCase();

    if (!serviceName) {
      callback(errors.WHAT_REQUIRE('service'));
      return;
    }
    if (!methodUri) {
      callback(errors.WHAT_REQUIRE('url'));
      return;
    }
    invoker.providers = invoker.providers || {};
    if (!invoker.providers.hasOwnProperty(serviceName)) {
      callback(errors.WHAT_NOT_EXISTS(`服务 [${serviceName}]`));
      return;
    }
    let myHosts = invoker.providers[serviceName].hosts;
    if (!myHosts || myHosts.length === 0) {
      callback(errors.CUSTOM(`当前服务 [${serviceName}] 中没有可用服务器`));
      return;
    }
    let hostsLen = myHosts.length;
    let pickIndex = tools.randomInt(hostsLen);
    let host = myHosts[pickIndex];

    let accessUrl = `${host.schema || "http"}://${host.host}:${host.port}` + (host.baseUri || "") + methodUri;
    if (httpMethod === "GET") {
      if (parameters) {
        let query = parameters;
        if (typeof parameters === "object") {
          query = querystring.stringify(parameters);
        }
        if (accessUrl.indexOf("?") > 0) {
          accessUrl = accessUrl + "&" + query;
        } else {
          accessUrl = accessUrl + "?" + query;
        }
      }

      logger.debug("-------- eve rpc -------");
      logger.debug("当前请求：", accessUrl);

      request(accessUrl, function (error, response, body) {

        if (process.env.debug) {
          if (error) {
            logger.error("error:", error);
          }
          console.log("body:", body);
        }
        if (error) {
          //throw errors.CUSTOM("调用出错了。");
          callback(error);
          return;
        }
        let sCode = response.statusCode;

        if (sCode >= 200 && sCode < 300) {
          tools.wrapBody(body, callback);
        } else if (sCode === 408) {
          logger.error("请求超时，移除当前节点，轮转到下一个节点。");
          logger.error(accessUrl);
          myHosts.splice(pickIndex, 1); //移除节点后重试
          _this.invoke(httpMethod, serviceName, methodUri, parameters, callback);
        } else if (sCode === 404) {
          logger.error("这个地址不存在：" + accessUrl);
          callback(errors.WHAT_NOT_FOUND("远程方法"));
        } else {
          callback(errors.CUSTOM(`${body} + [http status: ${sCode}]`));
        }
        // callback(error, body);

      });
    } else if (httpMethod === "POST") {
      logger.debug(`-------- eve rpc -------
POST: ${accessUrl}
Parameter:  ${JSON.stringify(parameters)}`);
      request.post({
        url : accessUrl,
        json: parameters
      }, function (error, response, body) {
        if (error) {
          logger.debug("Response error: ");
          logger.debug(error);
        }
        logger.debug("Response body:", body);

        if (error) {
          callback(error);
          return;
        }

        let sCode = response.statusCode;
        if (sCode >= 200 && sCode < 300) {
          tools.wrapBody(body, callback);
          // callback(null, body);
        } else if (sCode === 408) {
          logger.error("请求超时，移除当前节点，轮转到下一个节点。");
          logger.error("POST: ", accessUrl);
          logger.error("Parameter: ", parameters);
          myHosts.splice(pickIndex, 1);
          _this.invoke(httpMethod, serviceName, methodUri, parameters, callback);
        } else if (sCode === 404) {
          logger.error("这个地址不存在：" + accessUrl);
          callback(errors.WHAT_NOT_FOUND("远程方法"));
        } else {
          logger.debug(`${body} + [http status: ${sCode}]`);
          callback(errors.CUSTOM(`${body} + [http status: ${sCode}]`));
        }
        // callback(error, body);
      });
    }
  },
  invokeAsync  : function (httpMethod, serviceName, methodUri, parameters) {
    let _this = this;
    return new Promise(function (resolve, reject) {
      _this.invoke(httpMethod, serviceName, methodUri, parameters, function (err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
    // return function (callback) {
    //   _this.invoke(httpMethod, serviceName, methodUri, parameters, callback);
    // };
  },
  invokePromise: async function (httpMethod, serviceName, methodUri, parameters) {
    if (!serviceName) {
      throw (errors.WHAT_REQUIRE('service'));
    }
    if (!methodUri) {
      throw(errors.WHAT_REQUIRE('url'));
    }
    invoker.providers = invoker.providers || {};
    if (!invoker.providers.hasOwnProperty(serviceName)) {
      throw(errors.WHAT_NOT_EXISTS(`服务 [${serviceName}]`));
    }
    let myHosts = invoker.providers[serviceName].hosts;
    if (!myHosts || myHosts.length === 0) {
      throw(errors.CUSTOM(`当前服务 [${serviceName}] 中没有可用服务器`));
    }
    let hostsLen = myHosts.length;
    let pickIndex = tools.randomInt(hostsLen);
    let host = myHosts[pickIndex];

    let accessUrl = `${host.schema || "http"}://${host.host}:${host.port}` + (host.baseUri || "") + methodUri;

    httpMethod = httpMethod || "GET";
    httpMethod = httpMethod.toUpperCase();
    let options = {
      method : httpMethod,
      uri    : accessUrl,
      headers: {
        'User-Agent': 'eve-rpc'
      }
    };
    if (httpMethod === "GET") {
      options.qs = parameters;
    } else {
      options.json = parameters;
    }
    logger.debug(`eve rpc ${httpMethod} ${accessUrl},`, parameters);
    return tools.wrapBody(await rp(options));
  },
  koaRouter    : function (app) {
    app.router.all('/rpc/eve', async(ctx) => {
      let form;
      if (ctx.method === "GET") {
        form = ctx.qs;
        if (form.params) {
          try {
            form.params = JSON.parse(form.params);
          } catch (e) {
            form.params = null;
            logger.error(e.message);
          }
        }
      } else {
        form = ctx.request.body;
      }

      form = form || {};
      ctx.echo(await invoker.invokeAsync(ctx.method, form.service, form.url, form.params));
    });

    app.router.post('/rpc/get-eve', async(ctx) => {
      let form = ctx.request.body;
      form = form || {};
      ctx.echo(await invoker.invokeAsync("GET", form.service, form.url, form.params));

    });
    app.router.post('/rpc/post-eve', async(ctx) => {
      let form = ctx.request.body;
      form = form || {};
      logger.debug("eve post: ", form);
      ctx.echo(await invoker.invokeAsync("POST", form.service, form.url, form.params));
    });


    logger.log("Auto route POST: /rpc/eve");
    logger.log("Auto route POST: /rpc/get-eve");
    logger.log("Auto route POST: /rpc/post-eve");

    if (process.env.debug) {
      logger.log("Auto route GET : /eve/providers 可以查看当前 eve 服务提供者。");
      app.router.get('/eve/providers', (ctx) => {
        ctx.echo(invoker.providers);
      });
    }
  },
  providers    : {},
  authUris     : [],
  // innerIps 规则： {"127.0.0.1": 1, "192.168.0.1":1}
  innerIps     : {}
};
