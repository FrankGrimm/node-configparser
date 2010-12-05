var ConfigParser = require('../lib/configparser/configparser').ConfigParser;

// initialize ConfigParser with some default values (change events will not fire for those)
var config = new ConfigParser(
  {'rootkey': 'value', 'rootkey2': 'another value',
  'section_1': {'a_section_key': '42', 'another_key': '43'},
  'section_2': {'json_content': '{"a":"b", "c":"d"}'}
  });

config.on('init', function() {
  console.log('ConfigParser initialized');
});

config.on('readfile', function(err, filename) {
  if (err) {
    console.log('Could not read file <' + filename + '>: ' + err.message);
    return;
  }
  console.log('File <' + filename + '> was read.');
});

config.on('change', function(section, option, oldValue, newValue) {
  if (oldValue === null) {
    console.log(section + ':' + option + ' created, set to ' + newValue);
  } else if (newValue === null) {
    console.log(section + ':' + option + ' deleted. (previous values: ' + oldValue + ')')
  } else {
    console.log(section + ':' + option + ' changed from ' + oldValue + ' to ' + newValue);
  }
});

config.on('written', function(err) {
  if (err) {
    console.log(err);
    return;
  }
  //Writing the config only takes a file descriptor so this event is 
  // only useful if you only write to one file at a time. Implement a 
  // write queue if you have to track write status
  console.log('Configuration was fully written.');
});

config.on('error', function(err) {
  // generic error event, mainly used for reading and writing of config files
  console.log("[Error] " + err.message);
});

try {

  config.remove_option('section_2', 'json_content');

  config.set('section_1', 'new_key', 'abc');

  config.set('section_1', 'new_key', 'def');

  config.remove_section('section_1');

} catch (err) {
  console.log(err);
}
