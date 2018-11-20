'use strict';
var ObjectID    = require("mongodb").ObjectID;
var ezmongo = require('../../orm/mongo');
var logger  = require('tracer').colorConsole();

// var ZSchema   = require("z-schema");
// var validator = new ZSchema();

let Validator=require('../JsonValidator');
var errors = require('../../error/errors');

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

BaseService.prototype.insert        = function*(json) {
  if (process.env.debug) {
    logger.info("插入数据 collection: " + this.collection);
    logger.info(json);
  }
  yield Validator.validate(json, this.schema);
  return yield ezmongo.insert(this.collection, json);
};

BaseService.prototype.save        = function*(json) {
  if (process.env.debug) {
    logger.info("保存数据 collection: " + this.collection);
    logger.info(json);
  }
  if(json._id==undefined){
    yield Validator.validate(json, this.schema);
  }
  return yield ezmongo.save(this.collection, json);
};
BaseService.prototype.update   = function*(query,doc,options) {
  if (process.env.debug) {
    logger.info("更新数据 collection: " + this.collection);
    logger.info(doc);
    logger.info(query);
    logger.info(options);
  }
  return yield ezmongo.update(this.collection, doc, query,options);
};
BaseService.prototype.updateOne   = function*(query,doc ) {
  if (process.env.debug) {
    logger.info("更新数据 collection: " + this.collection);
    logger.info(doc);
    logger.info(query);
  }
  // yield this.validate(json, this.schema);
  return yield ezmongo.updateOne(this.collection, doc, query);
};
BaseService.prototype.inc         = function*(query,doc ) {
  if (process.env.debug) {
    logger.info("自增数据 collection: " + this.collection);
    logger.info(doc);
    logger.info(query);
  }
  // yield this.validate(json, this.schema);
  return yield ezmongo.findOneAndInc(this.collection, doc, query);
};
BaseService.prototype.incWithLock = function*(query,doc ) {
  if (process.env.debug) {
    logger.info("自增数据 collection: " + this.collection);
    logger.info(doc);
    logger.info(query);
  }
  // yield this.validate(json, this.schema);
  return yield ezmongo.findOneAndIncWithLock(this.collection, doc, query);
};


BaseService.prototype.findById   = function *(id) {
  if (process.env.debug) {
    logger.info("通过 id 查询: " + this.collection + "  id: " + id);
  }
  return (yield ezmongo.findOne(this.collection, {_id: new ObjectID(id)}));
};
BaseService.prototype.find       = function *(query, options) {
  if (process.env.debug) {
    logger.info("查询: %s", this.collection);
    logger.info('query:', query);
    logger.info('options: ', options);
  }
  return (yield ezmongo.find(this.collection, query, options));
};
BaseService.prototype.findOne       = function *(query, options) {
  if (process.env.debug) {
    logger.info("查询: ", this.collection);
    logger.info('query: ', query);
    logger.info('options: ', options);
  }
  return (yield ezmongo.findOne(this.collection, query, options));
};
BaseService.prototype.deleteById = function *(id) {
  if (process.env.debug) {
    logger.info("通过 id 删除: " + this.collection + "  id: " + id);
  }
  return (yield ezmongo.deleteOne(this.collection, {_id: new ObjectID(id)}));
};
BaseService.prototype.delete = function *(query) {
  if (process.env.debug) {
    logger.info("删除: ");
    logger.info('query:', query);
  }
  return (yield ezmongo.delete(this.collection, query));
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

module.exports = BaseService;