var net    = require('net');
var errors = require('../errors/errors');
var tools  = require('../tools');

var retryTimes = 1;
var timerGetServices;

function CloudeerClient(options) {
  options                  = options || {};
  // console.log(options);
  this.port                = options.port || 2345;
  this.maxRetryTimes       = options.maxRetryTimes || 20;
  this.getServicesInterval = options.getServicesInterval || 5000;
  if (!options.cloudeer_server) {
    throw errors.WHAT_REQUIRE("cloudeer_server");
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
  this.app_name        = options.app_name;
  this.app_host        = options.app_host;
  this.app_port        = options.app_port;
  this.app_base_uri    = options.app_base_uri || "";
  this.cloudeer_server = options.cloudeer_server;

  this.password = options.password;
  this.username = options.username;

  this.options = options;

  this.socket = null;

  this.needReconnect = true;

}

CloudeerClient.prototype.startService = function () {
  var _this   = this;
  this.socket = net.connect({host: this.cloudeer_server, port: this.port});

  this.socket.on("error", (err)=> {
    tools.info('这是我的第', retryTimes, "连接了，仍然失败，继续尝试连接...");
    if (retryTimes >= this.maxRetryTimes) {
      tools.error('第', retryTimes, "次了，我感到绝望，我放弃了，我挥刀自宫，不带走一丝云彩。");
    } else {
      setTimeout(function () {
        retryTimes++;
        _this.socket.connect({host: _this.cloudeer_server, port: _this.port});
      }, retryTimes * 1000);
    }
  });

  this.socket.on("connect", function () {
    cmdLogin(_this.socket, _this.username, _this.password);
  });

  this.socket.on('end', ()=> {
    tools.info("注册服务器关闭，断开连接。");
    retryTimes = 1;
    clearInterval(timerGetServices);

    if (this.needReconnect) {
      this.socket.connect({host: _this.cloudeer_server, port: _this.port});
    }

  });

  this.socket.on("data", (data)=> {
    var jsonInfo;
    try {
      jsonInfo = JSON.parse(data.toString());
    } catch (e) {
      tools.error("错误的数据，必须提供 json 格式的数据。");
    }
    // console.log(jsonInfo);
    if (jsonInfo.errno != 0) {
      tools.error("女王，你怎么了？你挺不住，我也自宫好了。", jsonInfo.errText);
      this.needReconnect = false;
    } else {
      switch (jsonInfo.cmd) {
        case 'login':
          tools.info("我的钥匙已经成功穿透她的心！");
          cmdRegService(this.socket, this.app_name, this.app_host, this.app_port, this.app_base_uri);
          break;
        case 'reg-service':
          tools.info("我太性福了，她已经接纳我了！");
          cmdDownloadServices(this.socket, this.getServicesInterval);
          break;
        case 'get-services':
          tools.info("各房少爷在此！");
          tools.consoleLog(jsonInfo.data);
          break;
      }
    }
  });


};


CloudeerClient.prototype.sendMessage = function (msg) {
  this.socket.writable && this.socket.write(msg);
};

CloudeerClient.prototype.sendJson = function (json) {
  this.socket.writable && this.socket.write(JSON.stringify(json));
};

const cmdLogin = function (socket, username, password) {
  if (username) {
    tools.info('我举起了我的钥匙，对准...');
    let data = {
      username: username,
      password: password
    };
    socket.write(
      JSON.stringify(
        {
          cmd : 'login',
          data: data
        })
    );
  }
};

const cmdRegService = function (socket, appName, host, port, baseUri) {
  let data = {
    appName: appName,
    host   : host,
    port   : port,
    baseUri: baseUri
  };
  tools.info("我奉上我的信息，请你接纳我...");
  socket.write(
    JSON.stringify(
      {
        cmd : 'reg-service',
        data: data
      })
  );

};


const cmdDownloadServices = function (socket, interval) {
  tools.info('女王，大房，二房，三房呢？');

  timerGetServices = setInterval(function () {
    socket.write(
      JSON.stringify(
        {
          cmd: 'get-services'
        })
    );
  }, interval || 5000);
};

module.exports = CloudeerClient;
