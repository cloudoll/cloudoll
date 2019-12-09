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
    this.app.eveRpc = this;
  }

  parseParameter(httpMethod, serviceName, methodUri, parameters) {
    try{
      parameters = JSON.parse(parameters);
    }catch(e){
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
      data: options
    };
  }

  request(verb, service, url, params, ctx) {
    let xres = this.parseParameter(verb, service, url, params);
    let app = this.app;

    const options = xres.data;
    const oriContentType = ctx.headers["content-type"];
    if (oriContentType && oriContentType.indexOf("json") > 0) {
      options.contentType = "json";
    } 

    return new Promise((resolve, reject) => {
      app.httpclient.request(xres.url, xres.data, function(err, data, result) {
        if (err) {
          reject(err);
        } else {
          let resolveData = data;
          if (result.status === 200) {
            if (result.headers["content-disposition"]) {
              ctx.set("content-disposition", result.headers["content-disposition"]);
              //这里不处理，用默认值
            } else if (
              result.headers["content-type"] &&
              result.headers["content-type"].indexOf("json") > 0
            ) {
              data = JSON.parse(data);
              if (data.hasOwnProperty("success")) {
                if (data.success) {
                  resolveData = data.data;
                } else {
                  resolveData = EveError.fromJson(data);
                }
              }
            }
          }
          //if (resolveData instanceof EveError) {
          //  reject(resolveData);
          //} else {
          //  resolve(resolveData);
          //}

          resolve(resolveData);
        }
      });
    });
  }

  *formRequest(verb, request, ctx) {
    let stream = yield ctx.getFileStream();
    let options = stream.fields;
    // console.info('------------form_data------------\r\n', options);

    let xres = this.parseParameter(verb, options.service, options.url, options.params);
    // console.info('------------xres------------\r\n', xres);
    try {
      let form = new FormStream();
      // 设置key value
      if(options.params){
        let params = JSON.parse(options.params)
        for(let key in params){
          form.field(key, params[key]);
        }
      }
      form.stream('file', stream, options.name);
      //测试url: 'https://httpbin.org/post'
      const result = yield ctx.curl(xres.url, {
        // 必须指定 method，支持 POST，PUT
        method: 'POST',
        // 生成符合 multipart/form-data 要求的请求 headers
        headers: form.headers(),
        // 以 stream 模式提交
        stream: form,
        // 明确告诉 HttpClient 以 JSON 格式处理响应 body
        dataType: 'json',
      });

      let respons = {
        data: result.data
      };
      if (result.status === 200) {
        respons.success = true;
      } else {
        respons.success = false;
      }
      return respons;
    } catch (err) {
      // 必须将上传的文件流消费掉，要不然浏览器响应会卡死
      yield sendToWormhole(stream);
      throw err;
    }
  }

  parseParameter2(service, url, options) {
    // let httpMethod, serviceName, methodUri, parameters
    if (!service) {
      throw errors.WHAT_REQUIRE("service");
    }
    if (!url) {
      throw errors.WHAT_REQUIRE("url");
    }

    let serviceNode = this.app.providers[service];
    if (!serviceNode) {
      serviceNode = this.app.providers["*"];
    }
    if (!serviceNode) {
      throw errors.WHAT_NOT_EXISTS(`服务 [${service}]`);
    }
    let myHosts = serviceNode.hosts;
    if (!myHosts || myHosts.length === 0) {
      throw errors.CUSTOM(`当前服务 [${serviceName}] 中没有可用服务器`);
    }
    let hostsLen = myHosts.length;
    let pickIndex = tools.randomInt(hostsLen);
    let host = myHosts[pickIndex];

    let accessUrl =
      `${host.schema || "http"}://${host.host}:${host.port}` + (host.baseUri || "") + url;

    let httpMethod = options.method || "GET";
    httpMethod = httpMethod.toUpperCase();
    options.method = httpMethod;
    // options.dataType="text";
    //options.url = accessUrl;
    // options.dataType = options.dataType || "text";

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

  *request2(service, url, options, ctx) {
    let xres = this.parseParameter2(service, url, options);
    const result = yield ctx.curl(xres.url, xres.options);
    let data = result.data;
    if (result.status === 200) {
      if (result.headers["content-disposition"]) {
        ctx.set("content-disposition", result.headers["content-disposition"]);
        //这里不处理，用默认值
      } else if (
        result.headers["content-type"] &&
        result.headers["content-type"].indexOf("json") > 0
      ) {
        data = data.toString();
        data = JSON.parse(data);
        let resolveData = data;
        if (data.hasOwnProperty("success")) {
          if (data.success) {
            resolveData = data.data;
          } else {
            resolveData = EveError.fromJson(data);
          }
        }
        return resolveData;
      }
    }
    return data;
  }

  eggRouter() {
    this.app.all("/rpc/eve", function*() {
      let form;
      if (this.method === "GET") {
        form = this.query;
        if (form.params) {
          try {
            form.params = JSON.parse(form.params);
          } catch (e) {
            form.params = null;
            this.app.logger.error(e);
          }
        }
      } else {
        form = this.request.body;
      }

      form = form || {};
      //const data = yield this.app.eveRpc.request(this.method, form.service, form.url, form.params, this);
      //this.body = data;
      this.body = yield this.app.eveRpc.request(
        this.method,
        form.service,
        form.url,
        form.params,
        this
      );
    });

    this.app.post("/rpc/get-eve", function*() {
      let form = this.request.body;
      form = form || {};
      this.body = yield this.app.eveRpc.request("GET", form.service, form.url, form.params, this);
    });

    this.app.post("/rpc/post-eve", function*() {
      let form = this.request.body;
      form = form || {};
      this.body = yield this.app.eveRpc.request("POST", form.service, form.url, form.params, this);
    });

    this.app.post("/rpc/eve-form", function*() {
      this.body = yield this.app.eveRpc.formRequest("POST", this.request, this);
    });

    //console.log("Auto route POST: /rpc/post-eve");

    if (this.app.config.env !== "prod") {
      this.app.logger.info("Auto route ALL: /rpc/eve");
      this.app.logger.info("Auto route POST: /rpc/get-eve");
      this.app.logger.info("Auto route GET : /eve/providers 可以查看当前 eve 服务提供者。");
      this.app.get("/eve/providers", function*() {
        this.body = this.app.providers;
      });
    }
  }
}

module.exports = EveRequest;
