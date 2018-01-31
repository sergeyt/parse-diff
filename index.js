// parses unified diff
// http://www.gnu.org/software/diffutils/manual/diffutils.html#Unified-Format
  var add, chunk, current, del, deleted_file, eof, file, files, from_file, index, j, len, line, lines, ln_add, ln_del, new_file, normal, parse, restart, schema, start, to_file;
    file.new = true;
      oldStart,
      oldLines,
      newStart,
      newLines
      ln1: ln_del++,
      ln2: ln_add++,
      content: line
    });
  };
  eof = function(line) {
    var recentChange, ref;
    ref = current.changes, recentChange = ref[ref.length - 1];
    return current.changes.push({
      type: recentChange.type,
      [`${recentChange.type}`]: true,
      ln1: recentChange.ln1,
      ln2: recentChange.ln2,
      ln: recentChange.ln,
  // todo beter regexp to avoid detect normal line starting with diff
  schema = [[/^\s+/, normal], [/^diff\s/, start], [/^new file mode \d+$/, new_file], [/^deleted file mode \d+$/, deleted_file], [/^index\s[\da-zA-Z]+\.\.[\da-zA-Z]+(\s(\d+))?$/, index], [/^---\s/, from_file], [/^\+\+\+\s/, to_file], [/^@@\s+\-(\d+),?(\d+)?\s+\+(\d+),?(\d+)?\s@@/, chunk], [/^-/, del], [/^\+/, add], [/^\\ No newline at end of file$/, eof]];
// fallback function to overwrite file.from and file.to if executed
  // ignore possible time stamp
  // ignore git prefixes a/ or b/