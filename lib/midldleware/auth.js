module.exports = async (ctx, next) => {
    ctx.user = 'aa';
    await next();
};