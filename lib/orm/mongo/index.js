var ObjectID    = require("mongodb").ObjectID;
var MongoClient = require('mongodb').MongoClient;
var logger      = require("tracer").colorConsole();
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
  find   : function *(collectionName, query, options) {
    if (process.env.debug) {
      logger.info("find");
      logger.info("collection:", collectionName);
      logger.info("query:", query);
      logger.info("options:", options);
    }
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
    return yield docs.toArray();
  },
  /**
   * 此方法适合 Web 中的 GET
   * @param collectionName
   * @param query
   * @param options
   * @returns {Function}
   */
  count  : function *(collectionName, query, options) {
    if (process.env.debug) {
      logger.info("count");
      logger.info("collection:", collectionName);
      logger.info("query:", query);
      logger.info("options:", options);
    }

    var collection = ezmongo.db.collection(collectionName);
    return yield collection.count(query, options);
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
  deleteOne            : function *(collectionName, query, options) {
    if (process.env.debug) {
      logger.info("deleteOne");
      logger.info("collection:", collectionName);
      logger.info("query:", query);
      logger.info("options:", options);
    }

    var collection = ezmongo.db.collection(collectionName);
    return yield collection.deleteOne(query, options);
  },
  /**
   *  删除, 此方法适合 Web 中的 GET
   * @param collectionName
   * @param query
   * @param options
   * @returns {Function}
   */
  delete               : function *(collectionName, query, options) {
    if (process.env.debug) {
      logger.info("delete");
      logger.info("collection:", collectionName);
      // logger.info("doc:", doc);
      logger.info("query:", query);
      logger.info("options:", options);
    }

    var collection = ezmongo.db.collection(collectionName);
    return yield  collection.deleteMany(query, options);
  },
  /**
   * 插入文档, 可以支持多个文档一起插入, 此方法适合 Web 中的 POST
   * @param collectionName
   * @param docs
   * @param query
   * @param options
   * @returns {Function}
   */
  insert               : function *(collectionName, docs, query, options) {
    if (process.env.debug) {
      logger.info("insert");
      logger.info("collection:", collectionName);
      logger.info("docs:", docs);
      logger.info("query:", query);
      logger.info("options:", options);
    }

    var collection = ezmongo.db.collection(collectionName);
    if (Array.isArray(docs)) {
      return yield  collection.insertMany(docs, options);
    } else {
      return yield collection.insertOne(docs, options);
    }
  },
  /**
   * Update  documents on MongoDB, 谨慎使用可以批量修改
   * @param collectionName 集合
   * @param doc
   * @param query
   * @param options
   * @returns {Function}
   */
  update               : function *(collectionName, doc, query, options) {
    if (process.env.debug) {
      logger.info("updateOne");
      logger.info("collection:", collectionName);
      logger.info("doc:", doc);
      logger.info("query:", query);
      logger.info("options:", options);
    }

    var collection = ezmongo.db.collection(collectionName);
    return yield collection.update(query, doc, options);
  },
  /**
   * Update a single document on MongoDB, 这个方法适合 Web 中的 POST
   * @param collectionName 集合
   * @param doc
   * @param query
   * @param options
   * @returns {Function}
   */
  updateOne            : function *(collectionName, doc, query, options) {
    if (process.env.debug) {
      logger.info("updateOne");
      logger.info("collection:", collectionName);
      logger.info("doc:", doc);
      logger.info("query:", query);
      logger.info("options:", options);
    }

    var collection = ezmongo.db.collection(collectionName);
    return yield collection.updateOne(query, {$set: doc}, options);
  },
  /**
   * query and increment a single document on MongoDB, it's a atomic operation
   * @param collectionName 集合
   * @param doc
   * @param query
   * @param options
   * @returns {Function}
   */
  findOneAndIncWithLock: function *(collectionName, doc, query, options) {
    if (process.env.debug) {
      logger.info("findOneAndIncWithLock");
      logger.info("collection:", collectionName);
      logger.info("doc:", doc);
      logger.info("query:", query);
      logger.info("options:", options);
    }

    var collection = ezmongo.db.collection(collectionName);
    return yield collection.findOneAndUpdate(query, {$inc: doc}, options);
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
    return yield this.updateOne(collectionName, doc, {_id: new ObjectID(_id)}, options);
  },
  /**
   * 这个方法适合 Web 中的 POST
   * @param collectionName
   * @param doc
   * @param query
   * @param options
   * @returns {*}
   */
  //TODO: 我删除了一个 query 参数，会不会集体报错？
  save                 : function *(collectionName, doc, options) {
    var _id = new ObjectID();
    if (doc._id) {
      _id = new ObjectID(doc._id);
    }
    if (doc.hasOwnProperty("_id")) {
      delete doc._id;
    }
    if (!options) {
      options = {};
    }
    options.upsert = true;

    return yield this.findOneAndUpdate(collectionName, doc, {_id: _id}, options);

  },
  findOneAndUpdate     : function *(collectionName, doc, query, options) {
    if (process.env.debug) {
      logger.info("findOneAndUpdate");
      logger.info("collection:", collectionName);
      logger.info("doc", doc);
      logger.info("query:", query);
      logger.info("options:", options);
    }

    var collection = ezmongo.db.collection(collectionName);
    return yield collection.findOneAndUpdate(query, {$set: doc}, options);
  },
  /**
   * 此方法不适合 Web 直接调用
   * @param collectionName
   * @param key
   * @param match
   * @returns {Function}
   */
  sum                  : function *(collectionName, key, match) {
    if (process.env.debug) {
      logger.info("sum");
      logger.info("collection:", collectionName);
      logger.info("key:", key);
      logger.info("match:", match);
    }
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
    var cursor = collection.aggregate(xV);
    return yield cursor.toArray();
  }, /**
   * query and increment a single document on MongoDB
   * @param collectionName 集合
   * @param doc
   *
   * @param query
   * @param options
   * @returns {Function}
   */
  findOneAndInc        : function *(collectionName, doc, query, options) {
    if (process.env.debug) {
      logger.info("findOneAndInc");
      logger.info("collection:", collectionName);
      logger.info("doc:", doc);
      logger.info("query:", query);
      logger.info("options:", options);
    }

    var collection = ezmongo.db.collection(collectionName);
    return yield collection.updateOne(query, {$inc: doc}, options);
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