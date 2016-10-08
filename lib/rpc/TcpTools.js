var tools = require('../tools');
const os  = require('os');
const Reponse = require('./Response');
const Cloudeer = require('./Cloudeer');

var TcpTools = module.exports = {

  sendJson: function (socket, json) {
    socket.write(JSON.stringify(json) + os.EOL);
  },

  onGetServices: function (services) {

  },

  heartBeat: function (socket, interval) {
    tools.info("我的心开始 砰砰 跳...");
    socket.heartBeat = setInterval(function () {
      TcpTools.sendJson(socket, {cmd: 'ping'});
    }, interval || 5000);
  },

  cmdLogin: function (socket, username, password) {
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
      TcpTools.sendJson(socket, {
        cmd : 'login',
        data: data
      });
    }
  },

  cmdRegService: function (socket, appName, host, port, baseUri, notAConsumer) {
    let data = {
      appName     : appName,
      host        : host,
      port        : port,
      baseUri     : baseUri,
      notAConsumer: notAConsumer
    };
    tools.info("我奉上我的信息，请你接纳我...");
    TcpTools.sendJson(socket, {
      cmd : 'reg-service',
      data: data
    });

  },

  cmdRegMethods: function (socket, appName, methods) {
    // console.log(methods);
    tools.info("报告女王，这是奴才的名帖 [提交方法]。");
    //socket.bufferSize = 1024;
    TcpTools.sendJson(socket, {
      cmd : 'reg-methods',
      data: {
        service: appName,
        methods: methods
      }
    });
  },

  cmdServerInfo: function (socket, ip) {
    TcpTools.sendJson(socket, {
      cmd: 'mnt-server-info~' + ip,
      sid: Cloudeer.sid
    });
  },

  cmdMonitorRequest    : function (cmdJson, socket) {
    //console.log("服务器开始问我性能问题了。", cmdJson.cmd, cmdJson.sid);
    switch (cmdJson.cmd) {
      case "mnt-server-info":
        TcpTools.cmdResponseServerInfo(socket, cmdJson.sid);
        break;
      case 'mnt-server-info-response':
        // console.log(cmdJson);
        Reponse.httpResponse = cmdJson.data;
        break;
    }
  },
  cmdResponseServerInfo: function (socket, sid) {
    TcpTools.sendJson(socket, {
      cmd : 'mnt-server-info',
      sid : sid,
      data: {
        cpus    : os.cpus(),
        uptime  : os.uptime(),
        totalmem: os.totalmem(),
        freemem : os.freemem(),
        loadavg : os.loadavg(),
        homedir : os.homedir()
      }
    });

  }
};