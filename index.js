
const path = require('path');
const root = path.resolve('.');
const pkg = require(path.join(root, 'package.json'));
global.appName = pkg.name;
if (!pkg.egg) {
  throw new Error("错误，必须在 package.json 中指定 egg 节点。");
}
global.eggPort = pkg.egg.port || 7001;


const egg = require('egg');
Object.assign(exports, egg);


exports.Application = require('./lib/EveApplication');
exports.Agent = require('./lib/EveAgent');
exports.startCluster = require('./lib/startCluster');

exports.errors = errors = require('./lib/eve-errors').errors;
exports.EveError = require('./lib/eve-errors').EveError;

exports.tools = require('./lib/tools');

exports.orm = {
  mysql: require('./lib/orm/mysql')
};
