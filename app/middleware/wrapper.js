const Response = require("../../lib/Response");
const url = require("url");
const errors = require("../../lib/eve-errors").errors;
module.exports = (options) => {
    return async (ctx, next) => {
        /*
        可以配置需要匹配的路径 paths，如果不指定，那么就匹配所有的路径。
        */
        let matched;
        let paths = options.paths || ['/']; //如果不指定路径，则全部 wrapper
        let parsedUrl = url.parse(ctx.url);
        let pathname = parsedUrl.pathname;
        for (let i = 0; i < paths.length; i++) {
            if (pathname.startsWith(paths[i])) {
                matched = true;
                break;
            }
        }

        if (!matched) {
            //这几个远程调用的 url 也需要 wrap
            matched = pathname === "/rpc/eve" || pathname === "/rpc/get-eve" || pathname === "/rpc/post-eve";
        }
        if (matched) {
            const response = new Response({ traceId: "12314" });
            try {
                await next();
            } catch (ex) {
                ctx.logger.error(ex);
                ctx.body = response.body(ex);
                return;
            }

            if (ctx.status === 200) {
                //判定是否是提供下载的，如果提供下载，那么不封装。
                const downloadable = ctx.response.get("content-disposition");
                if (!downloadable && ctx.response.is('text', 'json')) {
                    ctx.body = response.body(ctx.body);
                }
            } else if (ctx.status === 204) {
                //204 是 Not Content
                ctx.status = 200;
                ctx.body = response.body(null);
            } else if (ctx.status === 404) {
                ctx.body = response.body(errors.NOT_FOUND);
                ctx.status = 200;
            }
        } else {
            await next();
        }
    }
}