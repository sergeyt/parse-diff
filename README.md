[![Build Status](https://github.com/sergeyt/parse-diff/actions/workflows/ci.yml/badge.svg)](https://github.com/sergeyt/parse-diff/actions/workflows/ci.yml)
[![Total downloads](https://img.shields.io/npm/dt/parse-diff.svg)](https://www.npmjs.com/package/parse-diff)

[![NPM](https://nodei.co/npm/parse-diff.png?downloads=true&stars=true)](https://nodei.co/npm/parse-diff/)

# parse-diff

Simple unified diff parser for JavaScript and TypeScript

## TypeScript Usage Example

```typescript
import parse from "parse-diff";

const diff = ""; // input diff string
const files = parse(diff);
console.log(files.length); // number of patched files
for (const file of files) {
  console.log(file.chunks.length); // number of hunks
  console.log(file.chunks[0].changes.length); // hunk added/deleted/context lines
  // each item in changes is an object; its text is in `content`
  console.log(file.deletions); // number of deletions in the patch
  console.log(file.additions); // number of additions in the patch
}
```

Types are bundled with the package. Use `import parse = require("parse-diff")`
if your `tsconfig.json` has neither `esModuleInterop` nor
`allowSyntheticDefaultImports` enabled. In plain CommonJS JavaScript, use
`const parse = require("parse-diff")`.
