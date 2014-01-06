_ = require 'underscore'
_.str = require 'underscore.string'

# parses unified diff
# http://www.gnu.org/software/diffutils/manual/diffutils.html#Unified-Format
module.exports = (input) ->
	return [] if not input

	files = []
	file = null
	lines = input.split '\n'

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

	hunk = (l) ->
		file.lines.push l

	del = (l) ->
		file.lines.push l
		file.deletions++

	add = (l) ->
		file.lines.push l
		file.additions++

	# todo end of line
	other = (l) ->
		return if not file
		file.lines.push l

	schema = [
		[/^diff\s/, start],
		[/^index\s/, index],
		[/^---\s/, from_file]
		[/^\+\+\+\s/, to_file]
		# todo better hunk regexp
		[/^@@\s.+\s@@$/, hunk],
		[/^-/, del],
		[/^\+/, add]
	]

	for l in lines
		l = l.trim()
		if not l then continue
		m = _.find schema, (x) -> l.match(x[0])
		if m then m[1](l) else other(l)

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
