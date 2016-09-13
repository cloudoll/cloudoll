var net        = require('net');
var errors     = require('../errors/errors');
var tools      = require('../tools');
var Cloudeer   = require('./Cloudeer');
var retryTimes = 1;
const os       = require('os');

function TcpClient(options) {
  options            = options || {};
  // console.log(options);
  this.port          = options.port || 2345;
  this.maxRetryTimes = options.maxRetryTimes || 20;
  if (!options.host) {
    throw errors.WHAT_REQUIRE("host");
  }
  if (!options.app_name) {
    throw errors.WHAT_REQUIRE("app_name");
  }
  if (!options.app_host) {
    throw errors.WHAT_REQUIRE("app_host");
  }
  if (!options.app_port) {
    throw errors.WHAT_REQUIRE("app_port");
  }
  this.app_name       = options.app_name || process.env.app_name;
  this.app_host       = options.app_host;
  this.app_port       = options.app_port;
  this.app_base_uri   = options.app_base_uri || "";
  this.host           = options.host;
  this.not_a_consumer = options.not_a_consumer || false;

  this.password = options.password;
  this.username = options.username;

  this.options = options;

  this.socket = null;

  this.needReconnect = true;
  this.postMethods   = null;

}

TcpClient.prototype.startService = function () {
  var _this   = this;
  this.socket = net.connect({host: this.host, port: this.port});

  this.socket.on("error", (err)=> {
    tools.info('这是我的第', retryTimes, "次求爱，仍然失败，继续尝试...");
    if (retryTimes >= this.maxRetryTimes) {
      tools.error('第', retryTimes, "次了，我感到绝望，我放弃了。我挥刀自宫，不带走一丝云彩。");
    } else {
      setTimeout(function () {
        retryTimes++;
        _this.socket.connect({host: _this.host, port: _this.port});
      }, retryTimes * 1000);
    }
  });

  this.socket.on("connect", function () {
    cmdLogin(_this.socket, _this.username, _this.password);
  });

  this.socket.on('end', ()=> {
    tools.error("女王失去联系了。\n 程序🐶，快去救救女王，或者修复我的钥匙！");
    retryTimes = 1;

    if (this.needReconnect) {
      this.socket.connect({host: _this.host, port: _this.port});
    }

  });

  let chunk = "";
  this.socket.on("data", (data)=> {
    // console.log(data.toString());

    chunk += data.toString();
    let d_index = chunk.indexOf(os.EOL);
    if (d_index > -1) {
      chunk = chunk.substring(0, d_index);
      // let jsonInfo;
      try {
        let jsonInfo = JSON.parse(chunk);
        chunk        = ""; //chunk.substr(d_index + 1);
        // console.log(jsonInfo);
        if (jsonInfo.errno != 0) {
          tools.error("女王，你怎么了？你不要我，我自宫好了。\n 程序🐶，快来救我：", jsonInfo.errText);
          this.needReconnect = false;
        } else {
          switch (jsonInfo.cmd) {
            case 'login':
              tools.info("我的钥匙已经成功穿透她的心！");
              cmdRegService(this.socket, this.app_name, this.app_host,
                this.app_port, this.app_base_uri, this.not_a_consumer);
              if (!this.not_a_service && this.postMethods) {
                cmdRegMethods(this.socket, this.app_name, this.postMethods);
              }
              break;
            case 'reg-service':
              tools.info("我太性福了，女王已经接纳我了！");
              break;
            case 'get-services':
              tools.info("男宠有变化了，请重新认识各位哥哥弟弟！");
              Cloudeer.config = jsonInfo.data;
              for (var svr in Cloudeer.config) {
                if (Cloudeer.config.hasOwnProperty(svr)) {
                  var hosts = Cloudeer.config[svr].hosts;
                  for (var h of hosts) {
                    Cloudeer.innerIps[h.host] = 1;
                  }
                }
              }
              break;
            // case 'get-methods':
            //
            //   break;
          }
        }
      } catch (e) {
        tools.error("错误的数据，必须提供 json 格式的数据。");
        console.log(chunk);
      }
    }
  });


};


// TcpClient.prototype.sendMessage = function (msg) {
//   this.socket.writable && this.socket.write(msg);
// };
//
// TcpClient.prototype.sendJson = function (json) {
//   this.socket.writable && this.socket.write(JSON.stringify(json));
// };

const sendJson = function (socket, json) {
  socket.write(JSON.stringify(json) + os.EOL);
};

const cmdLogin = function (socket, username, password) {
  if (!username) {
    username = "knock";
    password = ""
  }
  if (username) {
    tools.info('我举起了我的钥匙，对准...');
    let data = {
      username: username,
      password: password
    };
    sendJson(socket, {
      cmd : 'login',
      data: data
    });
  }
};

const cmdRegService = function (socket, appName, host, port, baseUri, notAConsumer) {
  let data = {
    appName     : appName,
    host        : host,
    port        : port,
    baseUri     : baseUri,
    notAConsumer: notAConsumer
  };
  tools.info("我奉上我的信息，请你接纳我...");
  sendJson(socket, {
    cmd : 'reg-service',
    data: data
  });

};

const cmdRegMethods = function (socket, appName, methods) {
  // console.log(methods);
  tools.info("报告女王，这是奴才的名帖 [提交方法]。");
  //socket.bufferSize = 1024;
  sendJson(socket, {
    cmd : 'reg-methods',
    data: {
      service: appName,
      methods: methods
    }
  });
};

// const cmdGetMethods = function (soket) {
//   sendJson(socket, {
//     cmd : 'get-methods'
//   });
// };


module.exports = TcpClient;
