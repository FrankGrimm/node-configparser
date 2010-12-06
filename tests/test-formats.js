// parser tests for various format variations
var assert = require('assert');
var ConfigParser = require('../lib/configparser/configparser').ConfigParser;

var testFormat = function(content, expectedState, testCase) {
  var conf = new ConfigParser();

  conf.parse(content, '<fakefile>');

  // It's a bit hackish to access the state like this, never do that out of testing
  assert.deepEqual(conf._state, expectedState);
}

testFormat('foo=bar', {'default': {foo:'bar'}});
testFormat('foo:bar', {'default': {foo:'bar'}});

testFormat('[section]\nfoo=bar', {'default': {}, 'section': {foo:'bar'}});
testFormat('foo=bar\n[section]\nfoo=bar', {'default': {foo:'bar'}, 'section': {foo:'bar'}});

testFormat('[section]\nfoo:bar', {'default': {}, 'section': {foo:'bar'}});
testFormat('foo:bar\n[section]\nfoo:bar', {'default': {foo:'bar'}, 'section': {foo:'bar'}});

testFormat('foobar', {'default': {'foobar': null}});
testFormat('novalue\n[section]\nfoo:bar\n  novalue', {'default': {'novalue':null}, 'section': {'foo':'bar', 'novalue':null}});
testFormat(' novalue\n\nfoo:bar\n[section]\n  \nfoo:bar\nnovalue ', {'default': {'novalue': null, 'foo':'bar'}, 'section': {foo:'bar', 'novalue': null}});

