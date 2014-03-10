[![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)
[![Build Status](https://drone.io/github.com/sergeyt/parse-diff/status.png)](https://drone.io/github.com/sergeyt/parse-diff/latest)

[![Deps Status](https://david-dm.org/sergeyt/parse-diff.png)](https://david-dm.org/sergeyt/parse-diff)
[![DevDeps Status](https://david-dm.org/sergeyt/parse-diff/dev-status.png)](https://david-dm.org/sergeyt/parse-diff#info=devDependencies)

# parse-diff

> Unified diff parser for nodejs

[![NPM version](https://badge.fury.io/js/parse-diff.png)](http://badge.fury.io/js/parse-diff)

[![NPM](https://nodei.co/npm/parse-diff.png?downloads=true&stars=true)](https://nodei.co/npm/parse-diff/)

## JavaScript Usage Example

```javascript
var parse = require('parse-diff');
var diff = ''; // input diff string
var files = parse(diff);
console.log(files.length); // number of patched files
files.forEach(function(file) {
	console.log(file.lines.length); // number of hunk/added/deleted lines
	// each line in file.lines is a string
	console.log(file.deletions); // number of deletions in the patch
	console.log(file.additions); // number of additions in the patch
});
```
