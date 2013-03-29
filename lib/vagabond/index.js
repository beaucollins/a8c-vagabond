var vagabond = module.exports = function configure(config){
  console.log("Hola mundo");
};

vagabond.stream = require('./stream');
vagabond.server = require('./server');