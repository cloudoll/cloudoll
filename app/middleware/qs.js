const querystring = require('querystring');

module.exports = () => {
  //return async (ctx, next) => {
  //  ctx.qs = querystring.parse(ctx.request.querystring);
  //  await next();
  //}

  return function *(next) {
    this.qs = querystring.parse(this.request.querystring);
    yield next;
  }
};