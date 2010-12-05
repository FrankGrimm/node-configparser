var fs = require('fs'),
  EventEmitter = require('events').EventEmitter,
  utils = require('util');

var SECTION_DEFAULT = 'DEFAULT';

var ConfigParser = function(defaults) {
  EventEmitter.call(this);

  this._state = {};
  this._defaults = {};

  var defaultSection = this.optionxform(SECTION_DEFAULT);

  this.add_section(defaultSection);

  // copy default options and set them as initial state
  for (var currentKey in defaults) {
    if (defaults.hasOwnProperty(currentKey)) {
      var currentItem = defaults[currentKey];

      if (currentItem instanceof Object) {
        // hit a subsection
        this._defaults[currentKey] = defaults[currentKey];
        this._state[currentKey] = defaults[currentKey];
      } else {
        // an item in the hidden "DEFAULT" section
        if (!this._defaults[defaultSection]) {
          this._defaults[defaultSection] = {}
          this._state[defaultSection] = {}
        }
        this._defaults[defaultSection][currentKey] = defaults[currentKey];
        this._state[defaultSection][currentKey] = defaults[currentKey];
      }
    }
  }

  this.emit('init');
  return this;
};

// let ConfigParser inherit from EventEmitter
utils.inherits(ConfigParser, EventEmitter);

// returns an object representing the default state
ConfigParser.prototype.defaults = function() {
  return this._defaults;
}

// returns an array of strings, containing the names of all sections except for the default section
ConfigParser.prototype.sections = function() {
  var res = [];

  for (var currentKey in this._state) {
    if (this._state.hasOwnProperty(currentKey) && currentKey != this.optionxform(SECTION_DEFAULT)) {
      res.push(currentKey);
    }
  }

  return res;
}

// add a section to the configuration
// returns true if the section didn't already exist, false otherwise
ConfigParser.prototype.add_section = function(sectionName) {
  if (!this.has_section(sectionName)) {
    this._state[this.optionxform(sectionName)] = {};
    return true;
  }

  return false;
}

ConfigParser.prototype._get_default_section = function(sectionName) {
  if (!sectionName) return this._get_default_section(SECTION_DEFAULT);

  sectionName = this.optionxform(sectionName);

  var sec = this._defaults[sectionName];

  if (sec != undefined) return sec;

  return null;
}

// private, lookup for a section of the configuration state
ConfigParser.prototype._get_section = function(sectionName) {
  if (!sectionName) return this._get_section(SECTION_DEFAULT);
  sectionName = this.optionxform(sectionName);

  if (sectionName in this._state) return this._state[sectionName];

  return null;
}

// returns true if the specified section exists, false otherwise
ConfigParser.prototype.has_section = function(sectionName) {
  return this._get_section(sectionName) != null;
}

// returns an array of strings with the names of all options in the specified section
// or for the default section if omitted
ConfigParser.prototype.options = function(sectionName) {
  var res = [];

  var sectionState = this._get_section(sectionName);

  if (sectionState != null) {
    for (var currentKey in sectionState) {
      if (sectionState.hasOwnProperty(currentKey)) res.push(currentKey);
    }
  }

  return res;
}

// returns true if the current state has the specified option, false otherwise
ConfigParser.prototype.has_option = function(sectionName, optionName) {
  var opts = this.options(sectionName);
  optionName = optionName.toLowerCase();

  for(var i = 0; i < opts.length; i++) {
    if (opts[i].toLowerCase() == optionName) return true;
  }

  return false;
}

// read a list of filenames
// TODO make this sequential
ConfigParser.prototype.read = function(filenames) {
  if (filenames) {
    if (filenames instanceof Array) {
      // array of filenames
      for(var i = 0; i < filenames.length; i++) {
        var current = filenames[i];

        this.readfile(current);
      }
    } else if (typeof filenames === 'string') {
      // single filename
      this.read([filenames]);
    }  
  }
}

// TODO let this work on a copy of the current state (with a change listener to keep it up to date)
//      so that the state change is atomic and complete
ConfigParser.prototype.parse = function(content, filename) {
  var lines = content.split(/\r\n|\r|\n/);
  var filename = filename || '<???>';

  // assume that key=value pairs without a previous section header belong to the default section
  var currentSection = SECTION_DEFAULT;
  var changes = [];

  for(var i = 0, l = lines.length; i < l; i++) {
    var line = lines[i];
    var line_trimmed = line.replace(/^\s*/, "").replace(/\s*$/, "");

    if (line_trimmed.length > 0) {
      var line_trimmed_lc = line_trimmed.toLowerCase();

      if (line_trimmed.substr(0, 1) === '[' && line_trimmed.substr(-1) === ']') {

        // section
        currentSection = line_trimmed.substr(1, line_trimmed.length - 2);
        this.add_section(this.optionxform(currentSection));

      } else if (line_trimmed.indexOf('=') > -1) {

        // option
        var d = line_trimmed.indexOf('=');
        var key = this.optionxform(line_trimmed.substr(0, d).replace(/^\s*/, "").replace(/\s*$/, ""));
        var value = line_trimmed.substr(d+1).replace(/^\s*/, "").replace(/\s*$/, "");

        // preserve old value in case a change event has to be fired
        var oldValue = this.has_option(currentSection, key) ? this.get(currentSection, key) : null;

        if (this.set(currentSection, key, value, true)) {
          // value was changed, queue it for change events
          changes.push({sectionName: currentSection, optionName: key, oldVal: oldValue, newVal: value});
        }

      }
    }
  }

  // all lines parsed, emit queued change events
  for (var i = 0, l = changes.length; i < l; i++) {
    var c = changes[i];
    this.emit('change', c.sectionName, c.optionName, c.oldVal, c.newVal); 
  }

  // emit readfile, indicating that the state is now updated with the files content
  this.emit('readfile', null, filename);

  // return the number of changes
  return changes.length;
}

// Read and parse a single file (by name)
ConfigParser.prototype.readfile = function(filename) {
  var self = this;
  if (filename) {
    fs.readFile(filename, 'utf-8', function(err, data) {
      if (err) {
        // emit a generic error event
        self.emit('error', err);

        // emit a readfile event with the error as first param
        // so one can react on this specific error case
        self.emit('readfile', err, filename);
        return;
      }
      self.parse(data, filename);
    });
  }
}

// get a value, if section is falsy, the default section will be used
// returns the current value, the default value or throws an OptionNotFound Error
ConfigParser.prototype.get = function(section, option) {
  var optionName = this.optionxform(option);
  var sectionName = this.optionxform(section);
  var sectionState = this._get_section(sectionName);


  if (sectionState) {
    if (optionName in sectionState) {
      return sectionState[optionName];
    }
  } 

  if (sectionName in this._defaults) {
    var defaultSectionState = this._defaults[sectionName];

    if (optionName in defaultSectionState) {
      return defaultSectionState[optionName];
    }
  }

  var optionNotFound = new Error('Option ' + optionName + ' could not be found in section ' + sectionName);
  optionNotFound.name = 'OptionNotFound';
  throw optionNotFound;
}

// return the value as an integer, NaN otherwise (behaviour as specified for parseInt)
ConfigParser.prototype.getint = function(section, option) {
  var c = this.get(section, option);
  return parseInt(c);
}

// return the value as float, NaN otherwise (behaviour as specified for parseFloat)
ConfigParser.prototype.getfloat = function(section, option) {
  var c = this.get(section, option);
  if (typeof c === 'number') return c;
  return parseFloat(c);
}

// convert a value to boolean
// True values: true, 1, yes, on
// False values: false, 0, no, off
// throws a ValueError otherwise
ConfigParser.prototype.getboolean = function(section, option) {
  var c = this.get(section, option);
  if (typeof c === 'boolean') return c;
  if (typeof c === 'string') {
    var v = c.toLowerCase();
    if (v === 'true' || v === '1' || v === 'yes' || v === 'on') {
      return true;
    } else if (v === 'false' || v === '0' || v === 'no' || v === 'off') {
      return false;
    }
  }

  var err = new Error();
  err.name = 'ValueError';
  err.message = 'Could not convert "' + c + '" to boolean';
  throw err;
}

// get a value and parse it with JSON.parse
ConfigParser.prototype.getJSON = function(section, option) {
  var c = this.get(section, option);

  return JSON.parse(c);
}

// Returns all key/value pairs of a section
ConfigParser.prototype.items = function(section) {
  var res = [];

  var opts = this.options(section);

  for(var i = 0; i < opts.length; i++) {
    res.push([opts[i], this.get(section, opts[i])]);
  }

  return res;
}

// set (and/or create) a value
ConfigParser.prototype.set = function(section, option, value, noEmitOnChange) {
  var sectionState = this._get_section(section);

  if (sectionState != null) {
    var optionName = this.optionxform(option);
    var oldValue = (optionName in sectionState) ? sectionState[optionName] : null;

    // update the state of this option
    sectionState[optionName] = value;

    // omit the event if noEmitOnChange is undefined / false
    if (!noEmitOnChange) this.emit('change', this.optionxform(section), optionName, oldValue, value);

    // return if the value has changed
    return oldValue != value;
  } else {
    var sectionNotFound = new Error('Section ' + section + ' could not be found.');
    sectionNotFound.name = "SectionNotFound";
    this.emit('error', sectionNotFound);
    return sectionNotFound;
  }
}

// private, dumps the content of a section to the specified output stream
ConfigParser.prototype._write_section = function(fileobject, section, line_delimiter) {
  var opts = this.items(section);

  for(var opt_idx = 0; opt_idx < opts.length; opt_idx++) {
    var k = opts[opt_idx][0];
    var val = opts[opt_idx][1];

    // make sure objects are saved as their JSON representation
    if (val instanceof Object) val = JSON.stringify(val);

    fileobject.write(k + ' = ' + val + line_delimiter);
  }
}

// write configuration state to a writable stream
// lines are seperated by \n by default
// dont_end may be set to true in case the output stream should not be closed
// after writing
ConfigParser.prototype.write = function(fileobject, line_delimiter, dont_end) {
  var delimiter = line_delimiter || '\n';

  // writable typo in core (e.g. for process.stdout)
  // should be removed when everybody is on 0.3.x
  if (fileobject.writeable || fileobject.writable) {
    // output default section w/o a section header
    this._write_section(fileobject, SECTION_DEFAULT, delimiter);

    // output all other sections
    var sects = this.sections();

    for(var i = 0; i < sects.length; i++) {
      fileobject.write('[' + sects[i] + ']' + delimiter);
      this._write_section(fileobject, sects[i], delimiter);
    }

    if (dont_end) {
      this.emit('written');
      return;
    } else {
      var self = this;
      fileobject.end(function() {
        self.emit('written');
      });
    }
  } else {
    var err = new Error('Stream is not writable');
    err.name = 'NotWritable';
    this.emit('error', err);
    this.emit('written', err);
  }
}

ConfigParser.prototype.remove_option = function(section, option) {
  var sectionState = this._get_section(section);

  if (sectionState != null) {
    var optionName = this.optionxform(option);
    if (optionName in sectionState) {
      var oldValue = sectionState[optionName];
      this.emit('change', this.optionxform(section), optionName, oldValue, null);
      delete sectionState[optionName];
      return;
    }

    var err = new Error('Option ' + optionName + ' not found in section ' + this.optionxform(section) + '.');
    err.name = 'OptionNotFound';
    throw err;
  } else {
    var err = new Error('Section ' + this.optionxform(section) + ' not found.');
    err.name = 'SectionNotFound';
    throw err;
  }
}

ConfigParser.prototype.remove_section = function(section) {
  var sectionKey = this.optionxform(section);

  if (this._state[sectionKey]) {
    var s = this._state[sectionKey];
    for (var c in s) {
      if (s.hasOwnProperty(c)) {
        this.emit('change', sectionKey, c, s[c], null);
      }
    }
    delete this._state[sectionKey];
    return;
  }

  var err = new Error('Section ' + sectionKey + ' not found.');
  err.name = 'SectionNotFound';
  throw err;
}

ConfigParser.prototype.optionxform = function(option) {
  if (option === undefined || option === null) return '';
  return option.toLowerCase();
}


// export the ConfigParser class
module.exports.ConfigParser = ConfigParser;


