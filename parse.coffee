_ = require 'underscore'
_.str = require 'underscore.string'

# parses unified diff
# http://www.gnu.org/software/diffutils/manual/diffutils.html#Unified-Format
module.exports = (input) ->
	return [] if not input
	return [] if input.match /^\s+$/

	lines = input.split '\n'
	return [] if lines.length == 0

	files = []
	file = null
	ln_del = 0
	ln_add = 0

	start = ->
		file =
			lines: []
			chunks: []
			deletions: 0
			additions: 0
		files.push file

	restart = ->
		start() if not file || file.lines.length

	new_file = ->
		restart()
		file.new = true

	deleted_file = ->
		restart()
		file.deleted = true

	index = (line) ->
		restart()
		file.index = line.split(' ').slice(1)

	from_file = (line) ->
		restart()
		file.from = parseFile line

	to_file = (line) ->
		restart()
		file.to = parseFile line

	chunk = (line, match) ->
		ln_del = oldStart = +match[1]
		oldLines = +(match[2] || 0)
		ln_add = newStart = +match[3]
		newLines = +(match[4] || 0)
		newChunk = {
			type:'chunk', chunk:true, content:line,
			oldStart, oldLines, newStart, newLines
		}
		file.lines.push newChunk
		file.chunks.push newChunk

	del = (line) ->
		file.lines.push {type:'del', del:true, ln:ln_del++, content:line}
		file.deletions++

	add = (line) ->
		file.lines.push {type:'add', add:true, ln:ln_add++, content:line}
		file.additions++

	noeol = '\\ No newline at end of file'
	normal = (line) ->
		return if not file
		file.lines.push {
			type: 'normal'
			normal: true
			ln1: ln_del++ unless line is noeol
			ln2: ln_add++ unless line is noeol
			content: line
		}

	schema = [
		# todo beter regexp to avoid detect normal line starting with diff
		[/^diff\s/, start],
		[/^new file mode \d+$/, new_file],
		[/^deleted file mode \d+$/, deleted_file],
		[/^index\s[\da-zA-Z]+\.\.[\da-zA-Z]+(\s(\d+))?$/, index],
		[/^---\s/, from_file]
		[/^\+\+\+\s/, to_file]
		[/^@@\s+\-(\d+),?(\d+)?\s+\+(\d+),?(\d+)?\s@@/, chunk],
		[/^-/, del],
		[/^\+/, add]
	]

	parse = (line) ->
		for p in schema
			m = line.match p[0]
			if m
				p[1](line, m)
				return true
		return false

	for line in lines
		normal(line) unless parse line

	return files

parseFile = (s) ->
	s = _.str.ltrim s, '-'
	s = _.str.ltrim s, '+'
	s = s.trim()
	# ignore possible time stamp
	t = (/\t.*|\d{4}-\d\d-\d\d\s\d\d:\d\d:\d\d(.\d+)?\s(\+|-)\d\d\d\d/).exec(s)
	s = s.substring(0, t.index).trim() if t
	# ignore git prefixes a/ or b/
	if s.match (/^(a|b)\//) then s.substr(2) else s
