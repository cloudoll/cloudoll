"use strict";
const logger = require("../share/logger");
const errors = require("../error/errors");
const EveError = require("../error/EveError");


module.exports = {

  /**
   * 这个error handle 要放在 router 之前.
   * @param ctx
   * @param next
   * @returns {Promise.<void>}
   */
  async ahead(ctx, next) {
    try {
      if (global.debug) {
        logger.info(ctx.method + ": " + ctx.url);
      }
      await next();
    } catch (err) {
      //this.app.emit('error', err, this);
      if (err instanceof EveError) {
        logger.error(err.message);
        ctx.echo(err);
      } else if (err.errno) {
        logger.error(err.stack);
        switch (err.errno) {
          case "EACCES":
            ctx.echo(errors.CUSTOM("没有访问权限。"));
            break;
          case "EADDRINUSE":
            ctx.echo(errors.CUSTOM("地址被占用。"));
            break;
          case "ECONNREFUSED":
            ctx.echo(errors.CUSTOM("连接被拒。"));
            break;
          case "EEXIST":
            ctx.echo(errors.CUSTOM("文件已存在。"));
            break;
          case "EISDIR":
            ctx.echo(errors.CUSTOM("需要的是文件不是目录。"));
            break;
          case "EMFILE":
            ctx.echo(errors.CUSTOM("打开文件的数量太多。"));
            break;
          case "ENOENT":
            ctx.echo(errors.CUSTOM("没有这个文件或者目录。"));
            break;
          case "ENOTDIR":
            ctx.echo(errors.CUSTOM("不是一个目录。"));
            break;
          case "ENOTEMPTY":
            ctx.echo(errors.CUSTOM("目录非空。"));
            break;
          case "EPERM":
            ctx.echo(errors.CUSTOM("该操作被禁止。"));
            break;
          case "EPIPE":
            ctx.echo(errors.CUSTOM("写管道损坏。"));
            break;
          case "ETIMEDOUT":
            ctx.echo(errors.CUSTOM("操作超时。"));
            break;
          default:
            ctx.echo(err);
        }
      } else {
        logger.error(err.stack);
        //logger.error(err.stack);
        // this.app.emit('error', err, this);
        ctx.echo(errors.SYSTEM_ERROR);
      }
    }
  },
  behind(ctx) {
    logger.error("出错了，当前请求状态：" + ctx.status, ctx.url);
    switch (ctx.status) {
      case 400:
        throw errors.BAD_REQUEST;
        break;
      case 404:
        throw errors.NOT_FOUND;
        return;
        break;
      case 500:
        throw errors.INTERNAL_SERVER_ERROR;
        break;
      default :
        throw errors.CUSTOM(`http error with status ${ctx.status}!`);
    }

  }
};
