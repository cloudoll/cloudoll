module.exports.KoaApplication = require('./lib/koas/KoaApplication');
module.exports.Clouderr = require('./lib/errors/Clouderr');
module.exports.errors = require('./lib/errors/errors');
module.exports.argsFilter = require('./lib/errors/args-filter');
module.exports.KoaMiddle = require('./lib/koas/KoaMiddles');
module.exports.Cloudeer = require('./lib/rpc/Cloudeer');

module.exports.mongo = {
  BaseService: require('./lib/koas/mongo/BaseService'),
  BaseController: require('./lib/koas/mongo/BaseController'),
  ObjectID    : require("mongodb").ObjectID
};
module.exports.logger= require('tracer').colorConsole();
module.exports.orm   = {
  mongo   : require('./lib/orm/mongo'),
  mysql   : require('./lib/orm/mysql'),
  postgres: require('./lib/orm/postgres')
};
