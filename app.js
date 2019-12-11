module.exports = app => {
    app.config.coreMiddleware.push('wrapper');
    app.config.coreMiddleware.push('qs');
};