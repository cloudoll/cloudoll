//这是监视服务性能的一写方法封装

const os = require('os');

module.exports = {
  cmdParser: function (cmdInfo) {
    switch (cmdInfo.cmd){

    }
  },
  osCpus: function () {
    return os.cpus();
  },

};