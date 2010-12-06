// Example for reading and writing config files
var ConfigParser = require('../lib/configparser/configparser').ConfigParser;
var path = require('path');

var config = new ConfigParser();

config.on('error', function(err) {
  console.log("[ERROR] " + err.message);
});

// watch for file changes in all successfully loaded configuration files
config.setWatch(true);

// attempts to read config files in /etc/, $HOME and the current working directory
config.read(['/etc/sample.cfg', path.join(process.env.HOME, '.sample.cfg'), path.join(__dirname, 'sample.cfg')]);

config.on('readfile', function(err, filename) {
  if (err) return;
  console.log("State updated with file " + filename);
});

config.on('change', function(section, option, oldValue, newValue) {
  console.log('[' + section + '/' + option + '] is now ' + newValue);
});

console.log('----------------------------------------------');
console.log("  kill or ^C to exit");
console.log("  Try changing one of the configuration files.")
console.log('----------------------------------------------');

// open STDIN to keep this running
process.openStdin();
