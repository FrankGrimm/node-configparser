var ConfigParser = require('../lib/configparser/configparser').ConfigParser;

// initialize ConfigParser with some default values
var config = new ConfigParser(
  {'rootkey': 'value', 'rootkey2': 'another value',
  'section_1': {'a_section_key': '42', 'another_key': '43'},
  'section_2': {'json_content': '{"a":"b", "c":"d"}'}
  });

// Add a new section
config.add_section('new_section');

// Set a value to the new section
config.set('new_section', 'abc', 'true');

// Set a value in the default section
config.set(null, 'rootkey3', 'foobar');

console.log("Defaults:");
console.log(config.defaults());

console.log("Sections:");
console.log(config.sections());

console.log("Options in the default section:");
console.log(config.options());

console.log("Items in the default section:");
console.log(config.items());

if (config.has_section('section_1') && config.has_option('section_1', 'a_section_key')) {
  console.log("Integer value for section_1/a_section_key " + config.getint('section_1', 'a_section_key'));
}

console.log("JSON data (section_2/json_content):");
try {
  console.log(config.getJSON('section_2', 'json_content'));
} catch (ex) {
  console.log(ex);
}
