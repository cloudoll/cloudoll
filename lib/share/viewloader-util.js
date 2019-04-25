const fs = require("fs");
const path = require("path");
const mime = require("./mime");
const request = require("request");

const util = {
  ASSETS_CASHES: {},
  CACHE_VERSION: {},
  transfer(policy, pathname) {
    let matched = false, parsedUrl;
    const route = policy.route;
    if (route && policy.remote) {
      if (typeof route === "string") {
        if (pathname.toLowerCase() === route.toLowerCase()) {
          matched = true;
          parsedUrl = policy.remote;
        }
      } else {
        let matchedUrl = pathname.match(route);
        if (matchedUrl) {
          matched = true;
          parsedUrl = pathname.replace(route, policy.remote);
        }
      }
    }
    if (parsedUrl && parsedUrl.indexOf("$REFRESH_KEY")) {
      parsedUrl = parsedUrl.replace(/\$REFRESH_KEY/ig, util.CACHE_VERSION[route]);
    }
    return { matched, parsedUrl, route };
  },
  async getResource(url, ctx, cache, route) {
    if (cache) {
      const myRouteCache = util.ASSETS_CASHES[route];
      if (myRouteCache && myRouteCache.hasOwnProperty(url)) {
        // console.log("From cache...")
        return util.ASSETS_CASHES[route][url];
      }
    }
    if (/^(\/)|^(\w:)/.test(url)) {
      return util.getLocalFile(url, ctx, cache, route);
    } else {
      return await util.getRemote(url, ctx, cache, route);
    }
  },
  getLocalFile(url, ctx, cache, route) {
    url = decodeURIComponent(url);
    const content = fs.readFileSync(url);
    const parsedUrl = path.parse(url);
    let contentType = "text/plain";
    if (parsedUrl.ext) {
      contentType = mime[parsedUrl.ext.substr(1)]
    }
    const lastResult = {
      type: contentType,
      content: content
    };
    //TODO: 缓存策略，如果文件太大，会不会挂？
    if (cache) {
      util.ASSETS_CASHES = util.ASSETS_CASHES || {};
      util.ASSETS_CASHES[route] = util.ASSETS_CASHES[route] || {};
      util.ASSETS_CASHES[route][url] = lastResult;
    }
    return lastResult;
  },
  async getRemote(url, ctx, cache, route) {
    const result = await ctx.curl({
      url: url,
      encoding: null,
      timeout: 10000,
    });
    // console.log(2222222, Object.keys(result), result.statusCode);
    if (result.statusCode === 200) {
      const lastResult = {
        content: result.body,
        type: result.headers["content-type"]
      }
      console.log(lastResult);
      if (cache) {
        util.ASSETS_CASHES = util.ASSETS_CASHES || {};
        util.ASSETS_CASHES[route] = util.ASSETS_CASHES[route] || {};
        util.ASSETS_CASHES[route][url] = lastResult;
      }
      return lastResult;
    } else if (result.status === 404) {
      ctx.logger.error(`viewloader 404: ${url} 远程地址不存在。`);
      throw new Error("远程地址不存在。");
    }
    return null;
  }
}


module.exports = util;