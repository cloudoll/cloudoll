'use strict';

var path      = require('path');
var fs        = require('fs');
var ZSchema   = require("z-schema");
var validator = new ZSchema();
var errors    = require('../errors/errors');
var logger    = require('tracer').colorConsole();

class JsonValidator {
  constructor(schemaPath, watchDir) {
    this.schemaMap = {};
    console.log("===========================");
    console.log("JsonValidator 初始化开始..");
    schemaPath    = schemaPath || './schema';
    let schemaDir = path.resolve(schemaPath);
    console.log('schema 目录：', schemaDir);


    watchDir = watchDir || ['/api/admin', '/api/open', '/api/inner'];
    watchDir.forEach(function (e) {
      e = e.substring(e.indexOf('/', 1));
      // console.log('-----------------', e);
      let prefix = e + '/';
      let files;
      try {
        files = fs.readdirSync(schemaDir + e);
      } catch (e) {
        logger.warn("目录 %s 不可访问。", schemaDir + e);
        return;
      }
      for (let i in files) {
        let file          = files[i];
        let fileName      = file.split(".");
        let interfaceName = fileName[0].split('-');
        let key           = prefix + interfaceName[0] + '/' + interfaceName[1];
        console.log('schema 加载：', key, '====>', schemaDir + prefix + file);
        JsonValidator.schemaMap[key] = require(schemaDir + prefix + file);
      }
    });
  }

  *schemaValidator(next) {
    if (this.method === "POST");
    {
      let schema = JsonValidator.schemaMap[this.url];
      if (schema) {
        if (process.env.debug) {
          logger.info(this.request.body);
        }
        yield JsonValidator.validate(this.request.body, schema);
      }
    }
    yield next;
  }

  static validate(body, schema) {
    return function (callback) {
      validator.validate(body, schema, function (errs) {
        if (errs) {
          if (process.env.debug) {
            logger.info(errs);
          }
          callback(JsonValidator.convertError(errs[0]));
        }
        else callback(null, true);
      });
    };

  }


  static convertError(err) {
    // console.log(err);
    switch (err.code) {
      case 'OBJECT_MISSING_REQUIRED_PROPERTY':
        return errors.WHAT_REQUIRE(err.params[0]);
      case 'MIN_LENGTH':
        return errors.WHAT_TOO_SHORT(err.path.substr(2), err.params[1]);
      case 'MAX_LENGTH':
        return errors.WHAT_TOO_LONG(err.path.substr(2), err.params[1]);
      case 'INVALID_TYPE':
        return errors.WHAT_WRONG_TYPE(err.path.substr(2));
      case 'PATTERN':
        return errors.WHAT_WRONG_FORMAT(err.path.substr(2));
      default:
        return errors.CUSTOM(err.message);
    }
  }
}

JsonValidator.schemaMap = {};

module.exports = JsonValidator;