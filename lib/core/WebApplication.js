'use strict';

const path = require('path');
const logger = require('../share/logger');
const nunjucks = require('nunjucks');

// 加载前置配置
const app_root = path.resolve('.');
let config = {};
try {
    logger.log("Load config [base].");
    config = require(app_root + '/config/base');
} catch (e) {
    logger.warn("No config for [base], skipped.");
}

if (!global.appName) {
    global.appName = config.appName || path.basename(app_root);
}

global.instanceId = null;


const tools = require('../share/tools');
const KoaApplication = require("koa");
const eveRpc = require("../rpc/eve-rpc");

class WebApplication extends KoaApplication {

    constructor(options) {
        super();

        this.config = {};
        this.loadConfig();
        options = options || {};
        global.debug = options.debug || this.config.debug || false;


        //Set for response body.
        // options.standardVersion = options.standardVersion || "0.0.1";
        // options.apiVersion = options.apiVersion || "0.0.1";
        // options._input_charset = options._input_charset || "utf-8";
        options.lang = options.lang || "zh-CN";
        options.port = options.port || this.config.port || 3000;

        if (!options.hasOwnProperty("autoRouter")) {
            options.autoRouter = true;
        }
        options.autoRouter = options.autoRouter === true;


        if (!options.hasOwnProperty("bodyParser")) {
            options.bodyParser = true;
        }
        options.bodyParser = options.bodyParser === true;

        if (!options.hasOwnProperty("errorHandle")) {
            options.errorHandle = true;
        }
        options.errorHandle = options.errorHandle === true;

        if (!options.hasOwnProperty("queryStringParser")) {
            options.queryStringParser = true;
        }
        options.queryStringParser = options.queryStringParser === true;

        this.options = options;

        this.init();

    }

    init() {
        this.bindEcho();
        this.bindHttpRequest();

        //debug 模式下屏蔽烦人的 favicon
        if (global.debug) {
            this.use(require('../midldleware/favicon-blocker'));
        }

        this.bindBodyParser();
        this.bindQs();

        const errorHandle = require('./../midldleware/error-handle');

        //前置错误捕获
        if (this.options.errorHandle) {
            this.use(errorHandle.ahead);
        }

        this.bindNunjucks();

        //允许制定前置 中间键
        const preMiddles = this.options.middles;
        if (preMiddles) {
            if (Array.isArray(preMiddles)) {
                for (let mi of preMiddles) {
                    this.use(mi.bind(this));
                }
            } else {
                this.use(preMiddles.bind(this));
            }
        }


        //  console.log("XXXXXXXXXXXXXXXXXXXXXXXXXX", this.config);
        //viewloader 插件
        if (this.config.viewloader) {
            const viewloader = require("../midldleware/viewloader");
            this.use(viewloader(this.config.viewloader));
        }

        //自动路由
        this.router = null;
        if (this.options.autoRouter) {
            const autoRouter = require("../midldleware/auto-router");
            this.router = autoRouter();
        } else {
            this.router = new require('koa-router')();
        }
        this.use(this.router.routes());

        //bind rpc
        this.mixinEveRpc();

        //后置置错误捕获
        if (this.options.errorHandle) {
            this.use(errorHandle.behind);
        }
        this.eveRegister();
    }



    bindNunjucks() {

        const nunjucksOpts = {};
        if (global.debug) {
            nunjucksOpts.noCache = true;
        }
        if (!this.config.template) {
            this.config.template = {};
        }
        if (this.config.template.assets) {
            this.use(require('../midldleware/static-files'));
        }
        if (this.config.template.staticFolder) {
            nunjucks.configure(this.config.template.staticFolder, nunjucksOpts);
            logger.log("eve static folder:", this.config.template.staticFolder);

            this.use(require('../midldleware/nunjucks-static'));
        }
        if (this.config.template.viewFolder) {
            nunjucks.configure(this.config.template.viewFolder, nunjucksOpts);
        }

    }

    bindQs() {
        if (this.options.queryStringParser) {
            // logger.log();
            logger.log("Apply middleware: [queryStringParser] ");
            // logger.log();

            const querystring = require('querystring');
            this.use(async (ctx, next) => {
                ctx.qs = querystring.parse(ctx.request.querystring);
                await next();
            });
        }

    }

    bindBodyParser() {
        //绑定 body-parser
        if (this.options.bodyParser) {
            //自动解析 POST 请求为: this.request.body
            // logger.log();
            logger.log("Apply middleware: [body_parser] ");
            // logger.log();
            const bodyParser = require('koa-bodyparser');
            let bodyConfig = this.config.bodyParser || {};
            if (!bodyConfig.jsonLimit) {
                bodyConfig.jsonLimit = "10mb";
            }
            if (!bodyConfig.textLimit) {
                bodyConfig.textLimit = "10mb";
            }
            this.use(bodyParser(bodyConfig));
        }
    }

    bindHttpRequest() {
        const request = require("request");
        this.context.curl = (options) => {
            return new Promise((res, rej) => {
                request(options, (err, response, body) => {
                    if (err) {
                        rej(err);
                    } else {
                        res(response);
                    }
                });
            });
        }
    }

    bindEcho() {
        //统一的输出，取代 this.body = ...
        const Response = require('./Response');
        const response = new Response(this.options);
        this.context.echo = function (data, csrfId, action) {
            //this.set('X-Powered-By', 'eve');
            let res = response.body(data, csrfId, action);
            let jpCallback = this.qs.callback;
            if (jpCallback && this.method === "GET") {
                this.type = "text/javascript";
                this.body = `${jpCallback}(${JSON.stringify(res)})`;
            } else {
                this.body = res;
            }
        };
    }

    eveRegister() {
        if (this.config.eveConfig && this.config.eveConfig.regServer) {
            let RestRegClient = require('../rpc/RestRegClient');
            // this.config.eveConfig.myHost = tools.getLocalIp();
            // this.config.eveConfig.myPort = this.options.port;

            let regClient = new RestRegClient({
                asProvider: this.config.eveConfig.asProvider,
                asConsumer: this.config.eveConfig.asConsumer,
                myHost: tools.getLocalIp(),
                myPort: this.options.port,
                groupName: this.config.groupName,
                appName: this.config.appName,
                regServer: this.config.eveConfig.regServer,
                downInterval: this.config.eveConfig.downInterval,
                upInterval: this.config.eveConfig.upInterval
            });

            regClient.registerService();
            regClient.downloadService();
        }
    }

    /**
     * 绑定 eve 远程调用的配置，初期从配置文件中获取，后期从 config server 中获取
     * eve 的远程访问绑定
     */
    mixinEveRpc() {
        if (this.config.hasOwnProperty("eveConfig")) {
            eveRpc.providers = this.config.eveConfig.providers;
            //绑定远程方法调用
            this.context.getEve = (service, url, params) => {
                return eveRpc.invokeAsync("GET", service, url, params);
            };

            this.context.postEve = (service, url, params) => {
                return eveRpc.invokeAsync("POST", service, url, params);
            };

            if (this.config.eveConfig.asConsumer) {
                //eve router 绑定
                eveRpc.koaRouter(this);
            }
        }
    }


    /**
     * hsf 绑定
     */
    mixinHsf() {
        if (this.config.hsfConfig) {
            const HsfClient = require('../rpc/HsfClient');
            let hsfClient = new HsfClient(this.config);
            hsfClient.beginService();
            this.context.hsf = async (service, method, params) => {
                return await hsfClient.invoke(service, method, params);
            };
            hsfClient.koaRouter(this);
        }
    }

    /**
     * 打印应用信息到 控制台
     */
    printAppInfo() {

        const pjson = require('../../package.json');
        logger.log(`
        ┌─┐┬  ┌─┐┬ ┬┌┬┐┌─┐┬  ┬  
        │  │  │ ││ │ │││ ││  │  
        └─┘┴─┘└─┘└─┘─┴┘└─┘┴─┘┴─┘  
   :: cloudoll :: ${pjson.version} 
   ❤  ❤ ❤ ❤ 
❤  appName   : ${global.appName}
❤  debugMode : ${global.debug}
❤  url       : http://localhost:${this.options.port}
❤  ❤ ❤ ❤ 
`);


    }

    /**
     * 加载配置文件
     */
    loadConfig() {
        this.config = config;
        process.env.NODE_ENV = process.env.NODE_ENV || "development";

        logger.log(`Load config of NODE_ENV [${process.env.NODE_ENV}].`);
        try {

            let configEnv = require(app_root + "/config/" + process.env.NODE_ENV);

            let replaceConf = function (tarConf, srcConf) {
                for (let key in srcConf) {
                    if (srcConf[key] instanceof Object && !(srcConf[key] instanceof Array)) {
                        if (!tarConf.hasOwnProperty(key)) {
                            tarConf[key] = {};
                        }
                        replaceConf(tarConf[key], srcConf[key]);
                    } else {
                        tarConf[key] = srcConf[key];
                    }
                }
            };
            replaceConf(this.config, configEnv);

        } catch (ex) {
            console.warn(`No config for NODE_ENV [${process.env.NODE_ENV}], skipped.`);
        }

        //logger.rainbow(JSON.stringify(this.config));
    }

    /**
     * 单线程模式启动，前端开发模式
     */
    startSingle() {
        this.printAppInfo();
        return this.listen(this.options.port);
    }

    /**
     * 单线程模式启动，前端开发模式
     */
    startService() {
        this.printAppInfo();
        return this.listen(this.options.port);
    }

    /**
     * 集群模式启动
     */
    startCluster() {
        const cluster = require('cluster');
        const numCPUs = require('os').cpus().length;


        if (cluster.isMaster) {
            console.log(`Master ${process.pid} is running`);

            // Fork workers.
            for (let i = 0; i < numCPUs; i++) {
                cluster.fork();
            }

            cluster.on('exit', (worker, code, signal) => {
                console.log(`worker ${worker.process.pid} died`);
            });
            this.printAppInfo();
        } else {
            this.listen(this.options.port);

        }
    }
}

module.exports = WebApplication;