"use strict";

var Clouderr    = require('clouderr').Clouderr;
var errors      = require('clouderr').errors;
var cloudeer    = require('cloudeer');
var querystring = require('querystring');
var urlTool     = require('url');

class KoaMiddlewares {
  constructor() {
    console.log('权限中间键初始化开始');
    if (!process.env.appName) {
      throw errors.WHAT_REQUIRE("环境变量 appName");
    }
  }

  *checkRights(next) {
    var qs     = querystring.parse(this.request.querystring);
    var ticket = qs.ticket;

    if (!ticket) {
      throw errors.WHAT_REQUIRE('ticket');
    }

    var rights = yield cloudeer.invokeCo("GET", "cloudarling", "/rights",
      {
        ticket: ticket, service: process.env.appName
      });

    var jRights = rights;
    if (typeof jRights == "string") {
      jRights = JSON.parse(rights);
    }
    if (jRights.errno != 0) {
      throw Clouderr.fromJson(jRights);
    }
    var myRights = jRights.data.rights;
    var godRight = myRights.filter(function (ele) {
      return ele.id == 0;
    });
    var isGods   = godRight && godRight.length > 0;
    if (!isGods) {
      var pathJson = urlTool.parse(this.url);
      var pathname = pathJson.pathname.toLowerCase();

      var myRight  = myRights.filter(function (ele) {
        return ele.code == pathname;
      });
      var hasRight = myRight && myRight.length > 0;
      if (!hasRight) {
        throw errors.NO_RIGHTS;
      }
    }
    yield next;
  }
}

module.exports = KoaMiddlewares;

