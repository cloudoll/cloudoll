const url = require("url");
const util = require("../share/viewloader-util");

module.exports = options => async (ctx, next) => {
    let parsedUrl = url.parse(ctx.url);
    let pathname = parsedUrl.pathname;

    let globalExclude = false;
    if (options.excludes) {
        for (const exclude of options.excludes) {
            if (pathname.toLowerCase().startsWith(exclude.toLowerCase())) {
                globalExclude = true;
                break;
            }
        }
    }
    if (globalExclude) {
        await next();
        return;
    }

    const policies = options.policies || [];
    let matched = false;
    let cache = false;
    if (options.hasOwnProperty("cache")) {
        cache = options.cache;
    }
    for (const policy of policies) {
        const res = util.transfer(policy, pathname);
        matched = res.matched;
        if (policy.hasOwnProperty("cache")) {
            cache = policy.cache;
        }
        if (matched) {
            let result = await util.getResource(res.parsedUrl, ctx, cache, policy.route);
            let content = result.content.toString();
            result.route = pathname;
            result.remote = res.parsedUrl;
            if (policy.handle) {
                content = policy.handle(
                    ctx,
                    result,
                    policy
                );
            }

            if (result.type.indexOf('text/html') >= 0) {
                ctx.set("Source-Url", res.parsedUrl);
                // content += '<!-- REALURL: ' + res.parsedUrl + ' -->'
            }

            ctx.type = result.type;
            ctx.body = content;
            break;
        }
    }
    if (!matched) { await next(); }

    // await next();
}

