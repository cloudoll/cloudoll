const path = require('path');
const egg = require('egg');
const EGG_PATH = Symbol.for('egg#eggPath');
//const EGG_LOADER = Symbol.for('egg#loader');
//const AppWorkerLoader = require('./EveAppWorkerLoader');
// const EveRequest = require('./EveRequst');

class EveApplication extends egg.Application {
  constructor(options) {
    super(options);

    this.config.eve = this.config.eve || this.config.eveConfig || {};

    // console.log('config:', this.config.env, JSON.stringify(this.config.appName, null, 2));
    // this.addJapan();

    // this.onProviderReceived();
    this.onProviderInConfig();

    // this.bindRpc();
    // this.arrangeHsfServices();
  }


  /**
   * 添加代理给自己，日本人。
   */
  // addJapan() {
  //   if (!this.config.eve.selfProxy) {
  //     return;
  //   }
  //   this.config.eve.providers = this.config.eve.providers || {};
  //   this.config.eve.providers["*"] = {
  //     hosts: [
  //       {
  //         "host"  : "127.0.0.1",
  //         "port"  : global.eggPort,
  //         "schema": "http"
  //       }
  //     ]
  //   }
  // }

  bindRpc() {
    //绑定远程服务
    if (this.config.eve.selfProxy || this.config.eve.providers || this.config.eve.regServer) {
      // this.eveRpc = new EveRequest({
      //   app: this
      // });


      /*
       this.rpcEve = async (verb, service, url, params) => {
       return await eveRpc.request(verb, service, url, params);
       };
       this.getEve = async (service, url, params) => {
       return await eveRpc.request("GET", service, url, params);
       };
       this.postEve = async (service, url, params) => {
       return await eveRpc.request("POST", service, url, params);
       };
       */

      // this.rpcEve =  (verb, service, url, params) =>  this.eveRpc.request(verb, service, url, params);

      // this.getEve =  (service, url, params) =>  this.eveRpc.request("GET", service, url, params);

      // this.postEve =  (service, url, params) =>  this.eveRpc.request("POST", service, url, params);


      // eveRpc.eggRouter(this);
    }
  }

  onProviderInConfig() {
    if (this.config.eve && this.config.eve.providers) {
      this.logger.info("Found eve providers in config...");
      this.providers = this.config.eve.providers;
    }
  }

  onProviderReceived() {
    this.messenger.on("providersUpdate", (data) => {
      this.providers = data.providers;
      this.innerIps = data.innerIps;
    });
  }

  get [EGG_PATH]() {
    return path.dirname(__dirname);
  }

  //get [EGG_LOADER]() {
  //  return AppWorkerLoader;
  //}
}

module.exports = EveApplication;