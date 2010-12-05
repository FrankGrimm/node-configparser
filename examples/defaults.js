// Example for working with default values
var ConfigParser = require('../lib/configparser/configparser').ConfigParser;

var sampleDefaults = {rootkey:'rootValue',
  rootkey2: '42',
  section1: {
    section1key1: '1234',
    section1key2: 'foobar'
    },
  section2: {
    foo: 'bar',
    bar: 'foo'
    }
  }

var config = new ConfigParser(sampleDefaults);

console.log("Defaults:");
console.log(config.defaults());

console.log("Options in DEFAULT:");
console.log(config.options()); // []

console.log("Options in section1:");
console.log(config.options("section1")); // ['section1key1', 'section1key2']

console.log("Options in non-existing section:");
console.log(config.options("nope")); // []

