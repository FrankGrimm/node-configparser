var assert = require('assert');

var ConfigParser = require('../lib/configparser/configparser').ConfigParser;
assert.notEqual(ConfigParser, null);
assert.notEqual(ConfigParser, undefined);

var c1 = new ConfigParser();

// test initial state
assert.deepEqual(c1.items(), []);
assert.deepEqual(c1.sections(), []);

assert.ok(c1.add_section('asection'));
assert.ok(!c1.add_section('asection'));
assert.ok(c1.has_section('asection'));
assert.ok(!c1.has_section('section'));

var c2 = new ConfigParser({'rootkey': 'rootval', 
  'section': {'sectionkey1': 'sectionvalue', 'sectionkey2': '4711'},
  'typed': {'jsondata': '{"a":"b", "c":"d"}', 'intdata': '4711', 'floatdata': '47.11', 'booldata': 'yes', 'booldata2': 'True'}});

var hadEvent_init = false;
c2.on('init', function() {
  hadEvent_init = true;
});

var c2_errorcount = 0;
c2.on('error', function() {
  c2_errorcount++;
});

assert.equal(c2.set('', 'rootkey2', 'rootval2'), true);
assert.equal(c2.set('', 'rootkey', 'rootval'), false);

var c2_changecount = 0;
c2.on('change', function(section, option, oldValue, newValue) {
  c2_changecount++;
});

// section subscriptions
var c2_change_default = 0;
c2.on('change#default', function(section, option, oldValue, newValue) {
  assert.ok(c2 === this);
  assert.ok(section);
  assert.equal(section, 'default');
  
  c2_change_default++;
});

var c2_change_section = 0;
c2.on('change#section', function(section, option, oldValue, newValue) {
  assert.ok(c2 === this);
  assert.ok(section);
  assert.equal(section, 'section');

  c2_change_section++;
});

var c2_change_typed = 0;
c2.on('change#typed', function(section, option, oldValue, newValue) {
  assert.ok(c2 === this);
  assert.ok(section);
  assert.equal(section, 'typed');
  c2_change_typed++;
});

var c2_change_newsection = 0;
var hadSecondChangeCallback = false;
c2.on('change#newsection', function(section, option, oldValue, newValue) {
  assert.ok(c2 === this);
  assert.ok(section);
  assert.equal(section, 'newsection');
  c2_change_newsection++;
});
c2.on('change#newsection', function(section, option, oldValue, newValue) {
  hadSecondChangeCallback = true;
});

var notCalled = function() { assert.ok(false); }
c2.on('change#newsection', notCalled);
c2.removeListener('change#newsection', notCalled);

assert.throws(function() {
  c2.set('invalidsection', 'invalidkey', 'value');
});

assert.doesNotThrow(function() {
  c2.set('section', 'sectionkey3', 'abc');
  c2.set('typed', 'stringdata', 'abc');
});

assert.throws(function() {
  c2.get('invalidsection', 'invalidkey');
});

assert.throws(function() {
  c2.get('section', 'invalidkey');
});

assert.deepEqual(c2.defaults(), { 'default': {'rootkey': 'rootval'},
  'section': {'sectionkey1': 'sectionvalue', 'sectionkey2': '4711'},
  'typed': {'jsondata': '{"a":"b", "c":"d"}', 'intdata': '4711', 'floatdata': '47.11', 'booldata': 'yes', 'booldata2': 'True'}});

assert.deepEqual(c2.sections(), ["section","typed"]);
assert.deepEqual(c2.items('section'), [["sectionkey1","sectionvalue"],["sectionkey2","4711"],["sectionkey3","abc"]]);
assert.deepEqual(c2.options('section'), ['sectionkey1', 'sectionkey2','sectionkey3']);

assert.doesNotThrow(function() {
  c2.parse("nosection=nosectionvalue\n [newsection]\n akey= avalue\nanother key : another value", '<fakefile>');
});

assert.equal(c2.get('', 'nosection'), 'nosectionvalue');
assert.ok(c2.has_section('newsection'));
assert.equal(c2.get('newsection', 'akey'), 'avalue');
assert.equal(c2.get('newsection', 'another key'), 'another value');

c1.on('error', function(err) {
  assert.equal(err.path, 'nonexistant.cfg')
});
c1.readfile('nonexistant.cfg');

assert.doesNotThrow(function() {
  c2.remove_section('section');
  c2.remove_option('typed', 'jsondata');
});

assert.throws(function() {
  c2.remove_section('invalid');
});

assert.throws(function() {
  c2.remove_option('typed', 'jsondata');
});

assert.throws(function() {
  c2.remove_option('invalid', 'abc');
});

process.on('exit', function() {
  assert.ok(hadEvent_init);
  assert.equal(c2_changecount, 9);
  assert.equal(c2_errorcount, 0);
  assert.equal(c2_change_default, 1);
  assert.equal(c2_change_section, 4);
  assert.equal(c2_change_typed, 2);
  assert.equal(c2_change_newsection, 2);
  assert.ok(hadSecondChangeCallback);
});

assert.equal(c2.getint('typed', 'intdata'), 4711);
assert.equal(c2.getfloat('typed', 'intdata'), 4711);
assert.equal(c2.getfloat('typed', 'floatdata'), 47.11);
assert.equal(c2.getboolean('typed', 'booldata'), true);
assert.equal(c2.getboolean('typed', 'booldata2'), true);
assert.deepEqual(c2.getJSON('typed', 'jsondata'), {a:'b', c:'d'});
