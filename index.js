module.exports.KoaApplication = require('./lib/koas/KoaApplication');
module.exports.Clouderr       = require('./lib/errors/Clouderr');
module.exports.errors         = require('./lib/errors/errors');
module.exports.argsFilter     = require('./lib/errors/args-filter');
module.exports.KoaMiddle      = require('./lib/koas/KoaMiddles');
module.exports.Cloudeer       = require('./lib/rpc/Cloudeer');
module.exports.tools          = require('./lib/tools');

module.exports.mongo = {
  BaseService   : require('./lib/koas/mongo/BaseService'),
  BaseController: require('./lib/koas/mongo/BaseController'),
  ObjectID      : require("mongodb").ObjectID
};

module.exports.logger = require('tracer').colorConsole();

module.exports.orm = {
  mongo   : require('./lib/orm/mongo'),
  mysql   : require('./lib/orm/mysql'),
  postgres: require('./lib/orm/postgres'),
  redis   : require('./lib/orm/redis'),
  ObjectID: require("mongodb").ObjectID
};

module.exports.libs = {
  co     : require('co'),
  koa    : require('koa'),
  mongodb: require('mongodb'),
  mysql  : require('mysql'),
  pg     : require('pg'),
  redis  : require('redis'),
  tracer : require('tracer')
};