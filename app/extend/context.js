// const errors = require("../../lib/eve-errors").errors;
const eveRpc = require("../../lib/eve-rpc");

module.exports = {
  rpcEve(verb, service, url, params) {
    return eveRpc.request(verb, service, url, params, this);
  },
  getEve(service, url, params) {
    return eveRpc.request("GET", service, url, params, this);
  },
  postEve(service, url, params) {
    return eveRpc.request("POST", service, url, params, this);
  },
  xurl(service, url, options) {
    return eveRpc.xurl(service, url, options, this);
  }
};
