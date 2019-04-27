var errors      = require('../error/errors');
var myTools     = require('../tools');
var request     = require('request');
var querystring = require('querystring');
var logger      = require('tracer').colorConsole();


const Cloudeer = {
  invoke  : function (httpMethod, serviceName, methodUri, parameters, callback) {
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
      myTools.debug("cloudeer 当前请求：", accessUrl);

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
          logger.error("这个地址不存在：" + accessUrl);
          callback(errors.WHAT_NOT_FOUND("远程方法"));
        } else {
          callback(errors.CUSTOM(`${body} + [http status: ${sCode}]`));
        }
        // callback(error, body);

      });
    } else if (httpMethod == "POST") {
      if (process.env.debug) {
        console.log("-------- Cloudeer -------");
        console.log("Cloudeer POST: ", accessUrl);
        console.log("Parameter: ", parameters);
      }
      request.post({
        url : accessUrl,
        json: parameters
      }, function (error, response, body) {
        if (process.env.debug) {
          if (error) {
            logger.info("Response error: ");
            logger.info(error);
          }
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
  invokeCo: function (httpMethod, serviceName, methodUri, parameters) {
    var _this = this;
    return function (callback) {
      _this.invoke(httpMethod, serviceName, methodUri, parameters, callback);
    };
  },
  config  : {},
  authUris: [],
  // innerIps 规则： {"127.0.0.1": 1, "192.168.0.1":1}
  innerIps: {}
};

module.exports = Cloudeer;