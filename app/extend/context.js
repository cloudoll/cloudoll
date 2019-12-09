const errors = require("../../lib/eve-errors").errors;

module.exports = {
  /*
   rpcEve : async function (verb, service, url, params) {
   return await this.app.eveRpc.request(verb, service, url, params);
   },
   getEve : async function (service, url, params) {
   return await this.app.eveRpc.request("GET", service, url, params);
   },
   postEve: async function (service, url, params) {
   return await this.app.eveRpc.request("POST", service, url, params);
   }
   */

  rpcEve(verb, service, url, params) {
    if (!this.app.eveRpc) {
      throw errors.CUSTOM("未配置 eve 的微服务节点，无法调用远程服务。");
    }
    return this.app.eveRpc.request(verb, service, url, params, this);
  },
  getEve(service, url, params) {
    if (!this.app.eveRpc) {
      throw errors.CUSTOM("未配置 eve 的微服务节点，无法调用远程服务。");
    }
    return this.app.eveRpc.request("GET", service, url, params, this);
  },
  postEve(service, url, params) {
    if (!this.app.eveRpc) {
      throw errors.CUSTOM("未配置 eve 的微服务节点，无法调用远程服务。");
    }
    return this.app.eveRpc.request("POST", service, url, params, this);
  }
};
