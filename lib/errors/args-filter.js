'use strict';
let errors     = require('./errors');
let regx       = require('./regx');
module.exports = {
  required: function (arg, name) {
    if (!arg) throw errors.WHAT_REQUIRE(name);
  },
  int     : function (arg, name) {
    if (!arg) return;
    if (!Number.isInteger(arg)) throw errors.WHAT_WRONG_TYPE(name);
  },
  ge      : function (arg, name, value) {
    if (!arg) return;
    if (arg < value) throw errors.WHAT_TOO_LITTLE(name);
  },
  le      : function (arg, name, value) {
    if (!arg) return;
    if (arg > value) throw errors.WHAT_TOO_MUCH(name);
  },

  num   : function (arg, name) {
    if (typeof i == 'number') throw errors.WHAT_WRONG_TYPE(name);
  },
  mobile: function (mobile) {
    if (!regx.mobile.test(mobile)) throw errors.WHAT_WRONG_TYPE('手机');
  },
  tel   : function (tel) {
    if (!regx.tel.test(tel)) throw errors.WHAT_WRONG_TYPE('电话');
  },
  email : function (email) {
    if (!regx.email.test(email)) throw errors.WHAT_WRONG_TYPE('邮箱');
  },

  combined: function () {
    let args  = Array.prototype.slice.call(arguments, 1);
    let funcs = arguments[0];
    for (let i = 0; i < funcs.length; i++) {
      funcs[i](...args);
    }
  }
};
