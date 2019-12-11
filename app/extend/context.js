const errors = require("../../lib/eve-errors").errors;
const eveRpc = require("../../lib/eve-rpc");

module.exports = {
  /*
   rpcEve : async function (verb, service, url, params) {
   return await eveRpc.request(verb, service, url, params);
   },
   getEve : async function (service, url, params) {
   return await eveRpc.request("GET", service, url, params);
   },
   postEve: async function (service, url, params) {
   return await eveRpc.request("POST", service, url, params);
   }
   */

  rpcEve(verb, service, url, params) {
    return eveRpc.request(verb, service, url, params, this);
  },
  getEve(service, url, params) {
    return eveRpc.request("GET", service, url, params, this);
  },
  postEve(service, url, params) {
    return eveRpc.request("POST", service, url, params, this);
  }
};
