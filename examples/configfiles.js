// Example for reading and writing config files
var ConfigParser = require('../lib/configparser/configparser').ConfigParser;

// initialize an instance with a few default values
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

// write the default configuration to a write stream
// with the default line delimiter (\n)
// and closing the write stream afterwards
config.write(require('fs').createWriteStream('defaults.cfg'));

// react on the written event
config.on('written', function() {

  // initialize a new ConfigParser instance
  var readConfig = new ConfigParser();

  // read the previously written config file and attempt
  // to read a non-existing file
  //require('path').join(process.env.HOME, '.home_cfg');
  readConfig.read(['defaults.cfg', 'non-existant.cfg']);

  // react on the readfile event
  readConfig.on('readfile', function(err, filename) {
    // check if there was an error
    if (err) {
      console.log('Error "' + err.message + '" when reading <' + filename + '>');
      return;
    }

    // state now represents the persistant state in the file
    console.log("File <" + filename + "> read.");
  
    // dump the state of the configuration to STDOUT with \n as the line delimiter
    // the third parameter indicates that the write stream should not be closed
    // after writing the data
    readConfig.write(process.stdout, '\n', true);
  }).on('error', function(err) {
    // an error was thrown in the newly created configuration
    // this MUST be handled when working with files or streams
    // although it's not necessary to act on this errors. it exists
    // primarily for logging purposes
    console.log("[ERROR:readConfig] " + err.message);
  });

});

// just in case
process.on('uncaughtException', function(err) {
  console.log(err.message);
  console.log(err.stack);
});
