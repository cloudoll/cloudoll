var loveme     = {
  hello : function *() {
    console.log(this.qs);
    this.body = "hello world.";
  },
  hello1: function *() {
    this.body = "hello world.";
  },
  hello2: function *() {
    console.log('qs test', this.qs);
    this.body = "hello world.";
  },
  helloSendMeCraete: function *() {
    this.body = "hello world.";
  },
  hellMama : function *() {

    this.body = "hello world.";
  },
  $hello5: function *() {
    console.log(this.request.body);
    this.body = "hello world.";
  },
  $hello6: function *() {
    this.body = "hello world.";
  },
};
module.exports = loveme;