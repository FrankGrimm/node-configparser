// TODO defaults for getters
// TODO parse multiline values (RFC 822)
// TODO interpolation in getters
// TODO events
// TODO support allow_no_value

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

  return this;
};

// let ConfigParser inherit from EventEmitter
utils.inherits(ConfigParser, EventEmitter);

ConfigParser.prototype.defaults = function() {
  return this._defaults;
}

ConfigParser.prototype.sections = function() {
  var res = [];

  for (var currentKey in this._state) {
    if (this._state.hasOwnProperty(currentKey) && currentKey != this.optionxform(SECTION_DEFAULT)) {
      res.push(currentKey);
    }
  }

  return res;
}

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

ConfigParser.prototype._get_section = function(sectionName) {
  if (!sectionName) return this._get_section(SECTION_DEFAULT);
  sectionName = this.optionxform(sectionName);

  var sec = this._state[sectionName];

  if (sec != undefined) return sec;

  return null;
}

ConfigParser.prototype.has_section = function(sectionName) {
  return this._get_section(sectionName) != null;
}

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

ConfigParser.prototype.has_option = function(sectionName, optionName) {
  var opts = this.options(sectionName);
  optionName = optionName.toLowerCase();

  for(var i = 0; i < opts.length; i++) {
    if (opts[i].toLowerCase() == optionName) return true;
  }

  return false;
}

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

ConfigParser.prototype.parse = function(content, filename) {
  var lines = content.split(/\r\n|\r|\n/);
  var filename = filename || '<???>';

  var currentSection = SECTION_DEFAULT;

  for(var i = 0, l = lines.length; i < l; i++) {
    var line = lines[i];
    var line_trimmed = line.replace(/^\s*/, "").replace(/\s*$/, "");

    if (line_trimmed.length > 0) {
      var line_trimmed_lc = line_trimmed.toLowerCase();

      if (line_trimmed.substr(0, 1) === '[' && line_trimmed.substr(-1) === ']') {

        // section
        currentSection = line_trimmed.substr(1, line_trimmed.length - 2);
        this.add_section(currentSection);

      } else if (line_trimmed.indexOf('=') > -1) {

        // option
        var d = line_trimmed.indexOf('=');
        var key = line_trimmed.substr(0, d).replace(/^\s*/, "").replace(/\s*$/, "");
        var value = line_trimmed.substr(d+1).replace(/^\s*/, "").replace(/\s*$/, "");

        this.set(currentSection, key, value);

      }
    }
  }

  this.emit('readfile', filename);
    // optionxform(option) -> vorher trim whitespace
}

ConfigParser.prototype.readfile = function(filename) {
  var self = this;
  if (filename) {
    fs.readFile(filename, 'utf-8', function(err, data) {
      if (err) {
        self.emit('error', err);
        return;
      }
      self.parse(data, filename);
    });
  }
}

ConfigParser.prototype.get = function(section, option) {
  var optionName = this.optionxform(option);

  var sectionState = this._get_section(section);

  if (sectionState) {
    var optionState = sectionState[this.optionxform(option)];
    
    if (optionState != undefined) {
      return optionState;
    }
  } 

  var defaultSectionState = this._defaults[sectionName];
  if (defaultSectionState) {
    var defaultOptionState = defaultSectionState[optionName];

    if (defaultOptionState != undefined) {
      return defaultOptionState;
    }
  }

  return null;
}

ConfigParser.prototype.getint = function(section, option) {
  var c = this.get(section, option);
  return parseInt(c);
}

ConfigParser.prototype.getfloat = function(section, option) {
  var c = this.get(section, option);
  if (typeof c === 'number') return c;
  return parseFloat(c);
}

ConfigParser.prototype.getboolean = function(section, option) {
  var c = this.get(section, option);
  if (typeof c === 'boolean') return c;
  if (typeof c === 'string') {
    var v = c.toLowerCase();
    if (v === 'true') {
      return true;
    } else if (v === 'false') {
      return false;
    }
  }
  return null;
}

ConfigParser.prototype.getJSON = function(section, option) {
  var c = this.get(section, option);

  try {
    return JSON.parse(c);
  } catch(e) {
    this.emit('error', e);
  }
}

ConfigParser.prototype.items = function(section) {
  var res = [];

  var opts = this.options(section);

  for(var i = 0; i < opts.length; i++) {
    res.push([opts[i], this.get(section, opts[i])]);
  }

  return res;
}

ConfigParser.prototype.set = function(section, option, value) {
  var sectionState = this._get_section(section);

  if (sectionState != null) {
    sectionState[this.optionxform(option)] = value;
    return true;
  }

  return false;
}

ConfigParser.prototype._write_section = function(fileobject, section, line_delimiter) {
  var opts = this.items(section);
 
  for(var opt_idx = 0; opt_idx < opts.length; opt_idx++) {
    fileobject.write(opts[opt_idx][0] + ' = ' + opts[opt_idx][1] + line_delimiter);
  }
}

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
  }
}

ConfigParser.prototype.remove_option = function(section, option) {
  var sectionState = this._get_section(section);

  if (sectionState != null) {
    var optionName = this.optionxform(option);
    if (sectionState[optionName]) {
      delete sectionState[optionName];
      return true;
    }
  }

  return false;
}

ConfigParser.prototype.remove_section = function(section) {
  var sectionKey = this.optionxform(section);

  if (this._state[sectionKey]) {
    delete this._state[sectionKey];
    return true;
  }

  return false;
}

ConfigParser.prototype.optionxform = function(option) {
  return option.toLowerCase();
}


// export the ConfigParser class
module.exports.ConfigParser = ConfigParser;

