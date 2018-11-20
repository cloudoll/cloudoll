const fs = require("fs");
const path = require("path");
const Router = require('koa-router');
const logger = require("../share/logger");
const tools = require('../share/tools');
// const errors = require('../error/errors');
// const co = require('../share/co');


let router = new Router();

/**
 * 自动路由系统
 */
module.exports = function () {

  const parseMethodName = method => {
    let rtn = {};
    let regx = /(get|post|put|delete|patch) (.+)|(__|_|\$\$|\$)(.*)/ig;
    let regxRes = regx.test(method);
    if (regxRes) {
      let method = RegExp.$1 || RegExp.$3;
      switch (method) {
        case "$$":
          method = "put"; // $$
          break;
        case "$":
          method = "post"; // $
          break;
        case "__":
          method = "patch"; // __
          break;
        case "_":
          method = "delete"; // _
          break;
      }
      rtn.method = method;
      //rtn.url = RegExp.$2 || RegExp.$4;
      let url = RegExp.$2;
      if (!url && RegExp.$4) {
        url = tools.transferToUrl(RegExp.$4)
      }
      rtn.url = url;
    } else {
      rtn.method = "get";
      rtn.url = tools.transferToUrl(method);
    }

    rtn.method = rtn.method.toLocaleLowerCase();
    return rtn;
  };

  const eveRoute = (httpMethod, pathName, method) => {
    let funType = method.constructor.name;
    let dftPage = pathName.replace(/\//g, '_').substr(1) + ".html";

    if (funType === "AsyncFunction") {
      router[httpMethod](pathName, async(ctx, next) => {
        let result = await method(ctx, next);
        tools.wrapContext(ctx, result, dftPage);
      });
    } else if (funType === "GeneratorFunction") {
      router[httpMethod](pathName, async(ctx, next) => {
        let proFunc = co(function*() {
          return yield method(ctx, next);
        });
        let result = await proFunc;
        tools.wrapContext(ctx, result, dftPage);
      });
    } else if (funType === "Function") {
      router[httpMethod](pathName, (ctx, next) => {
        let result = method(ctx, next);
        tools.wrapContext(ctx, result, dftPage);
      });
    }
  };

  //Add Home Index '/'
  let homeJs = path.resolve('./app/controller/home.js');
  try {
    fs.accessSync(homeJs, fs.F_OK);
    const homeController = require(homeJs);
    if (homeController && homeController.index) {
      logger.log("Auto route get: /");
      eveRoute("get", "/", homeController.index);
    }
  } catch (e) {
    logger.warn("Directory [%s] not exists, Skip auto route.", homeJs);
  }

  let controllerPath = path.resolve("./app/controller/");

  let controllerAccess = false;
  try {
    fs.accessSync(controllerPath, fs.F_OK);
    controllerAccess = true;
  } catch (e) {
    logger.warn("Directory [%s] not exists, Skip auto route.", controllerPath);
  }
  if (!controllerAccess) {
    return router;
  }
  let watchDir = fs.readdirSync(controllerPath).filter(function (ele) {
    if (fs.statSync(path.resolve("./app/controller/", ele)).isDirectory()) {
      return true;
    }
  });

  watchDir.forEach((e) => {
    let routers_dir = path.resolve('./app/controller/' + e);
    let rightAccess = false;
    try {
      fs.accessSync(routers_dir, fs.F_OK);
      rightAccess = true;
    } catch (e) {
      logger.warn("Directory [%s] not exists, Skip route.", routers_dir);
    }

    if (rightAccess) {
      fs.readdirSync(routers_dir).forEach(function (file) {
        let moduleName = file.split(".");
        if (moduleName[moduleName.length - 1] === "js") {
          let action = require(routers_dir + '/' + moduleName[0]);
          //遍历进行映射
          for (let method in action) {
            if (action.hasOwnProperty(method)) {
              let func = action[method];

              if (typeof func == "function") {
                let parsedMethod = parseMethodName(method);
                let url;
                if (parsedMethod.url[0] == "/") {
                  url = parsedMethod.url;
                } else {
                  url = "/" + tools.transferToUrl(e) + '/' +
                    tools.transferToUrl(moduleName[0]) + '/' +
                    parsedMethod.url;
                }
                logger.log(`Auto route ${parsedMethod.method}: ${url}`);
                eveRoute(parsedMethod.method, url, func);
              }
            }
          }
        }
      });
    }
  });
  return router
};
