'use strict';

var ezmongo = require('ezway2mongo');
var logger  = require('tracer').colorConsole();

var ZSchema   = require("z-schema");
var validator = new ZSchema();

var errors = require('../../errors/errors');

function BaseService(table) {
  this.collection = table;
  var pathSchema  = require('path').resolve('./schema') + '/collection/' + table + '.json';

  if (process.env.debug) {
    logger.info("加载schema: " + pathSchema);
  }
  try {
    this.schema = require(pathSchema);
  } catch (e) {
    throw errors.CUSTOM(pathSchema + " 加载失败，请检查文件是否存在。");
  }
}

BaseService.prototype.save = function*(json) {
  if (process.env.debug) {
    logger.info("保存数据 collection: " + this.collection);
    logger.info(json);
  }
  yield this.validate(json, this.schema);
  return errors.success(yield ezmongo.save(this.collection, json));
};

BaseService.prototype.validate = function (json, schema) {
  return function (callback) {
    validator.validate(json, schema, function (errs) {
      if (errs) {
        callback(new Error(JSON.stringify(errs)));
      }
      callback(null, true);
    });
  };
};

BaseService.prototype.findById   = function *(id) {
  if (process.env.debug) {
    logger.info("通过 id 查询: " + this.collection + "  id: " + id);
  }
  return errors.success(yield ezmongo.findOne(this.collection, {_id: id}));
};
BaseService.prototype.find       = function *(query, options) {
  if (process.env.debug) {
    logger.info("查询: " + this.collection + [query, options]);
  }
  return errors.success(yield ezmongo.find(this.collection, query, options));
};
BaseService.prototype.deleteById = function *(id) {
  if (process.env.debug) {
    logger.info("通过 id 删除: " + this.collection + "  id: " + id);
  }
  return errors.success(yield ezmongo.deleteOne(this.collection, {_id: id}));
};
BaseService.prototype.count      = function *(query) {
  if (process.env.debug) {
    logger.info("count: " + this.collection);
    logger.info(query);
  }
  return errors.success(yield ezmongo.count(this.collection, query));
};

module.exports = BaseService;

//
// var co = require('co');
// co(function *() {
//   var b = new BaseService('dddd');
//   yield b.save({x: 1});
// }).then(function (value) {
//   console.log(value);
// }, function (err) {
//   console.error(err.stack);
// });