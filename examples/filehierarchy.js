// Example for reading and writing config files
var ConfigParser = require('../lib/configparser/configparser').ConfigParser;

var config = new ConfigParser();

config.on('error', function(err) {
  console.log("[ERROR] " + err.message);
});

// attempts to read config files in /etc/, $HOME and the current working directory
config.read(['/etc/sample.cfg', require('path').join(process.env.HOME, '.sample.cfg'), 'sample.cfg']);

config.on('readfile', function(err, filename) {
  if (err) return;
  console.log("State updated with file " + filename);
});

// initialize SIGHUP hook
config.reloadOnSigHup();

console.log('----------------------------------------------');
console.log("  kill or ^C to exit");
console.log("  Try reloading the configuration with:")
console.log("   kill -SIGHUP " + process.pid);
console.log('----------------------------------------------');

// open STDIN to keep this running
process.openStdin();
