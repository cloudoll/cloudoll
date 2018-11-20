const errors = require('../error/errors');
const logger = require('../share/logger');
const querystring = require('querystring');
const request = require('request');
const eveRpc = require('./eve-rpc');


function RestRegClient(options) {
  options = options || {};
  if (!options.regServer) {
    throw errors.WHAT_REQUIRE("regServer");
  }
  /**
   * 服务器名称，如果不指定则取 appName 环境变量。
   * @type {*|string|string}
   */
  this.appName = options.appName || appName;

  /**
   * 注册服务的地址
   */
  this.regServer = options.regServer;
  /**
   * 下载间隔时间
   * @type {number} 单位 秒
   */
  this.downInterval = options.downInterval || 15;
  /**
   * 上行间隔时间
   * @type {number} 单位 秒
   */
  this.upInterval = options.upInterval || 13;
  /**
   * 当前服务的主机地址
   */
  this.myHost = options.myHost;
  /**
   * 当前服务的端口
   */
  this.myPort = parseInt(options.myPort);
  /**
   * 当前的实例名称
   * @type {null}
   */
  this.instanceId = null;

  this.groupName = options.groupName || "eve";

  this.asConsumer = !!options.asConsumer;

  this.asProvider = !!options.asProvider;
}

/**
 * 从注册中心下载服务器列表
 */
RestRegClient.prototype.downloadService = function () {
  if (!this.asConsumer) {
    return;
  }
  let rUrl = this.regServer + "/eve/apps";
  let download = function () {
    request(rUrl, (err, res, body) => {
      if (err) {
        logger.error("能源舱故障，下载失败，继续尝试...");
      } else {
        if (res.statusCode === 200) {
          let jRes = JSON.parse(body);
          if (Object.keys(jRes).length > 0) {
            eveRpc.providers = jRes;
          }
          for (let svr in eveRpc.providers) {
            if (eveRpc.providers.hasOwnProperty(svr)) {
              let hosts = eveRpc.providers[svr].hosts;
              for (let h of hosts) {
                eveRpc.innerIps[h.host] = 1;
              }
            }
          }
        }
      }
    });
  };
  logger.info(`准备从 eve-registry [${this.regServer}] 能源舱下载服务副本...`);

  setInterval(download, this.downInterval * 1000);
  download();
};


// Cloudeer.prototype.downloadMethods = function () {
//
// };

/**
 * 注册服务到 eve-registry
 */
RestRegClient.prototype.registerService = function () {
  if (!this.asProvider) {
    return;
  }
  if (!this.myHost) {
    throw errors.WHAT_REQUIRE("myHost[本服务的ip或者域名]");
  }
  if (!this.myPort) {
    throw errors.WHAT_REQUIRE("myPort[本服务的端口]");
  }
  if (!this.appName) {
    throw errors.WHAT_REQUIRE("appName[本服务名称]");
  }

  logger.info(`正在将本体传送到 eve-registry 能源舱...`);

  let regUrl = `${this.regServer}/eve/apps/${this.appName}`; //?name=${this.appName}&host=${this.myHost}&port=${this.myPort}`;
  let _this = this;
  request.post({
    url : regUrl,
    json: {
      groupName: this.groupName,
      host     : this.myHost,
      port     : this.myPort,
      status   : 1
    }
  }, (err, httpResponse, body) => {
    if (err) {
      logger.error(`注册失败：能源舱故障，重新请求身份登入...`);
      setTimeout(() => _this.registerService(), _this.upInterval * 1000);
    } else {
      logger.info(`顺利登入，准备发送心跳...`);
      _this.instanceId = body.instanceId;
      _this.heartbeat();
    }
  });


  // let postService = function () {
  //   request(regUrl, function (err) {
  //     if (err) {
  //       logger.error('cloudeer 注册中心连接不上，请联系管理员。');
  //       logger.error(regUrl);
  //     }
  //   });
  // };
  // postService();
  // setInterval(postService, this.upInterval * 1000);
};


RestRegClient.prototype.heartbeat = function () {

  logger.info(`发送心跳...`);

  let heartBreak = false;
  let _this = this;

  let beatUrl = `${this.regServer}/eve/apps/${this.appName}/${this.instanceId}`;
  let beatTask = function () {
    if (!heartBreak) {
      request.put({
        url: beatUrl
      }, (err, httpResponse, body) => {
        if (err || body !== "true") {
          heartBreak = true;
          logger.error(`心跳失败：能源舱故障，重新请求身份登入...`);
          _this.registerService();
        }
      });
    }
  };
  setInterval(beatTask, this.upInterval * 1000);


  // let postService = function () {
  //   request(regUrl, function (err) {
  //     if (err) {
  //       logger.error('cloudeer 注册中心连接不上，请联系管理员。');
  //       logger.error(regUrl);
  //     }
  //   });
  // };
  // postService();
  // setInterval(postService, this.upInterval * 1000);
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
// RestRegClient.prototype.registerMethods = function (methodsArray) {
//   if (!this.appName) {
//     throw errors.WHAT_REQUIRE("本服务名称 [appName]");
//   }
//   // for (var mm of methodsArray) {
//   //   if (!mm.open) {
//   //     if (Cloudeer.authUris.indexOf(mm.url) < 0) {
//   //       Cloudeer.authUris.push(mm.url);
//   //     }
//   //   }
//   // }
//   var methods = {
//     service: this.appName,
//     methods: methodsArray
//   };
//   logger.info('===========================');
//   logger.info("正在提交 rest 方法，通常这个仅需要提交一次。请在合适的时候提交。");
//   request.post({
//     url : this.eveRegHost + '/register/methods',
//     json: methods
//   }, function (error, response, body) {
//     if (error) {
//       logger.error("提交方法出错，请检查注册服务器是否启动。");
//       logger.error(error);
//     } else {
//       if (body.errno == 0) {
//         myTools.consoleLog("rest 方法提交成功。");
//       } else {
//         logger.error(body.errText);
//       }
//     }
//   });
// };


module.exports = RestRegClient;