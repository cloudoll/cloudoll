var errors      = require('../errors/errors');
var myTools     = require('../tools');
var request     = require('request');
var querystring = require('querystring');
var logger      = require('tracer').colorConsole();


function Cloudeer(options) {
  options = options || {};
  if (!options.cloudeerUri) {
    throw errors.WHAT_REQUIRE("cloudeerUri[注册中心地址]");
  }
  var appName = options.appName || process.env.appName;

  /**
   * 注册服务的地址
   */
  this.cloudeerUri = options.cloudeerUri;
  /**
   * 下载间隔时间
   * @type {number} 单位 秒
   */
  this.downInterval = options.downInterval || 10;
  /**
   * 上行间隔时间
   * @type {number} 单位 秒
   */
  this.upInterval = options.upInterval || 8;
  /**
   * 服务器名称，如果不指定则取 appName 环境变量。
   * @type {*|string|string}
   */
  this.appName = appName;
  /**
   * 当前服务的主机地址
   */
  this.myHost = options.myHost;
  /**
   * 当前服务的端口
   */
  this.myPort = options.myPort;
}


Cloudeer.prototype.invoke = function (httpMethod, serviceName, methodUri, parameters, callback) {
  var _this  = this;
  httpMethod = httpMethod || "GET";
  httpMethod = httpMethod.toUpperCase();

  if (!serviceName) {
    callback(errors.WHAT_REQUIRE('serviceName'));
    return;
  }
  if (!Cloudeer.config.hasOwnProperty(serviceName)) {
    callback(errors.WHAT_NOT_EXISTS("服务 [ " + serviceName + "]"));
    return;
  }
  var myHosts = Cloudeer.config[serviceName].hosts;
  if (!myHosts || myHosts.length == 0) {
    callback(errors.CUSTOM(`当前服务 [${serviceName}] 中没有可用服务器`));
    return;
  }
  var hostsLen  = myHosts.length;
  var pickIndex = myTools.randomInt(hostsLen);
  var host      = myHosts[pickIndex];

  var accessUrl = `http://${host.host}:${host.port}` + (host.baseUri || "") + methodUri;
  if (httpMethod == "GET") {
    if (parameters) {
      var query = parameters;
      if (typeof parameters === "object") {
        query = querystring.stringify(parameters);
      }
      if (accessUrl.indexOf("?") > 0) {
        accessUrl = accessUrl + "&" + query;
      } else {
        accessUrl = accessUrl + "?" + query;
      }
    }
    if (process.env.debug) {
      logger.info("cloudeer 当前请求：" + accessUrl);
    }

    request(accessUrl, function (error, response, body) {

      if (error) {
        callback(error);
        return;
      }
      var sCode = response.statusCode;

      if (sCode >= 200 && sCode < 300) {
        myTools.wrapBody(callback, body);
        // callback(null, body);
      } else if (sCode == 408) {
        logger.error("请求超时，移除当前节点，轮转到下一个节点。");
        logger.error(accessUrl);
        myHosts.splice(pickIndex, 1); //移除节点后重试
        _this.invoke(httpMethod, serviceName, methodUri, parameters, callback);
      } else if (sCode == 404) {
        callback(errors.WHAT_NOT_FOUND("api"));
      } else {
        callback(errors.CUSTOM(`${body} + [http status: ${sCode}]`));
      }
      // callback(error, body);

    });
  } else if (httpMethod == "POST") {
    if (process.env.debug) {
      logger.info("-------- Cloudeer -------");
      logger.info("Cloudeer POST: ", accessUrl);
      logger.info("Parameter: ", parameters);
    }
    request.post({
      url : accessUrl,
      json: parameters
    }, function (error, response, body) {
      if (process.env.debug) {
        logger.info("Response error: ");
        logger.info(error);
        logger.info("Response body:");
        logger.info(body)
      }
      if (error) {
        callback(error);
        return;
      }
      var sCode = response.statusCode;
      if (sCode >= 200 && sCode < 300) {
        myTools.wrapBody(callback, body);
        // callback(null, body);
      } else if (sCode == 408) {
        logger.error("请求超时，移除当前节点，轮转到下一个节点。");
        logger.error("Cloudeer POST: ", accessUrl);
        logger.error("Parameter: ", parameters);
        myHosts.splice(pickIndex, 1);
        _this.invoke(httpMethod, serviceName, methodUri, parameters, callback);
      } else if (sCode == 404) {
        callback(errors.WHAT_NOT_FOUND("api"));
      } else {
        callback(errors.CUSTOM(`${body} + [http status: ${sCode}]`));
      }
      // callback(error, body);
    });
  }
};

Cloudeer.prototype.invokeCo = function (httpMethod, serviceName, methodUri, parameters) {
  var _this = this;
  return function (callback) {
    _this.invoke(httpMethod, serviceName, methodUri, parameters, callback);
  };
};

/**
 * 从注册中心下载服务器列表
 */
Cloudeer.prototype.downloadService = function () {
  console.log('===========================');
  console.log(`Cloudeer 客户端启动，将持续从 ${this.cloudeerUri} 获取服务资源。`);
  var rUrl = this.cloudeerUri + "/load-config";
  setInterval(function () {
    request(rUrl, function (err, res, body) {
      if (err) {
        logger.error(err);
        return;
      }
      if (res.statusCode == 200) {
        Cloudeer.config = JSON.parse(body).data;
      }
    });
  }, this.downInterval);
};


// Cloudeer.prototype.downloadMethods = function () {
//
// };

/**
 * 注册服务到 cloudeer
 */
Cloudeer.prototype.registerService = function () {
  if (!this.myHost) {
    throw errors.WHAT_REQUIRE("myHost[本服务的ip或者域名]");
  }
  if (!this.myPort) {
    throw errors.WHAT_REQUIRE("myPort[本服务的端口]");
  }
  if (!this.appName) {
    throw errors.WHAT_REQUIRE("appName[本服务名称]");
  }
  console.log('===========================');
  console.log(`正在提交服务到：${this.cloudeerUri}`);
  var regUrl = `${this.cloudeerUri}/register?name=${this.appName}&host=${this.myHost}&port=${this.myPort}`;
  setInterval(function () {
    request(regUrl, function (err) {
      if (err) {
        logger.error('cloudeer 注册中心连接不上，请联系管理员。');
        logger.error(regUrl);
      }
    });
  }, this.upInterval);
};

/**
 * 向注册中心提交方法。提交的方法同时将非 open 的放入权限验证列表中。
 * @param methodsArray 本程序的方法, 格式如下
 * ```
 * [
 {url: "/summary", name: '统计', method: "GET", open: true},
 {url: "/pay-way", name: '支付方法', method: "GET"},
 {url: "/pay-way/delete", name: '支付方法删除', method: "POST"},
 {url: "/pay-ways", name: '支付方法列表', method: "GET"},
 {url: "/cash-order", name: '订单编辑', method: "POST"},
 {url: "/cash-orders", name: '订单列表', method: "GET"},
 {url: "/cash-order/collect", name: '收款', method: "POST"},
 {url: "/cash-order/delete", name: '删订单', method: "POST"}
 ]

 * ```
 */
Cloudeer.prototype.registerMethods = function (methodsArray) {
  if (!this.appName) {
    throw errors.WHAT_REQUIRE("appName[本服务名称]");
  }
  for (var mm of methodsArray) {
    if (!mm.open) {
      if (Cloudeer.authUris.indexOf(mm.url) < 0) {
        Cloudeer.authUris.push(mm.url);
      }
    }
  }
  var methods = {
    service: this.appName,
    methods: methodsArray
  };
  console.log('===========================');
  console.log("正在提交 rest 方法，通常这个仅需要提交一次。请在合适的时候提交。");
  request.post({
    url : this.cloudeerUri + '/register/methods',
    json: methods
  }, function (error, response, body) {
    if (body.errno == 0) {
      console.log("rest 方法提交成功.");
    }
  });
};

Cloudeer.config   = {};
Cloudeer.authUris = [];

module.exports = Cloudeer;