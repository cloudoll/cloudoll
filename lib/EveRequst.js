const querystring = require("querystring");
const errors = require("./eve-errors").errors;
const EveError = require("./eve-errors").EveError;
const tools = require("./tools");
const FormStream = require('formstream');
const sendToWormhole = require('stream-wormhole');

class EveRequest {
  constructor(options) {
    options = options || {};
    this.ctx = options.ctx;
    this.app = options.app;
    if (this.ctx) {
      this.app = this.app || this.ctx.app;
    }
    if (!this.app) {
      throw errors.WHAT_REQUIRE("需要指定 app 或者 ctx");
    }
  }


  async request(verb, service, url, params, ctx) {
    const xres = this.parseParameter(verb, service, url, params);
    const options = xres.data;
    const oriContentType = ctx.headers["content-type"];
    if (oriContentType && oriContentType.indexOf("json") > 0) {
      options.contentType = "json";
    }
    const result = await ctx.curl(xres.url, xres.data);

    if (result.status === 200) {
      if (result.headers["content-disposition"]) {
        ctx.set("content-disposition", result.headers["content-disposition"]);
        return result;
      } else if (
        result.headers["content-type"] &&
        result.headers["content-type"].indexOf("json") > 0
      ) {
        let resolveData = JSON.parse(result.data);
        if (resolveData.hasOwnProperty("success")) {
          if (resolveData.success) {
            return resolveData.data;
          } else {
            return EveError.fromJson(resolveData.data);
          }
        }
      }
    }
  }

  parseParameter(httpMethod, serviceName, methodUri, parameters) {
    try {
      parameters = JSON.parse(parameters);
    } catch (e) {
    }
    if (!serviceName) {
      throw errors.WHAT_REQUIRE("service");
    }
    if (!methodUri) {
      throw errors.WHAT_REQUIRE("url");
    }

    let serviceNode = this.app.providers[serviceName];
    if (!serviceNode) {
      serviceNode = this.app.providers["*"];
    }
    if (!serviceNode) {
      throw errors.WHAT_NOT_EXISTS(`服务 [${serviceName}]`);
    }
    let myHosts = serviceNode.hosts;
    if (!myHosts || myHosts.length === 0) {
      throw errors.CUSTOM(`当前服务 [${serviceName}] 中没有可用服务器`);
    }
    let hostsLen = myHosts.length;
    let pickIndex = tools.randomInt(hostsLen);
    let host = myHosts[pickIndex];

    let accessUrl =
      `${host.schema || "http"}://${host.host}:${host.port}` + (host.baseUri || "") + methodUri;

    httpMethod = httpMethod || "GET";
    httpMethod = httpMethod.toUpperCase();
    let options = {
      method: httpMethod,
      data: parameters,
      dataType: "text",
      // contentType: "json",
      rejectUnauthorized: false
    };

    if (this.app.config.env !== "prod") {
      this.app.logger.info("RPC", options.method, accessUrl);
      if (options.data) {
        this.app.logger.info("参数", options.data);
      }
    }

    return {
      url: accessUrl,
      options: options
    };
  }


  eggRouter() {
    this.app.all("/rpc/eve", async (ctx) => {
      let form;
      if (ctx.method === "GET") {
        form = ctx.query;
        if (form.params) {
          try {
            form.params = JSON.parse(form.params);
          } catch (e) {
            form.params = null;
            ctx.app.logger.error(e);
          }
        }
      } else {
        form = this.request.body;
      }

      form = form || {};
      ctx.body = await ctx.app.eveRpc.request(
        ctx.method,
        form.service,
        form.url,
        form.params,
        ctx
      );
    });

    this.app.post("/rpc/get-eve", async (ctx) => {
      let form = ctx.request.body;
      form = form || {};
      this.body = await ctx.app.eveRpc.request("GET", form.service, form.url, form.params, ctx);
    });

    this.app.post("/rpc/post-eve", async (ctx) => {
      let form = ctx.request.body;
      form = form || {};
      ctx.body = await ctx.app.eveRpc.request("POST", form.service, form.url, form.params, ctx);
    });

    this.app.post("/rpc/eve-form", async () => {
      ctx.body = await ctx.app.eveRpc.formRequest("POST", ctx.request, ctx);
    });


    if (this.app.config.env !== "prod") {
      this.app.logger.info("Auto route ALL: /rpc/eve");
      this.app.logger.info("Auto route POST: /rpc/get-eve");
      this.app.logger.info("Auto route GET : /eve/providers 可以查看当前 eve 服务提供者。");
      this.app.get("/eve/providers", function* () {
        this.body = this.app.providers;
      });
    }
  }
}

module.exports = EveRequest;
