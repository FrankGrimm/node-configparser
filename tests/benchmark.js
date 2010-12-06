var ConfigParser = require('../lib/configparser/configparser').ConfigParser;

var generateDataSet = function(count, len) {
  var res = [];
  var inputSpace = 'ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz0123456789';
  var inputSpaceLen = inputSpace.length;

  var c = null;
  while(count--) {
    c = '';
    for (var i = len; i > 0; i--) c += inputSpace.substr(Math.floor(Math.random() * inputSpaceLen), 1);
    res.push(c);
  }

  return res;
}

var ops = 0;
var startT = null;
function start() {
  startT = +new Date;
  ops = 0;
}
function stop(message) {
  var dur = ((+new Date) - startT);
  var opsPerSecond = ops / dur;

  console.log("Time taken: %d s (%d ms) | %d operations per second [%s]", (dur / 1000).toFixed(2), dur.toFixed(4), opsPerSecond.toFixed(2), message);
}

(function bm(dataSetSize) {
  var inst = new ConfigParser();
  inst.add_section('test');

  start();
  var dataSet = generateDataSet(dataSetSize, 50);
  ops = dataSetSize;
  stop("Dataset generation");

  start();
  for (var i = 0, l = dataSet.length; i < l; i++) {
    inst.set('test', 'item' + i, dataSet[i]);
  }
  ops = dataSetSize;
  stop('set operation');

  start();
  for (var i = 0, l = dataSet.length; i < l; i++) {
    inst.get('test', 'item' + i);
  }
  ops = dataSetSize;
  stop('get operation');

  start();
  ops = 2 * dataSetSize;
  for (var i = 0, l = ops; i < l; i++) {
    inst.has_option('test', 'item' + i);
  }
  stop('has_option lookups');
})(100000);

