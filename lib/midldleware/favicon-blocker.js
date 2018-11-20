module.exports = async (ctx, next) => {
    if (ctx.url.match(/favicon\.ico$/)) {
        ctx.body = "";
        return null;
    }
    await next();
};