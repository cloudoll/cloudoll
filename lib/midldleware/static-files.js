const url = require('url');
const fs = require('fs');
const path = require('path');
const errors = require('../error/errors');

const map = {
  '.ico'  : 'image/x-icon',
  '.html' : 'text/html',
  '.htm'  : 'text/html',
  '.js'   : 'text/javascript',
  '.json' : 'application/json',
  '.css'  : 'text/css',
  '.png'  : 'image/png',
  '.gif'  : 'image/gif',
  '.jpg'  : 'image/jpeg',
  '.jpeg' : 'image/jpeg',
  '.wav'  : 'audio/wav',
  '.mp3'  : 'audio/mpeg',
  '.svg'  : 'image/svg+xml',
  '.pdf'  : 'application/pdf',
  '.doc'  : 'application/msword',
  '.woff' : "application/font-woff",
  '.woff2': 'application/font-woff2',
  '.eot'  : 'application/vnd.ms-fontobject',
  '.otf'  : 'application/x-font-otf',
  '.snf'  : 'application/x-font-snf',
  '.pcf'  : 'application/x-font-pcf',
  '.ttf'  : 'application/x-font-ttf',
  '.ttc'  : 'application/x-font-ttf',
  '.do'   : 'text/html',


};

module.exports = async(ctx, next) => {
  const parsedUrl = url.parse(ctx.url);
  let pathname = parsedUrl.pathname;  //`.${parsedUrl.pathname}`;
  if (pathname === "/") {
    pathname = "/index.html";
  }
  let virtualPath = ctx.app.config.template.assets.virtualPath;
  let phyPath = ctx.app.config.template.assets.folder;
  let rPath = pathname;
  if (pathname.startsWith(virtualPath)) {
    rPath = pathname.replace(virtualPath, phyPath);
    rPath = path.resolve(rPath);
    try {
      rPath = await transDir(rPath);
      let ext = path.parse(pathname).ext;
      let data = await fsRead(rPath);
      ctx.set('Content-type', map[ext] || 'text/html');
      ctx.body = data;
    } catch (e) { //文件不存在就继续
      await next();
    }
  } else {
    await next();
  }
};

const transDir = (rPath) => {
  return new Promise(function (resolve, reject) {
    fs.stat(rPath, function (err, stat) {
      if (err) {
        reject(errors.CUSTOM(err.message));
      } else {
        if (stat.isDirectory()) {
          rPath = path.join(rPath, "index.html");
        }
        resolve(rPath);
      }
    });
  });
};

const fsRead = (rPath) => {
  return new Promise(function (resolve, reject) {

    fs.stat(rPath, function (err, stat) {
      if (err) {
        reject(errors.CUSTOM(err.message));
      } else {
        if (stat.isDirectory()) {
          rPath = path.join(rPath, "index.html");
        }
        fs.readFile(rPath, (err, data) => {
          if (err) {
            reject(errors.CUSTOM(err.message));
          } else {
            resolve(data);
          }
        });
      }
    });
  });
};