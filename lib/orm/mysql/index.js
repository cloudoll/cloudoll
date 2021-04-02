const errors = require('../../eve-errors').errors;

const ezmysql = module.exports = {
  pool: null,
  debug: false,
  mysql: null,
  connect: function (connStrJson) {
    if (!this.mysql) {
      throw new Error("请安装 'mysql' 依赖：`npm i mysql -S`, 并指定 mysql.mysql=require('mysql')");
    }
    if (this.debug) {
      console.log('Connecting to MySQL...', connStrJson);
    }
    this.pool = this.mysql.createPool(connStrJson);
  },
  query: function (sql, params) {
    if (!this.pool) {
      throw errors.CUSTOM('pool 参数尚未初始化，请执行启动应用的时候执行 connect 方法');
    }
    if (this.debug) {
      console.log("------------", new Date(), "----------------------------");
      console.log("sql: ", sql);
      console.log("params: ", params);
      console.log("----------------------------------------");
    }
    return new Promise((resolve, reject) => {
      ezmysql.pool.query(sql, params, function (err, rows, fields) {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });

    });
  },
  //conditions 可以支持如下： skip, limit, orderBy, where, params, cols
  list: async (table, conditions) => {
    conditions = conditions || {};
    if (!conditions.cols) {
      conditions.cols = '*';
    }
    if (!conditions.skip) {
      conditions.skip = 0;
    }
    if (!conditions.limit) {
      conditions.limit = 5;
    }
    if (!conditions.where) {
      conditions.where = "1=1"
    }
    if (conditions.orderBy) {
      conditions.orderBy = 'order by ' + conditions.orderBy;
    } else {
      conditions.orderBy = '';
    }
    table = "`" + table + "`";
    var sql = `select ${conditions.cols} from ${table} where ${conditions.where} ${conditions.orderBy} limit ${conditions.limit} offset ${conditions.skip}`;
    return await ezmysql.query(sql, conditions.params);
    //var cql  = `select count(*) as ct from ${table} where ${conditions.where} `;
    //var rows = yield ezmysql.query(sql, conditions.params);
    //var cts  = yield ezmysql.query(cql, conditions.params);
    //return {total: cts[0].ct, data: rows};
  },
  insert: async (table, model) => {
    table = "`" + table + "`";
    var sql = `insert into ${table} set ?`;
    var result = await ezmysql.query(sql, model);
    if (result.affectedRows >= 1) {
      return { id: result.insertId };
    }
    throw errors.CUSTOM("插入失败。");
  },
  update: async (table, model) => {
    if (!model.hasOwnProperty('id')) {
      throw errors.WHAT_REQUIRE('id');
    }
    var id = model.id;
    table = "`" + table + "`";
    var sql = `update ${table} set ? where ?`;
    delete model.id;
    var result = await ezmysql.query(sql, [model, { id: id }]);
    if (result.changedRows) {
      return true;
    }
    throw errors.CUSTOM("没有数据被更新。");
  },
  save: async (table, model) => {
    if (model.hasOwnProperty('id') && ~~model.id > 0) {
      return await ezmysql.update(table, model);
    } else {
      return await ezmysql.insert(table, model);
    }
  },
  updateBatch: async (table, model, conditions) => {
    if (model.hasOwnProperty('id')) {
      throw errors.CUSTOM('id 不能被修改。');
    }
    if (!conditions || !conditions.where) {
      throw errors.CUSTOM('批量修改必须有 {where: xxx, params:xxx}。');
    }
    table = "`" + table + "`";
    var sql = `update ${table} set ? where ${conditions.where}`;
    var result = await ezmysql.query(sql, [model].concat(conditions.params));
    if (result.changedRows) {
      return true;
    }
    throw errors.CUSTOM("更新失败，没有符合条件的数据。");
  },
  load: async (table, conditions) => {
    conditions = conditions || {};
    conditions.where = conditions.where || "1=1";
    conditions.limit = 1;
    conditions.cols = conditions.cols || '*';
    table = "`" + table + "`";
    var sql = `select ${conditions.cols} from ${table} where ${conditions.where} limit ${conditions.limit}`;
    var rows = await ezmysql.query(sql, conditions.params);
    if (rows.length > 0) {
      return rows[0];
    }
    return null;
  },
  loadByKV: async (table, key, value) => {
    return await ezmysql.load(table, {
      where: key + " = ?",
      params: [value]
    });
  },
  loadById: async (table, id) => {
    return await ezmysql.loadByKV(table, "id", id);
  },
  delete: async (table, conditions) => {
    conditions = conditions || {};
    conditions.where = conditions.where || "1=2";
    table = "`" + table + "`";
    var sql = `delete from ${table} where ${conditions.where}`;
    var result = await ezmysql.query(sql, conditions.params);
    return (result.affectedRows > 0);
  },
  count: async (table, conditions) => {
    conditions = conditions || {};
    conditions.where = conditions.where || "1=1";
    table = "`" + table + "`";
    var sql = `select count(*) as ct from ${table} where ${conditions.where} `;
    var rows = await ezmysql.query(sql, conditions.params);
    if (rows.length > 0) {
      return rows[0].ct;
    }
    return 0;
  },
  exists: async (table, conditions) => {
    conditions = conditions || {};
    conditions.where = conditions.where || "1=1";
    table = "`" + table + "`";
    var sql = `select count(*) as ct from ${table} where ${conditions.where} `;
    var rows = await ezmysql.query(sql, conditions.params);
    let rtn = 0;
    if (rows.length > 0) {
      rtn = rows[0].ct;
    }
    return rtn > 0;
  },
  sum: async (table, conditions) => {
    conditions = conditions || {};
    conditions.where = conditions.where || "1=1";
    table = "`" + table + "`";
    var sql = `select sum(${conditions.col}) as ct from ${table} where ${conditions.where} `;
    var rows = await ezmysql.query(sql, conditions.params);
    if (rows.length > 0) {
      return rows[0].ct;
    }
    return 0;
  },
  /**
   * 这是一个 koa 插件， 使用此插件后, 可以直接在浏览器中通过组装 URL 实现 MySQL 文档的曾删改查操作。
   * url 的组装方式是 {method: 'list', table: xx, conditions: ...} 变成字符串, 然后使用 base64 编码. 比如: 编码后的文件是 base64String
   * 入口文件是: /crud?base64String
   * @param next
   * ```
   *
   * ```
   */
  koaMiddleware: async (ctx, next) => {
    var rUrl = ctx.url;
    var pathJson = require("url").parse(rUrl);
    var pathname = pathJson.pathname.toLowerCase();
    var pathnameArray = pathname.split('/');
    if (pathnameArray[1] !== 'crud') {
      await next();
    } else {
      var query = new Buffer(pathJson.query, 'base64').toString('utf-8');
      var jQuery = JSON.parse(query);
      if (!jQuery.hasOwnProperty('table')) {
        throw errors.WHAT_REQUIRE('table');
      }
      if (!jQuery.hasOwnProperty('method')) {
        throw errors.WHAT_REQUIRE('method');
      }
      if (!jQuery.conditions) {
        jQuery.conditions = {};
      }
      switch (ctx.method) {
        case 'POST':
          var model = ctx.request.body;
          ctx.body = await ezmysql[jQuery.method](jQuery.table, model, jQuery.conditions);
          break;
        default:
          var data = await ezmysql[jQuery.method](jQuery.table, jQuery.conditions);
          var res = { errno: 0, data: data };
          if (jQuery.method === 'list') {
            res.total = await ezmysql.count(jQuery.table, jQuery.conditions);
            res.count = data.length;
            res.skip = jQuery.conditions.skip || 0;
            res.limit = jQuery.conditions.limit || 5;
          }
          ctx.body = res;
          break;
      }
    }
  }
};
