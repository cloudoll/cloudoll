'use strict';
let errors     = require('./errors');
let regx       = require('./regx');
module.exports = {
  required: function (arg, name) {
    if (arg==undefined) {
      throw errors.WHAT_REQUIRE(name);
    }
  },
  lenGe: function (arg, name,value) {
    if (arg==undefined) {
      return;
    }
    if(arg.length<value){
      throw errors.WHAT_TOO_SHORT(name,value);
    }
  },
  lenLt: function (arg, name,value) {
    if (arg==undefined) {
      return;
    }
    if(arg.length>value){
      throw errors.WHAT_TOO_LONG(name,value);
    }
  },
  lenRange: function (arg, name,min,max) {
    if (arg==undefined) {
      throw errors.WHAT_REQUIRE(name);
    }
    if(arg.length<min){
      throw errors.WHAT_WRONG_RANGE(name,min.max);
    }else if(arg.length>max){
      throw errors.WHAT_WRONG_RANGE(name,min.max);
    }
  },
  int     : function (arg, name) {
    if (arg==undefined) {
      return;
    }
    if (!regx.int.test(arg)) {
      throw errors.WHAT_WRONG_TYPE(name);
    }
  },
  float     : function (arg, name) {
    if (arg==undefined) {
      return;
    }
    if (!regx.float.test(arg)) {
      throw errors.WHAT_WRONG_TYPE(name);
    }
  },
  ge      : function (arg, name, value) {
    if (arg==undefined) {
      return;
    }
    if (arg < value) {
      throw errors.WHAT_TOO_LITTLE(name);
    }
  },
  le      : function (arg, name, value) {
    if (arg==undefined) {
      return;
    }
    if (arg > value) {
      throw errors.WHAT_TOO_MUCH(name);
    }
  },

  num   : function (arg, name) {
    if (arg==undefined) {
      return;
    }
    if (typeof i == 'number') {
      throw errors.WHAT_WRONG_TYPE(name);
    }
  },
  mobile: function (mobile) {
    if (arg==undefined) {
      return;
    }
    if (!regx.mobile.test(mobile)) {
      throw errors.WHAT_WRONG_TYPE('手机');
    }
  },
  tel   : function (tel) {
    if (arg==undefined) {
      return;
    }
    if (!regx.tel.test(tel)) {
      throw errors.WHAT_WRONG_TYPE('电话');
    }
  },
  email : function (email) {
    if (arg==undefined) {
      return;
    }
    if (!regx.email.test(email)) {
      throw errors.WHAT_WRONG_TYPE('邮箱');
    }
  },

  combined: function () {
    let args  = Array.prototype.slice.call(arguments, 1);
    let funcs = arguments[0];
    for (let i = 0; i < funcs.length; i++) {
      funcs[i](...args);
    }
  }
};
