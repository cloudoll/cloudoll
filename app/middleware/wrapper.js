const Response = require("../../lib/Response");
module.exports = () => {
    return async (ctx, next) => {
        await next();
        const response = new Response(ctx.options);
        let res = response.body(ctx.body);
        let jpCallback = ctx.request.query.callback;
        if (jpCallback && ctx.method === "GET") {
            ctx.type = "text/javascript";
            ctx.body = `${jpCallback}(${JSON.stringify(res)})`;
        } else {
            ctx.body = res;
        }
    }
}