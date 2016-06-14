'use strict';

var ezmongo = require('../../orm/mongo');
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

BaseService.prototype.save        = function*(json) {
  if (process.env.debug) {
    logger.info("保存数据 collection: " + this.collection);
    logger.info(json);
  }
  yield this.validate(json, this.schema);
  return yield ezmongo.save(this.collection, json);
};
BaseService.prototype.updateOne   = function*(doc, query) {
  if (process.env.debug) {
    logger.info("更新数据 collection: " + this.collection);
    logger.info(doc);
    logger.info(query);
  }
  // yield this.validate(json, this.schema);
  return yield ezmongo.updateOne(this.collection, doc, query);
};
BaseService.prototype.inc         = function*(doc, query) {
  if (process.env.debug) {
    logger.info("自增数据 collection: " + this.collection);
    logger.info(doc);
    logger.info(query);
  }
  // yield this.validate(json, this.schema);
  return yield ezmongo.findOneAndInc(this.collection, doc, query);
};
BaseService.prototype.incWithLock = function*(doc, query) {
  if (process.env.debug) {
    logger.info("自增数据 collection: " + this.collection);
    logger.info(doc);
    logger.info(query);
  }
  // yield this.validate(json, this.schema);
  return yield ezmongo.findOneAndIncWithLock(this.collection, doc, query);
};
BaseService.prototype.validate    = function (json, schema) {
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
  return (yield ezmongo.findOne(this.collection, {_id: id}));
};
BaseService.prototype.find       = function *(query, options) {
  if (process.env.debug) {
    logger.info("查询: %s", this.collection);
    logger.info('query: %s', query);
    logger.info('options: %s', options);
  }
  return (yield ezmongo.find(this.collection, query, options));
};
BaseService.prototype.findOne       = function *(query, options) {
  if (process.env.debug) {
    logger.info("查询: %s", this.collection);
    logger.info('query: %s', query);
    logger.info('options: %s', options);
  }
  return (yield ezmongo.findOne(this.collection, query, options));
};
BaseService.prototype.deleteById = function *(id) {
  if (process.env.debug) {
    logger.info("通过 id 删除: " + this.collection + "  id: " + id);
  }
  return (yield ezmongo.deleteOne(this.collection, {_id: id}));
};
BaseService.prototype.count      = function *(query, options) {
  if (process.env.debug) {
    logger.info("count: " + this.collection);
    logger.info(query);
  }
  return (yield ezmongo.count(this.collection, query, options));
};
BaseService.prototype.list       = function *(query, options) {
  if (process.env.debug) {
    logger.info("list: " + this.collection);
    logger.info(query);
  }
  return (yield ezmongo.list(this.collection, query, options));
};

BaseService.prototype.incWithLock = function*(query, doc) {
  if (process.env.debug) {
    logger.info("自增数据 collection: " + this.collection);
    logger.info(doc);
    logger.info(query);
  }
  // yield this.validate(json, this.schema);
  return yield ezmongo.findOneAndIncWithLock(this.collection, doc, query);
};

module.exports = BaseService;