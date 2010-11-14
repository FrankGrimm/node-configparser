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

console.log(config.defaults());
console.log(config.sections());

console.log(config.has_section("DEFAULT")); // false
console.log(config.has_section("nope")); // false
console.log(config.has_section("section1")); // true

console.log(config.options()); // []
console.log(config.options("section1")); // ['section1key1', 'section1key2']
console.log(config.options("nope")); // []

config.write(require('fs').createWriteStream('./defaults.cfg'));
