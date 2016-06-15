var ObjectID    = require("mongodb").ObjectID;
var MongoClient = require('mongodb').MongoClient;
var errors      = require("../../errors/errors");

var ezmongo = module.exports = {
  db     : null,
  connect: function (dbUrl) {
    MongoClient.connect(dbUrl, function (err, db) {
      if (process.env.debug) {
        console.log("已经连接到 mongodb：", dbUrl);
      }
      ezmongo.db = db;
    });
  },
  /**
   * 此方法适合 Web 中的 GET
   * @param collectionName
   * @param query
   * @param options
   * @returns {Function}
   */
  find   : function (collectionName, query, options) {
    return function (callback) {
      var collection = ezmongo.db.collection(collectionName);
      var docs       = collection.find(query);

      //console.log(collectionName, "------", options);
      if (!options) {
        options = {};
      }
      if (options.hasOwnProperty("project")) {
        docs.project(options['project']);
      }
      if (options.hasOwnProperty("skip")) {
        var skip = parseInt(options.skip);
        docs.skip(skip);
      }
      var limit = 200;
      if (options.hasOwnProperty("limit")) {
        limit = parseInt(options.limit) || 20;
      }
      limit = limit > 2000 ? 2000 : limit;
      docs.limit(limit);
      if (options.hasOwnProperty("comment")) {
        docs.comment(options['comment']);
      }
      if (options.hasOwnProperty("sort")) {
        docs.sort(options['sort']);
      }
      if (options.hasOwnProperty("max")) {
        docs.max(options['max']);
      }
      if (options.hasOwnProperty("min")) {
        docs.min(options['min']);
      }
      docs.toArray(callback);
    }
  },
  /**
   * 此方法适合 Web 中的 GET
   * @param collectionName
   * @param query
   * @param options
   * @returns {Function}
   */
  count  : function (collectionName, query, options) {
    return function (callback) {

      var collection = ezmongo.db.collection(collectionName);
      collection.count(query, options, callback);
    }
  },
  list   : function *(collectionName, query, options) {
    var res   = yield ezmongo.find(collectionName, query, options);
    var total = yield ezmongo.count(collectionName, query, null);
    return {total: total, list: res};
  },

  /**
   * 此方法适合 Web 中的 GET
   * @param collectionName
   * @param query
   * @param options
   * @returns {*}
   */
  findOne              : function *(collectionName, query, options) {
    if (!options) {
      options = {};
    }
    options.limit = 1;
    var res       = yield this.find(collectionName, query, options);
    if (res.length > 0)
      return res[0];
    return null;
  },
  /**
   *
   * @param collectionName
   * @param query
   * @returns {boolean}
   */
  exists               : function *(collectionName, query) {
    var res = yield this.count(collectionName, query);
    return res > 0;
  },
  /**
   * 删除一个文档, 此方法适合 Web 中的 GET
   * @param collectionName
   * @param query
   * @param options
   * @returns {Function}
   */
  deleteOne            : function (collectionName, query, options) {
    return function (callback) {
      var collection = ezmongo.db.collection(collectionName);
      collection.deleteOne(query, options, callback);
    }
  },
  /**
   *  删除, 此方法适合 Web 中的 GET
   * @param collectionName
   * @param query
   * @param options
   * @returns {Function}
   */
  delete               : function (collectionName, query, options) {
    return function (callback) {
      var collection = ezmongo.db.collection(collectionName);
      collection.deleteMany(query, options, callback);
    }
  },
  /**
   * 插入文档, 可以支持多个文档一起插入, 此方法适合 Web 中的 POST
   * @param collectionName
   * @param docs
   * @param query
   * @param options
   * @returns {Function}
   */
  insert               : function (collectionName, docs, query, options) {
    return function (callback) {
      var collection = ezmongo.db.collection(collectionName);
      if (Array.isArray(docs)) {
        collection.insertMany(docs, options, callback);
      } else {
        collection.insertOne(docs, options, callback);
      }
    }
  },
  /**
   * Update a single document on MongoDB, 这个方法适合 Web 中的 POST
   * @param collectionName 集合
   * @param doc
   * @param query
   * @param options
   * @returns {Function}
   */
  updateOne            : function (collectionName, doc, query, options) {
    return function (callback) {

      var collection = ezmongo.db.collection(collectionName);
      collection.updateOne(query, {$set: doc}, options, callback);
    }
  },
  /**
   * query and increment a single document on MongoDB, it's a atomic operation
   * @param collectionName 集合
   * @param doc
   * @param query
   * @param options
   * @returns {Function}
   */
  findOneAndIncWithLock: function (collectionName, doc, query, options) {
    return function (callback) {

      var collection = ezmongo.db.collection(collectionName);
      collection.findOneAndUpdate(query, {$inc: doc}, options, callback);
    }
  },
  /**
   * 这个方法适合 Web 中的 POST
   * @param collectionName
   * @param doc
   * @param _id
   * @param options
   * @returns {*}
   */
  updateById           : function *(collectionName, doc, _id, options) {
    return yield this.updateOne(collectionName, {_id: new ObjectID(_id)}, doc, options);
  },
  /**
   * 这个方法适合 Web 中的 POST
   * @param collectionName
   * @param doc
   * @param query
   * @param options
   * @returns {*}
   */
  save                 : function *(collectionName, doc, query, options) {
    if (doc.hasOwnProperty("_id") && doc._id != null && doc._id != "") {
      var _id = doc._id;
      delete doc._id;
      return yield this.findOneAndUpdate(collectionName, {_id: new ObjectID(_id)}, doc, options);
    } else {
      doc._id = new ObjectID();
      //console.log(doc);
      return yield this.insert(collectionName, doc, options);
    }
  },
  /**
   * 此方法不适合 Web 直接调用
   * @param collectionName
   * @param key
   * @param match
   * @returns {Function}
   */
  sum                  : function (collectionName, key, match) {
    return function (callback) {
      var collection = ezmongo.db.collection(collectionName);
      var xV         = [];
      if (match) {
        xV.push({
          $match: match
        });
      }
      xV.push({
        $group: {
          _id: null,
          sum: {$sum: "$" + key}
        }
      });
      collection.aggregate(xV).toArray(callback);
    }
  }, /**
   * query and increment a single document on MongoDB
   * @param collectionName 集合
   * @param doc
   * @param query
   * @param options
   * @returns {Function}
   */
  findOneAndInc        : function (collectionName, doc, query, options) {
    return function (callback) {

      var collection = ezmongo.db.collection(collectionName);
      collection.updateOne(query, {$inc: doc}, options, callback);
    }
  },

  /**
   * 这是一个 koa 插件， 使用此插件后, 可以直接在浏览器中通过组装 URL 实现 MongoDB 文档的曾删改查操作。
   * url 的组装方式是 {collection, query, options} 变成字符串, 然后使用 base64 编码. 比如: 编码后的文件是 base64String
   * 入口文件是: /crud?base64String
   * @param next
   * ```
   *
   * ```
   */
  koaMiddleware: function *(next) {
    var rUrl          = this.url;
    var pathJson      = require("url").parse(rUrl);
    var pathname      = pathJson.pathname.toLowerCase();
    var pathnameArray = pathname.split('/');

    if (pathnameArray[1] !== 'crud') {
      yield next;
    } else {
      var query  = new Buffer(pathJson.query, 'base64').toString('utf-8');
      var jQuery = JSON.parse(query);

      if (!jQuery.hasOwnProperty('collection')) {
        throw errors.WHAT_REQUIRE('collection');
      }

      if (!jQuery.hasOwnProperty('method')) {
        throw errors.WHAT_REQUIRE('method');
      }

      for (var k in jQuery.query) {
        var v = jQuery.query[k];
        if (v.hasOwnProperty('$regex')) {
          v.$regex = new RegExp(v.$regex);
        }
      }

      switch (this.method) {
        case 'POST':
          var docs  = this.request.body;
          this.body = yield ezmongo[jQuery.method](jQuery.collection, docs, jQuery.query, jQuery.options);
          break;
        default:
          var data = yield ezmongo[jQuery.method](jQuery.collection, jQuery.query, jQuery.options);
          var res  = {errno: 0, data: data};
          if (jQuery.method === 'find') {
            res.total = yield ezmongo.count(jQuery.collection, jQuery.query);
            res.count = data.length;
            res.skip  = jQuery.options.skip;
            res.limit = jQuery.options.limit;
          }
          this.body = res;
          break;
      }
    }
  }
};