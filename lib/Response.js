const EveError = require("./eve-errors").EveError;

class Response {
    constructor(options) {
        options = options || {};
        options.apiVersion = options.apiVersion || "0.0.1";
        options.lang = options.lang || "zh-CN";
        options.service = global.appName || "unknown";
        this._options = options;
    }

    body(data) {
        let body = {
            lang: this._options.lang,
            service: this._options.service,
            apiVersion: this._options.apiVersion,
            timeStamp: new Date().getTime()
        };
        if (this._options.requestId) {
            //远程调用的时候记录调用ID
            body.requestId = this._options.requestId;
        }
        if (data instanceof Error) {
            body.success = false;
            body.error = {
                code: data.code,
                message: data.message,
                service: data.service
            };
        } else if (data instanceof EveError) {
            body.success = false;
            body.error = data;
        } else {
            body.success = true;
            body.data = data;
        }

        return body;

    }
}

module.exports = Response;