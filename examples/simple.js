var ConfigParser = require('../lib/configparser/configparser').ConfigParser;

var config = new ConfigParser();

console.log(config.defaults());
