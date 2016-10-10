const net      = require('net');
const errors   = require('../errors/errors');
const tools    = require('../tools');
const tcpTools = require('./TcpTools');
const Cloudeer = require('./Cloudeer');
const os       = require('os');
let retryTimes = 1;

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

  this.heartBeatInterval = options.heartBeatInterval || 5000; //超时时间

}

TcpClient.prototype.startService = function () {
  var _this   = this;
  this.socket = net.connect({host: this.host, port: this.port});
  this.socket.setKeepAlive(true, 45000);

  // this.socket.setTimeout(_this.timeout, function () {
  //   _this.isActive = false;
  // });
  //
  // this.socket.on('timeout', function () {
  //   if (_this.isActive) {
  //     _this.socket.setTimeout(_this.timeout, function () {
  //       _this.isActive = false;
  //     });
  //   } else {
  //     tools.error("超时了，启动重连");
  //     _this.needReconnect = true;
  //     _this.socket.end();
  //   }
  //
  // });

  this.socket.on("error", (err)=> {
    if (_this.socket.heartBeat) {
      clearInterval(_this.socket.heartBeat);
    }
    tools.error('这是我的第', retryTimes, "次求爱，仍然失败，继续尝试...");
    if (retryTimes >= _this.maxRetryTimes) {
      tools.error('第', retryTimes, "次了，我感到绝望，我放弃了。我挥刀自宫，不带走一丝云彩。");
    } else {
      setTimeout(function () {
        retryTimes++;
        _this.socket.connect({host: _this.host, port: _this.port});
      }, retryTimes * 1000);
    }
  });

  this.socket.on("connect", function () {
    tcpTools.cmdLogin(_this.socket, _this.username, _this.password);
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
      let cmdChunck = chunk.substring(0, d_index);
      // console.log(cmdChunck);
      // let jsonInfo;
      try {
        let jsonInfo = JSON.parse(cmdChunck);

        tools.debug("接收的数据：", jsonInfo);

        chunk        = chunk.substr(d_index + 1);
        // console.log(jsonInfo);
        if (jsonInfo.errno != 0) {
          tools.error("女王，你怎么了？你不要我，我自宫好了。\n 程序🐶，快来救我：", jsonInfo.errText);
          this.needReconnect = false;
        } else {
          if (jsonInfo.cmd.startsWith('mnt-')) {
            tcpTools.cmdMonitorRequest(jsonInfo, this.socket);
          } else {
            switch (jsonInfo.cmd) {
              case 'login':
                tools.info("我的钥匙已经成功穿透她的心！");
                if (jsonInfo.data ) {
                  Cloudeer.sid = jsonInfo.data.sid;
                }
                tcpTools.cmdRegService(this.socket, this.app_name, this.app_host,
                  this.app_port, this.app_base_uri, this.not_a_consumer);
                // if (!this.not_a_service && this.postMethods) {
                //   cmdRegMethods(this.socket, this.app_name, this.postMethods);
                // }
                tcpTools.heartBeat(this.socket, this.heartBeatInterval); //开始发送心跳
                break;
              case 'reg-service':
                tools.info("我太性福了，女王已经接纳我了！");
                break;
              case 'get-services':
                tools.info("男宠有变化了，请重新认识各位哥哥弟弟！");
                Cloudeer.innerIps = {};
                Cloudeer.config   = jsonInfo.data;
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
        }
      } catch (e) {
        tools.error("错误的数据，必须提供 json 格式的数据。", e);
        //console.log(chunk);
      }
    }
  });


};

TcpClient.httpResponse = null;

TcpClient.prototype.serverInfo = function (ip) {
  tcpTools.cmdServerInfo(this.socket, ip);

};

// TcpClient.prototype.sendMessage = function (msg) {
//   this.socket.writable && this.socket.write(msg);
// };
//
// TcpClient.prototype.sendJson = function (json) {
//   this.socket.writable && this.socket.write(JSON.stringify(json));
// };


// const cmdGetMethods = function (soket) {
//   sendJson(socket, {
//     cmd : 'get-methods'
//   });
// };


module.exports = TcpClient;
