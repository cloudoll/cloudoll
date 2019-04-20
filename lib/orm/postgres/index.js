// var pg = require('pg');
const { Pool } = require('pg');

const errors = require('../../errors/errors');


const db = {
  pool: null,
  connect: (config) => {
    if (!config) {
      throw errors.CUSTOM("You must prefer pg pool config. See https://node-postgres.com/api/pool");
    }
    db.pool = new Pool(config);
  },

  /**
   * 列出数据
   * @param table 表名
   * @param condition 这个参数是一个 json， 支持以下参数：
   * page 页码
   * size 每页条数
   * where 的构造 "x > $xxx"
   * params 的构造 {xxx: 10}，一般 params 需要和 where 一起出现，不然会报错
   * cols 要输出的列 ['col1', 'col2']
   * orderBy 排序 如  id desc
   * @returns {{count: (number), record_count: (number), data: *}}
   */
  list: async (table, condition) => {
    condition = condition || {};
    //var table = condition.table;
    var page = condition.page || 1;
    var size = condition.size || 20;
    var skip = condition.skip || 0;
    var limit = condition.limit || 20;
    var where = condition.where;
    var params = condition.params;
    var cols = condition.cols || "*";
    var orderBy = condition.orderBy;

    if (params) {
      var pSql = db.prepareSQL(where, params);
      where = pSql.sql;
      params = pSql.arrayParams;
    }

    table = '"' + table + '"';
    //table, size, page, orderby, where
    var sql = "select " + cols + " from " + table;
    var sqlCount = "select count(*)::int as ct from " + table;

    var lastLimit = limit || page;
    var lastSkip = skip || (page - 1) * size;

    if (where) {
      sql += " where " + where;
      sqlCount += " where " + where;
    }
    if (orderBy) {
      sql += " order by " + orderBy;
    }
    sql += " limit " + lastLimit + " offset " + lastSkip;

    var result = await db.query(sql, params);
    var countRows = await db.query(sqlCount, params);
    return { count: result.rowCount, total: countRows.rows[0].ct, list: result.rows };
  },

  take: async (table, condition) => {
    condition = condition || {};
    //var table = condition.table;
    var page = condition.page || 1;
    var size = condition.size || 500;
    var where = condition.where;
    var params = condition.params;
    var cols = condition.cols || "*";
    var orderBy = condition.orderBy;

    if (params) {
      var pSql = db.prepareSQL(where, params);
      where = pSql.sql;
      params = pSql.arrayParams;
    }
    table = '"' + table + '"';

    //table, size, page, orderby, where
    var sql = "select " + cols + " from " + table;
    var offset = (page - 1) * size;
    if (where)
      sql += " where " + where;

    if (orderBy)
      sql += " order by " + orderBy;

    if (size > 0)
      sql += " limit " + size + " offset " + offset;

    var result = await db.query(sql, params);
    return result.rows;
  },
  insert: async (table, model, returningCols) => {
    var sql = "insert into ";
    var ks = [], vs = [], ps = [];
    var index = 1;
    for (var k in model) {
      ks.push(k);
      vs.push(model[k]);
      ps.push("$" + index);
      index++;
    }
    returningCols = returningCols || ["id"];

    table = '"' + table + '"';
    if (model.hasOwnProperty("id"))
      sql += table + " (" + ks + ") values (" + ps + ") ";
    else
      sql += table + " (" + ks + ") values (" + ps + ") ";
    sql += " returning " + returningCols;

    var result = await db.query(sql, vs);

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    return { id: 0 };
  },

  update: async (table, model, returningCols) => {
    var sql = "update ";
    if (!model.hasOwnProperty("id")) {
      return { count: 0, error: "Must prefer id" };
    }

    var vs = [], ps = [];
    var index = 1;
    var sets = [];
    for (var k in model) {
      if (k != "id") {
        sets.push(k + "=$" + index);
        vs.push(model[k]);
        index++;
      }
    }
    returningCols = returningCols || ["id"];

    table = '"' + table + '"';
    sql += table + " set " + sets + " where id=$" + index;
    vs.push(model.id);

    sql += " returning " + returningCols;

    var result = await db.query(sql, vs);

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    return { id: 0 };
  },

  updateBatch: async (table, model, condition) => {

    condition = condition || {};
    var where = condition.where;
    var params = condition.params;

    var sql = "update ";

    var vs = [], ps = [];
    var index = 1;
    var sets = [];
    for (var k in model) {
      if (k != "id") {
        sets.push(k + "=$" + index);
        vs.push(model[k]);
        index++;
      }
    }
    if (params) {
      var pSql = db.prepareSQL(where, params, index);
      where = pSql.sql;

      vs = vs.concat(pSql.arrayParams);
    }

    table = '"' + table + '"';
    sql += table + " set " + sets + " where " + where;


    var result = await db.query(sql, vs);

    return { effected: result.rowCount };
  },

  save: async (table, model, returningCols) => {
    if (model.hasOwnProperty("id") && model.id) {
      return await db.update(table, model, returningCols);
    } else {
      return await db.insert(table, model, returningCols);
    }
  },

  load: async (table, condition) => {
    condition = condition || {};
    var where = condition.where;
    var params = condition.params;
    var cols = condition.cols || "*";
    if (params) {
      var pSql = db.prepareSQL(where, params);
      where = pSql.sql;
      params = pSql.arrayParams;
    }
    table = '"' + table + '"';
    var sql = "select " + cols + " from " + table;
    if (where)
      sql += " where " + where;
    sql += " limit 1";

    var result = await db.query(sql, params);
    if (result.rowCount > 0) {
      return result.rows[0];
    }

    return null;
  },

  loadById: async (table, id, cols) => {
    return await db.load(table, { where: "id=$id", params: { id: id }, cols: cols });
  },

  del: async (table, condition) => {
    condition = condition || {};
    var where = condition.where;
    var params = condition.params;

    if (params) {
      var pSql = db.prepareSQL(where, params);
      where = pSql.sql;
      params = pSql.arrayParams;
    }
    table = '"' + table + '"';
    var sql = "delete from " + table;
    if (where)
      sql += " where " + where;

    var result = await db.query(sql, params);
    return { effected: result.rowCount };
  },

  delById: async (table, id) => {
    return await db.del(table, { where: "id=$id", params: { id: id } });
  },

  count: async (table, condition) => {
    condition = condition || {};
    var where = condition.where;
    var params = condition.params;

    if (params) {
      var pSql = db.prepareSQL(where, params);
      where = pSql.sql;
      params = pSql.arrayParams;
    }
    table = '"' + table + '"';
    var sql = "select count(*)::int as ct from " + table;
    if (where)
      sql += " where " + where;

    var result = await db.query(sql, params);
    return { count: result.rows[0].ct };
  },
  query: async (sql, params) => {
    if (!db.pool) {
      throw errors.CUSTOM("You must connect when app startup. See https://node-postgres.com/api/pool");
    }
    if (process.env.debug) {
      console.log("------------", new Date(), "----------------------------");
      console.log("sql: ", sql);
      console.log("params: ", params);
    }
    const client = await db.pool.connect();
    const rows = await client.query(sql, params);
    client.release();
    return rows;
  },



  /**
   * 准备SQL，将 $key 换成 $1 的这种模式，替换不完全的，并没有做提示
   * @param sql
   * @param jsonParams
   * @param index 基础的位置
   * @returns {{sql: string, arrayParams: Array}}
   */
  prepareSQL: function (sql, jsonParams, index) {
    index = index || 1;
    var arrayParams = [];
    sql += " ";
    for (var k in jsonParams) {
      if (sql.indexOf("$" + k + " ") >= 0
        || sql.indexOf("$" + k + "::") >= 0
        || sql.indexOf("$" + k + ")") >= 0
      ) {
        sql = sql.replace(new RegExp("\\$" + k, 'g'), "$" + index);
        arrayParams.push(jsonParams[k]);
        index++;
      }
    }
    return { sql: sql, arrayParams: arrayParams }
  }
};


module.exports = db;