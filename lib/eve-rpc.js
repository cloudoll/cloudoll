const tools = require("./tools");
const EveError = require("./eve-errors").EveError;


const eveRpc = {
  async request(verb, service, url, params, ctx) {
    const xres = eveRpc.parseParameter(verb, service, url, params, ctx);
    const options = xres.options;
    const oriContentType = ctx.headers["content-type"];
    if (oriContentType && oriContentType.indexOf("json") > 0) {
      options.contentType = "json";
    }
    //TODO: opentracing 待实现。
    const result = await ctx.curl(xres.url, options);

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
            throw EveError.fromJson(resolveData);
          }
        }
      }
    }
  },

  parseParameter(httpMethod, serviceName, methodUri, parameters, ctx) {
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
    let accessUrl = `http://${serviceName}${methodUri}`;
    if (ctx.app.providers) {
      let serviceNode = ctx.app.providers[serviceName];
      if (!serviceNode) {
        serviceNode = ctx.app.providers["*"];
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

      accessUrl = `${host.schema || "http"}://${host.host}:${host.port}` + (host.baseUri || "") + methodUri;
    }

    httpMethod = httpMethod || "GET";
    httpMethod = httpMethod.toUpperCase();
    let options = {
      method: httpMethod,
      data: parameters,
      dataType: "text",
      // contentType: "json",
      rejectUnauthorized: false
    };

    if (ctx.app.config.debug) {
      ctx.app.logger.info("RPC", options.method, accessUrl);
      if (options.data) {
        ctx.app.logger.info("参数", options.data);
      }
    }

    return {
      url: accessUrl,
      options: options
    };
  }

};

module.exports = eveRpc;