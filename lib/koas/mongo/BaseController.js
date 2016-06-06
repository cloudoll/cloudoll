var querystring     = require("querystring");
var BaseService     = require('./BaseService');
/***
 *
 * 所有 Controllers
 *
 * 提供 必要的 接口操作  @au huangxing  @date 2016 05 27
 *
 * */
var BaseControllers = {
  create: function (options) {
    options     = options || {};
    var service = new BaseService(options.table);
    var obj     = {};

    obj.$save = function *() {
      var form = this.request.body;
      this.body = yield service.save(form);
    };

    /** 按 id 查询对应 的 对象**/
    obj.findById = function *() {
      // var qs = querystring.parse(this.request.querystring);
      // console.log("findById-query:", qs);
      // 前提条件，使用了 qs 中间键。
      this.body = yield service.findById(this.qs.id);
    };
    /***默认的 find 查询方法*/
    obj.$find = function *() {
      var query   = this.request.body;
      var options = query.options;
      delete query.options;
      this.body = yield service.find(query, options);
    };
    /****按id 删除**/
    obj.deleteById = function *() {
      var qs = querystring.parse(this.request.querystring);
      console.log("deleteById-id:", qs);
      this.body = yield service.deleteById(qs.id);
    };
    /***
     *
     * 按查询条件 统计数量
     * */
    obj.count = function *() {
      var qs = querystring.parse(this.request.querystring);
      this.body = yield service.count(qs);
    };
    return obj;
  }
};
/*******************exports********/module.exports = BaseControllers;