module.exports = app => {
    app.config.coreMiddleware.push('wrapper');
    // console.log(app.config.coreMiddleware);
};