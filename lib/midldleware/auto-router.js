const fs = require("fs");
const path = require("path");
const Router = require('koa-router');
const logger = require("../share/logger");
const tools = require('../share/tools');
const jsFileLoader = require('../share/js-loader.js');
// const errors = require('../error/errors');
// const co = require('../share/co');


let router = new Router();

/**
 * 自动路由系统
 */
module.exports = function () {

  const parseMethodName = method => {
    const rtn = {};
    const regx = /(get|post|put|delete|patch) (.+)|(__|_|\$\$|\$)(.*)/ig;
    const regxRes = regx.test(method);
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
      router[httpMethod](pathName, async (ctx, next) => {
        let result = await method(ctx, next);
        tools.wrapContext(ctx, result, dftPage);
      });
    } else if (funType === "GeneratorFunction") {
      router[httpMethod](pathName, async (ctx, next) => {
        let proFunc = co(function* () {
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


  /**
   * route one file.
   * @param {*} file absolute file path
   * @param {*} vPath route of web
   */
  const routeOneFile = (file, vPath) => {
    if (file.endsWith('.js')) {
      const action = require(file);
      //遍历进行映射
      for (const method in action) {
        if (action.hasOwnProperty(method)) {
          const func = action[method];

          if (typeof func == "function") {
            const parsedMethod = parseMethodName(method);
            let url;
            if (parsedMethod.url[0] == "/") {
              url = parsedMethod.url;
            } else {
              url = //"/" + tools.transferToUrl(relDir) + 
                tools.transferToUrl(vPath) + '/' +
                parsedMethod.url;
            }
            logger.log(`Auto route ${parsedMethod.method}: ${url}`);
            removeRouter(url, parsedMethod.method); // remove mapper
            eveRoute(parsedMethod.method, url, func);
          }
        }
      }
    }

  }

  const routeControllers = (filesObj) => {
    filesObj.forEach((fileObj) => {
      routeOneFile(fileObj.file, fileObj.vPath);
    });
  }



  const removeRouter = (mappedUrl, method) => { //delete existed router for reload.
    //TODO:  layer.methods.indexOf(method.toUpperCase())  this maybe not work when multi mapping.
    if (!global.debug) {
      return;
    }
    for (let index = router.stack.length - 1; index >= 0; index--) {
      const layer = router.stack[index]
      if (layer.path == mappedUrl && layer.methods.indexOf(method.toUpperCase()) >= 0) {
        // console.log("mactched: ", method, mappedUrl, index);
        router.stack.splice(index, 1);
        return;
      }
    }
  }

  // const removeRoutersInFile = (file) => {

  // }

  const autoReloadWhenDev = (dir, rootDir) => {
    if (!global.debug) {
      return;
    }
    fs.watch(dir, { recursive: true }, (eType, file) => {
      if (eType === "change") {
        if (file.endsWith('.js')) {
          const abPath = path.join(rootDir, file);
          // console.log(abPath);
          logger.warn(`The file [${abPath}] has been changed, reloading...`);
          // console.log(require.cache[abPath]);
          delete require.cache[abPath];
          routeOneFile(abPath, "/" + file.slice(0, -3));
          // console.log(path.join(rootDir, file), '111111111111');
          // const reqFile = dir + '/' + file;
          // delete require.cache[reqFile];
          // routeOneFile(file, dir, relDir);
        }
      }
    });
  }



  //Add Home Index '/'
  // let homeJs = path.resolve('./app/controller/home.js');
  // try {
  //   fs.accessSync(homeJs, fs.F_OK);
  //   const homeController = require(homeJs);
  //   if (homeController && homeController.index) {
  //     logger.log("Auto route get: /");
  //     eveRoute("get", "/", homeController.index);
  //   }
  // } catch (e) {
  //   logger.warn("Directory [%s] not exists, Skip auto route.", homeJs);
  // }

  const controllerPath = path.resolve("./app/controller/");
  jsFileLoader(controllerPath, controllerPath, (err, files) => {
    if (err) {
      logger.error(err);
      return;
    }
    routeControllers(files);
  });
  autoReloadWhenDev(controllerPath, controllerPath);


  return router
};
