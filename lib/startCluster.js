const egg = require('egg');

module.exports = function (options, callback) {
  options = options || {};
  options.port = options.port || global.eggPort || 7001;
  egg.startCluster(options, callback);
};
