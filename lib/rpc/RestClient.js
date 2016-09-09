var errors      = require('../errors/errors');
var myTools     = require('../tools');
var querystring = require('querystring');
var Cloudeer    = require('./Cloudeer');
var request     = require('request');
var logger      = require('tracer').colorConsole();


function RestClient(options) {
  options = options || {};
  if (!options.cloudeerUri) {
    throw errors.WHAT_REQUIRE("cloudeerUri[注册中心地址]");
  }
  var appName = options.app_name || process.env.app_name;

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
  this.app_name = appName;
  /**
   * 当前服务的主机地址
   */
  this.myHost = options.myHost;
  /**
   * 当前服务的端口
   */
  this.myPort = parseInt(options.myPort);
}

/**
 * 从注册中心下载服务器列表
 */
RestClient.prototype.downloadService = function () {
  var rUrl     = this.cloudeerUri + "/load-config";
  var download = function () {
    request(rUrl, function (err, res, body) {
      if (err) {
        logger.error(err);
      } else {
        if (res.statusCode == 200) {
          Cloudeer.config = JSON.parse(body).data;
          //console.log(Cloudeer.config);
          for (var svr in Cloudeer.config) {
            if (Cloudeer.config.hasOwnProperty(svr)) {
              var hosts = Cloudeer.config[svr].hosts;
              for (var h of hosts) {
                Cloudeer.innerIps[h.host] = 1;
              }
            }
          }
        }
      }
    });
  };
  console.log("注册中心：" + this.cloudeerUri);
  myTools.consoleLog('===========================');
  myTools.consoleLog(`Cloudeer 客户端启动，将持续从 ${this.cloudeerUri} 获取服务资源。`);

  setInterval(download, this.downInterval * 1000);
  download();
};


// Cloudeer.prototype.downloadMethods = function () {
//
// };

/**
 * 注册服务到 cloudeer
 */
RestClient.prototype.registerService = function () {
  if (!this.myHost) {
    throw errors.WHAT_REQUIRE("myHost[本服务的ip或者域名]");
  }
  if (!this.myPort) {
    throw errors.WHAT_REQUIRE("myPort[本服务的端口]");
  }
  if (!this.app_name) {
    throw errors.WHAT_REQUIRE("appName[本服务名称]");
  }

  myTools.consoleLog('===========================');
  myTools.consoleLog(`正在提交服务`);

  var regUrl = `${this.cloudeerUri}/register?name=${this.app_name}&host=${this.myHost}&port=${this.myPort}`;

  var postService = function () {
    request(regUrl, function (err) {
      if (err) {
        logger.error('cloudeer 注册中心连接不上，请联系管理员。');
        logger.error(regUrl);
      }
    });
  };
  postService();
  setInterval(postService, this.upInterval * 1000);
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
RestClient.prototype.registerMethods = function (methodsArray) {
  if (!this.app_name) {
    throw errors.WHAT_REQUIRE("本服务名称 [appName]");
  }
  for (var mm of methodsArray) {
    if (!mm.open) {
      if (Cloudeer.authUris.indexOf(mm.url) < 0) {
        Cloudeer.authUris.push(mm.url);
      }
    }
  }
  var methods = {
    service: this.app_name,
    methods: methodsArray
  };
  myTools.consoleLog('===========================');
  myTools.consoleLog("正在提交 rest 方法，通常这个仅需要提交一次。请在合适的时候提交。");
  request.post({
    url : this.cloudeerUri + '/register/methods',
    json: methods
  }, function (error, response, body) {
    if (error) {
      logger.error("提交方法出错，请检查注册服务器是否启动。");
      logger.error(error);
    } else {
      if (body.errno == 0) {
        myTools.consoleLog("rest 方法提交成功。");
      } else {
        logger.error(body.errText);
      }
    }
  });
};


module.exports = RestClient;