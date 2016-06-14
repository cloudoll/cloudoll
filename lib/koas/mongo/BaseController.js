var BaseService     = require('./BaseService');
var errors          = require('../../errors/errors');
/***
 *
 * 所有 Controllers
 *
 * 提供 必要的 接口操作
 *
 * */
var BaseController = {
  create: function (options) {
    options     = options || {};
    var service = new BaseService(options.table);
    var obj     = {};

    obj.$save = function *() {
      var form  = this.request.body;
      this.body = errors.success(yield service.save(form));
    };

    /** 按 id 查询对应 的 对象**/
    obj.findById = function *() {
      // var qs = querystring.parse(this.request.querystring);
      // console.log("findById-query:", qs);
      // 前提条件，使用了 qs 中间键。
      this.body = errors.success(yield service.findById(this.qs.id));
    };
    /***默认的 find 查询方法*/
    obj.$find = function *() {
      var query   = this.request.body.query;
      var options = this.request.body.options;
      delete query.options;
      this.body = errors.success(yield service.find(query, options));
    };
    /****按id 删除**/
    obj.deleteById = function *() {
      // var qs = querystring.parse(this.request.querystring);
      // console.log("deleteById-id:", qs);
      this.body = errors.success(yield service.deleteById(this.qs.id));
    };
    /***
     *
     * 按查询条件 统计数量
     * */
    obj.count = function *() {
      var query   = this.request.body.query;
      var options = this.request.body.options;
      this.body = errors.success(yield service.count(query, options));
    };
    /**
     * 带有分页信息的 查询
     */
    obj.$list = function *() {
      var query   = this.request.body.query;
      var options = this.request.body.options;
      this.body = errors.success(yield service.list(query, options));
    };
    return obj;
  }
};

module.exports = BaseController;