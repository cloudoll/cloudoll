const url = require("url");
const nunjucks = require('nunjucks');
const path = require('path');
const fs = require('fs');
const logger = require("../share/logger");

module.exports = async(ctx, next) => {
  let pathname = url.parse(ctx.url).pathname;
  console.log(pathname);
  
  if (!pathname.endsWith(".html")) {
    pathname = path.join(pathname, 'index.html');
  }
  try {
    if (pathname.endsWith(".html")) {
      ctx.body = nunjucks.render(pathname.substr(1));
    }else{
      fs.readFile(path.resolve(pathname), 'r', function (data) {
        ctx.body = data.toString();
      })
    }
  } catch (e) {
    logger.warn(e);
    await next();
  }
};