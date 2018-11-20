const url = require("url");
const nunjucks = require('nunjucks');
const path = require('path');

class EvePage {
  constructor(data, page) {
    this.data = data;
    this.page = page;
  }

  render() {
    return nunjucks.render(this.page, this.data);
  }
}

module.exports = EvePage;