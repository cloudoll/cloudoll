'use strict';

var path      = require('path');
var fs        = require('fs');
var ZSchema   = require("z-schema");
var validator = new ZSchema();
var errors    = require('../errors/errors');
var logger    = require('tracer').colorConsole();
var tools     = require('../tools');

class JsonValidator {
  constructor(schemaPath, watchDir) {
    this.schemaMap = {};
    tools.consoleLog("===========================");
    tools.consoleLog("JsonValidator 初始化开始..");
    schemaPath    = schemaPath || './schema';
    let schemaDir = path.resolve(schemaPath);
    tools.consoleLog('schema 目录：', schemaDir);


    watchDir = watchDir || ['/api/admin', '/api/open', '/api/inner'];
    watchDir.forEach(function (e) {
      e          = e.substring(e.indexOf('/', 1));
      // console.log('-----------------', e);
      let prefix = e + '/';
      let files;
      try {
        files = fs.readdirSync(schemaDir + e);
      } catch (e) {
        tools.warn("目录 %s 不可访问。", schemaDir + e);
        return;
      }
      for (let i in files) {
        let file          = files[i];
        let fileName      = file.split(".");
        let interfaceName = fileName[0].split('_');
        let key           = prefix + interfaceName[0] + '/' + interfaceName[1];
        tools.consoleLog('schema 加载：', key, '====>', schemaDir + prefix + file);
        JsonValidator.schemaMap[key] = require(schemaDir + prefix + file);
      }
    });
  }

  *schemaValidator(next) {
    // logger.debug('-------------------------------');
    // logger.debug(this.request.body);
    if (this.method === "POST") {
      let idx = this.url.indexOf('?');
      let url;
      if (idx == -1) {
        url = this.url;
      } else {
        url = this.url.substr(0, idx);
      }
      let schema = JsonValidator.schemaMap[url];

      // logger.debug(schema);
      if (process.env.debug) {
        logger.debug('url', url);
      }
      // logger.debug(JsonValidator.schemaMap);
      if (schema) {
        tools.info('开始验证：%s', url);
        tools.info(this.request.body);
        yield JsonValidator.validate(this.request.body, schema);
      }
    }
    yield next;
  }

  static validate(body, schema) {
    return function (callback) {
      validator.validate(body, schema, function (errs) {
        if (errs) {
          logger.info(errs);
          callback(JsonValidator.convertError(errs[0]));
        }
        else callback(null, true);
      });
    };

  }


  static convertError(err) {
    logger.error(err);
    switch (err.code) {
      case 'OBJECT_MISSING_REQUIRED_PROPERTY':
        return errors.WHAT_REQUIRE(err.params[0]);
      case 'MIN_LENGTH':
        return errors.WHAT_TOO_SHORT(err.description, err.params[1]);
      case 'MAX_LENGTH':
        //err.description
        return errors.WHAT_TOO_LONG(err.description, err.params[1]);
      case 'INVALID_TYPE':
        return errors.WHAT_WRONG_TYPE(err.description);
      case 'PATTERN':
        return errors.WHAT_WRONG_FORMAT(err.description);
      default:
        return errors.CUSTOM(err.description + ':' + err.message);
    }
  }
}

JsonValidator.schemaMap = {};

module.exports = JsonValidator;