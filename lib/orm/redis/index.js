let path     = require('path');
let fs       = require('fs');
let logger   = require('tracer').colorConsole();

let client;

module.exports = class Redis{
  static connect(url,app_name){

    let redisClient             = require('redis');
    client            = redisClient.createClient(url||process.env.redis_url);
    client.on('error',function(err){
      logger.error(err);
    });

    let defaultKeys=require('./redisDefaultKeys');
    Redis.load(defaultKeys,'common');

    let keyPath=process.env.app_root+(process.env.my_redis_key_path||'/redisKeys.js');
    try {
      fs.accessSync(keyPath, fs.F_OK);
      app_name = app_name || process.env.app_name || "unkown-service"; 
      Redis.load(require(keyPath),app_name);
      console.log('===========================');
      console.log('加载自定义 redisKeys @ ' + app_name);
    } catch (e) {
      logger.warn("文件 "+keyPath+" 不可访问，跳过自定义redisKeys加载。");
    }
  }
  static load(json,app_name){
    for(let k in json){
      Redis[k]=new Redis(app_name,k);
    }
  }
  constructor(app_name,namespace){
    this.ns=app_name+'.'+namespace;
  }
  key(k){
    return new RedisClient(this.ns+k);
  }
  *set(v){
    let _this=this;
    return yield function (cb) {
      client.set(_this.ns,v,cb);
    };
  }

  *get(){
    let _this=this;
    return yield function (cb) {
      client.get(_this.ns, cb);
    };
  }
  *del(){
    let _this=this;
    return yield function (cb) {
      client.del(_this.ns, cb);
    };
  }
  *rpush(arr){
    let _this=this;
    return yield function (cb) {
      client.rpush(_this.ns,arr,cb);
    };
  }
  *lpop(){
    let _this=this;
    return yield function (cb) {
      client.lpop(_this.ns, cb);
    };
  }
  *hset(k,v){
    let _this=this;
    return yield function (cb) {
      client.hset(_this.ns,k,v,cb);
    };
  }
  *hget(k){
    let _this=this;
    return yield function (cb) {
      client.hget(_this.ns,k,cb);
    };
  }
  *hmset(){
    let _this=this;
    let args=arguments;
    let array=arguments[0];
    if(array instanceof Array){
      return yield function (cb) {
        client.hmset(_this.ns,array,cb);
      };
    }
    return yield function (cb) {
      client.hmset(_this.ns,...args,cb);
    };
  }
  *hkeys(){
    let _this=this;
    return yield function (cb) {
      client.hkeys(_this.ns,cb);
    };
  }

  *hgetall(){
    let _this=this;
    return yield function (cb) {
      client.hgetall(_this.ns,cb);
    };
  }
  //cmds with transaction
  *multi(cmds){
    let _this=this;
    return yield function (cb) {
      client.multi(cmds).exec(cb);
    };
  }
  //cmds with no transaction
  *batch(cmds){
    let _this=this;
    return yield function (cb) {
      client.batch(cmds)
      .exec(cb);
    };
  }
  *incr(v){
    let _this=this;
    return yield function (cb) {
      if(v){
        client.incrby(_this.ns,v,cb);
      }else{
        client.incr(_this.ns,cb);        
      }
    };
  }
}