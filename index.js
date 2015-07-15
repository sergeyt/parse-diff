var defaultToWhiteSpace, escapeRegExp, ltrim, makeString, parseFile, trimLeft;

module.exports = function(input) {
  var add, chunk, current, del, deleted_file, file, files, from_file, i, index, len, line, lines, ln_add, ln_del, new_file, noeol, normal, parse, restart, schema, start, to_file;
  if (!input) {
    return [];
  }
  if (input.match(/^\s+$/)) {
    return [];
  }
  lines = input.split('\n');
  if (lines.length === 0) {
    return [];
  }
  files = [];
  file = null;
  ln_del = 0;
  ln_add = 0;
  current = null;
  start = function() {
    file = {
      chunks: [],
      deletions: 0,
      additions: 0
    };
    return files.push(file);
  };
  restart = function() {
    if (!file || file.chunks.length) {
      return start();
    }
  };
  new_file = function() {
    restart();
    return file["new"] = true;
  };
  deleted_file = function() {
    restart();
    return file.deleted = true;
  };
  index = function(line) {
    restart();
    return file.index = line.split(' ').slice(1);
  };
  from_file = function(line) {
    restart();
    return file.from = parseFile(line);
  };
  to_file = function(line) {
    restart();
    return file.to = parseFile(line);
  };
  chunk = function(line, match) {
    var newLines, newStart, oldLines, oldStart;
    ln_del = oldStart = +match[1];
    oldLines = +(match[2] || 0);
    ln_add = newStart = +match[3];
    newLines = +(match[4] || 0);
    current = {
      content: line,
      changes: [],
      oldStart: oldStart,
      oldLines: oldLines,
      newStart: newStart,
      newLines: newLines
    };
    return file.chunks.push(current);
  };
  del = function(line) {
    current.changes.push({
      type: 'del',
      del: true,
      ln: ln_del++,
      content: line
    });
    return file.deletions++;
  };
  add = function(line) {
    current.changes.push({
      type: 'add',
      add: true,
      ln: ln_add++,
      content: line
    });
    return file.additions++;
  };
  noeol = '\\ No newline at end of file';
  normal = function(line) {
    if (!file) {
      return;
    }
    return current.changes.push({
      type: 'normal',
      normal: true,
      ln1: line !== noeol ? ln_del++ : void 0,
      ln2: line !== noeol ? ln_add++ : void 0,
      content: line
    });
  };
  schema = [[/^diff\s/, start], [/^new file mode \d+$/, new_file], [/^deleted file mode \d+$/, deleted_file], [/^index\s[\da-zA-Z]+\.\.[\da-zA-Z]+(\s(\d+))?$/, index], [/^---\s/, from_file], [/^\+\+\+\s/, to_file], [/^@@\s+\-(\d+),?(\d+)?\s+\+(\d+),?(\d+)?\s@@/, chunk], [/^-/, del], [/^\+/, add]];
  parse = function(line) {
    var i, len, m, p;
    for (i = 0, len = schema.length; i < len; i++) {
      p = schema[i];
      m = line.match(p[0]);
      if (m) {
        p[1](line, m);
        return true;
      }
    }
    return false;
  };
  for (i = 0, len = lines.length; i < len; i++) {
    line = lines[i];
    if (!parse(line)) {
      normal(line);
    }
  }
  return files;
};

parseFile = function(s) {
  var t;
  s = ltrim(s, '-');
  s = ltrim(s, '+');
  s = s.trim();
  t = /\t.*|\d{4}-\d\d-\d\d\s\d\d:\d\d:\d\d(.\d+)?\s(\+|-)\d\d\d\d/.exec(s);
  if (t) {
    s = s.substring(0, t.index).trim();
  }
  if (s.match(/^(a|b)\//)) {
    return s.substr(2);
  } else {
    return s;
  }
};

ltrim = function(s, chars) {
  s = makeString(s);
  if (!chars && trimLeft) {
    return trimLeft.call(s);
  }
  chars = defaultToWhiteSpace(chars);
  return s.replace(new RegExp('^' + chars + '+'), '');
};

makeString = function(s) {
  if (s === null) {
    return '';
  } else {
    return s + '';
  }
};

trimLeft = String.prototype.trimLeft;

defaultToWhiteSpace = function(chars) {
  if (chars === null) {
    return '\\s';
  }
  if (chars.source) {
    return chars.source;
  }
  return '[' + escapeRegExp(chars) + ']';
};

escapeRegExp = function(s) {
  return makeString(s).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
};
