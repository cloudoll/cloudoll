'use strict';

class EveError extends Error {
    constructor(code, message, service, cluster) {
        service = service || process.env.service_name || "none";
        cluster = cluster || process.env.cluster || "none";
        // super(message + " [" + code + "]" + " @ " + service + "/" + cluster);
        super();
        this.service = service;
        this.code = code;
        this.message = message;
        this.cluster = cluster;
    }

    static fromJson(errJson) {
        if (!errJson.hasOwnProperty('error')) {
            errJson.service = "none";
        }

        console.log('object', errJson);
        return new EveError(
            errJson.error.code,
            errJson.error.message,
            errJson.error.service || errJson.service,
            errJson.error.cluster
        );
    }
}

module.exports = EveError;