const EveError = require("../error/EveError");

class Response {
    constructor(options) {

        options = options || {};

        // options._input_charset = options._input_charset || "utf-8";
        options.apiVersion = options.apiVersion || "0.0.1";
        options.lang = options.lang || "zh-CN";
        options.service = global.appName || "unknown";
        // options.standardVersion = options.standardVersion || "0.0.1";
        this._options = options;

    }

    body(data) {
        let body = {
            // _input_charset: this._options._input_charset,
            lang: this._options.lang,
            service: this._options.service,
            apiVersion: this._options.apiVersion,
            // standardVersion: this._options.standardVersion,
            // csrfId: csrfId,
            // action: action,
            timeStamp: new Date().getTime()
        };

        // if (csrfId) {
        //     body.csrfId = csrfId;
        // }
        // if (action) {
        //     body.action = action;
        // }

        if (data instanceof Error) {
            body.success = false;
            body.error = {
                code: data.code,
                message: data.message,
                service:data.service
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