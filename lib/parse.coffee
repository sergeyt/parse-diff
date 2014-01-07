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
			deletions: 0
			additions: 0
		files.push file

	restart = ->
		start() if not file || file.lines.length

	index = (l) ->
		restart()
		file.index = l.split(' ').slice(1)

	from_file = (l) ->
		restart()
		file.from = parseFile l

	to_file = (l) ->
		restart()
		file.to = parseFile l

	chunk = (l, m) ->
		ln_del = +m[1]
		ln_add = +m[3]
		file.lines.push {type:'chunk', chunk:true, content:l}

	del = (l) ->
		file.lines.push {type:'del', del:true, ln:ln_del++, content:l}
		file.deletions++

	add = (l) ->
		file.lines.push {type:'add', add:true, ln:ln_add++, content:l}
		file.additions++

	# todo end of line
	normal = (l) ->
		return if not file
		file.lines.push {
			type: 'normal'
			normal: true
			ln1: ln_del++
			ln2: ln_add++
			content: l
		}

	schema = [
		[/^diff\s/, start],
		[/^index\s/, index],
		[/^---\s/, from_file]
		[/^\+\+\+\s/, to_file]
		[/^@@\s+\-(\d+),(\d+)\s+\+(\d+),(\d+)\s@@$/, chunk],
		[/^-/, del],
		[/^\+/, add]
	]

	parse = (l) ->
		for p in schema
			m = l.match p[0]
			if m
				p[1](l, m)
				return true
		return false

	for l in lines
		normal(l) if not parse l

	return files

parseFile = (s) ->
	s = _.str.ltrim s, '-'
	s = _.str.ltrim s, '+'
	s = s.trim()
	# ignore possible time stamp
	t = (/\d{4}-\d\d-\d\d\s\d\d:\d\d:\d\d(.\d+)?\s(\+|-)\d\d\d\d/).exec(s)
	s = s.substring(0, t.index).trim() if t
	# ignore git prefixes a/ or b/
	if s.match (/^(a|b)\//) then s.substr(2) else s
