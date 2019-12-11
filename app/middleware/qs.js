const querystring = require('querystring');

module.exports = () => {
  return async (ctx, next) => {
   ctx.qs = querystring.parse(ctx.request.querystring);
   await next();
  }
};