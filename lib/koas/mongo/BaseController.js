var BaseService = require('./BaseService');
var ObjectID    = require("mongodb").ObjectID;

var errors         = require('../../errors/errors');
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
      var form = this.request.body;
      if (form.ticket){
        delete form.ticket;
      }
      convert(form);
      this.body = errors.success(yield service.save(form));
    };
    //如果有无法使用save方法修改才使用
    obj.$update = function *() {
      var form = this.request.body;
      if (form.ticket){
        delete form.ticket;
      }
      convert(form);
      this.body = errors.success(yield service.update(form.query,form.doc,form.options));
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
      var query = this.request.body.query||{};
      var options = this.request.body.options;
      options.sort=options.sort||{'create_time': -1};
      convert(query);
      this.body   = errors.success(yield service.find(query, options));
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
    obj.$count = function *() {
      var query = this.request.body.query;
      var options = this.request.body.options;
      convert(query);
      this.body   = errors.success(yield service.count(query, options));
    };
    /**
     * 带有分页信息的 查询
     */
    obj.$list = function *() {
      var query = this.request.body.query||{};
      var options = this.request.body.options;
      options.sort=options.sort||{'create_time': -1};
      convert(query);
      this.body   = errors.success(yield service.list(query, options));
    };
    return obj;
  }
};

module.exports = BaseController;

//转换$regex
function convert(obj){
  if(obj==null)return;
  // if (obj.hasOwnProperty('$regex')) {
  //   obj.$regex = new RegExp(obj.$regex);
  //   return;
  // }else

  for(let key in obj){
    let value=obj[key]
    let idx=key.indexof('_id');
    if (typeof value=='string' && idx!=-1&&idx+3==key.length) {
      obj[key] = new ObjectID(value);
    }
    if(typeof value=='object'){
      convert(value);
    }
  }
}