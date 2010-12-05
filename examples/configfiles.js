var ConfigParser = require('../lib/configparser/configparser').ConfigParser;

var sampleDefaults = {rootkey:'rootValue',
  rootkey2: 42,
  section1: {
    section1key1: 1234,
    section1key2: 'foobar'
    },
  section2: {
    foo: 'bar',
    bar: 'foo'
    }
  }

var config = new ConfigParser(sampleDefaults);

config.on('error', function(err) {
  console.log("[ERRROR:config] " + err.message);
});

// write defaults
config.write(require('fs').createWriteStream('defaults.cfg'));
config.on('written', function() {

var readConfig = new ConfigParser();

readConfig.read(['defaults.cfg', 'non-existant.cfg']);
readConfig.on('readfile', function(filename) {
  console.log("File <" + filename + "> read");

  readConfig.write(process.stdout, '\n', true);
}).on('error', function(err) {
  console.log("[ERROR:readConfig] " + err.message);
});

});

process.on('uncaughtException', function(err) {
  console.log(err.message);
  console.log(err.stack);
});
