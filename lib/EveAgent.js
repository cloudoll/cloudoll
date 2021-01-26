const path = require('path');
const egg = require('egg');
const EGG_PATH = Symbol.for('egg#eggPath');

//const EGG_LOADER = Symbol.for('egg#loader');
// const EveRegClient = require('./RestRegClient');
//const AgentWorkerLoader = require('./EveAgentWorkerLoader');
//const router = require("./auto-router");k,m
const tools = require("./tools");

class EveAgent extends egg.Agent {
  constructor(options) {
    super(options);
    this.printLogo();

    //this.autoRouter(); //这个仅仅为了打印控制台，并不会在 agent workder 中真实映射

    // this.messenger.on('egg-ready', () => {
    //   this.startEveRegService();
    // });
  }

  //autoRouter() {
  //  router(this, true);
  //}

  // startEveRegService() {
  //   if (this.config.eve && this.config.eve.regServer && (!this.config.eve.providers)) {
  //     let eve = this.config.eve;
  //     eve.myHost = eve.myHost || tools.getLocalIp();
  //     eve.myPort = eve.myPort || global.eggPort;
  //     let client = new EveRegClient(eve);
  //     client.downloadService((err, providers, innerIps) => {
  //       if (err) {
  //         throw err;
  //       }
  //       this.messenger.sendToApp("providersUpdate", {
  //         providers: providers, innerIps: innerIps
  //       });
  //     });
  //     client.registerService();
  //   }
  // }

  printLogo() {
    const pjson = require('../package.json');
    console.log(`
---------------------------
:: cloudoll  : ${pjson.version} 
:: appName   : ${this.config.name}
:: url       : http://127.0.0.1:${global.eggPort} .........
---------------------------
`);
  }

  get [EGG_PATH]() {
    return path.dirname(__dirname);
  }

  //get [EGG_LOADER]() {
  //  return AgentWorkerLoader;
  //}
}

module.exports = EveAgent;