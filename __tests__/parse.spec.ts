import assert from "node:assert/strict";
import { describe, it } from "node:test";
import parse from "../index.js";

describe("diff parser", () => {
  it("should parse null", () => {
    assert.strictEqual(parse(null).length, 0);
  });

  it("should parse empty string", () => {
    assert.strictEqual(parse("").length, 0);
  });

  it("should parse whitespace", () => {
    assert.strictEqual(parse(" ").length, 0);
  });

  it("should parse simple git-like diff", () => {
    const diff = `\
diff --git a/file b/file
index 123..456 789
--- a/file
+++ b/file
@@ -1,2 +1,2 @@
- line1
+ line2\
`;
    const files = parse(diff);
    assert.strictEqual(files.length, 1);
    const file = files[0];
    assert.strictEqual(file.from, "file");
    assert.strictEqual(file.to, "file");
    assert.strictEqual(file.oldMode, "789");
    assert.strictEqual(file.newMode, "789");
    assert.strictEqual(file.deletions, 1);
    assert.strictEqual(file.additions, 1);
    assert.strictEqual(file.chunks.length, 1);
    const chunk = file.chunks[0];
    assert.strictEqual(chunk.content, "@@ -1,2 +1,2 @@");
    assert.strictEqual(chunk.changes.length, 2);
    assert.strictEqual(chunk.changes[0].content, "- line1");
    assert.strictEqual(chunk.changes[1].content, "+ line2");
  });

  it("should parse file names when diff.mnemonicPrefix equals true", () => {
    const diff = `\
diff --git i/file w/file
index 123..456 789
--- i/file
+++ w/file
@@ -1,2 +1,2 @@
- line1
+ line2\
`;
    const files = parse(diff);
    assert.strictEqual(files.length, 1);
    const file = files[0];
    assert.strictEqual(file.from, "file");
    assert.strictEqual(file.to, "file");
  });

  it("should parse simple git-like diff with file enclosed by double-quote", () => {
    const diff = `\
diff --git "a/file1" "b/file2"
similarity index 100%
rename from "file1"
rename to "file2"\
`;
    const files = parse(diff);
    assert.strictEqual(files.length, 1);
    const file = files[0];
    assert.strictEqual(file.from, "file1");
    assert.strictEqual(file.to, "file2");
    assert.strictEqual(file.chunks.length, 0);
  });

  it("should parse file names for changed binaries with spaces in their names", () => {
    const diff = `\
diff --git a/Artsy_Tests/ReferenceImages/ARTopMenuViewControllerSpec/selects 'home' by default as ipad@2x.png b/Artsy_Tests/ReferenceImages/ARTopMenuViewControllerSpec/selects 'home' by default as ipad@2x.png
index fc72ba34b..ec373e9a4 100644
Binary files a/Artsy_Tests/ReferenceImages/ARTopMenuViewControllerSpec/selects 'home' by default as ipad@2x.png and b/Artsy_Tests/ReferenceImages/ARTopMenuViewControllerSpec/selects 'home' by default as ipad@2x.png differ\
`;
    const files = parse(diff);
    assert.strictEqual(files.length, 1);
    const file = files[0];
    assert.strictEqual(
      file.from,
      "Artsy_Tests/ReferenceImages/ARTopMenuViewControllerSpec/selects 'home' by default as ipad@2x.png"
    );
    assert.strictEqual(
      file.to,
      "Artsy_Tests/ReferenceImages/ARTopMenuViewControllerSpec/selects 'home' by default as ipad@2x.png"
    );
    assert.strictEqual(file.oldMode, "100644");
    assert.strictEqual(file.newMode, "100644");
  });

  it("should parse diff with new file mode line", () => {
    const diff = `\
diff --git a/test b/test
new file mode 100644
index 0000000..db81be4
--- /dev/null
+++ b/test
@@ -0,0 +1,2 @@
+line1
+line2\
`;
    const files = parse(diff);
    assert.strictEqual(files.length, 1);
    const file = files[0];
    assert.ok(file.new);
    assert.strictEqual(file.newMode, "100644");
    assert.strictEqual(file.from, "/dev/null");
    assert.strictEqual(file.to, "test");
    assert.strictEqual(file.chunks[0].content, "@@ -0,0 +1,2 @@");
    assert.strictEqual(file.chunks[0].changes.length, 2);
    assert.strictEqual(file.chunks[0].changes[0].content, "+line1");
    assert.strictEqual(file.chunks[0].changes[1].content, "+line2");
  });

  it("should parse diff with deleted file mode line", () => {
    const diff = `\
diff --git a/test b/test
deleted file mode 100644
index db81be4..0000000
--- b/test
+++ /dev/null
@@ -1,2 +0,0 @@
-line1
-line2\
`;
    const files = parse(diff);
    assert.strictEqual(files.length, 1);
    const file = files[0];
    assert.ok(file.deleted);
    assert.strictEqual(file.oldMode, "100644");
    assert.strictEqual(file.from, "test");
    assert.strictEqual(file.to, "/dev/null");
    assert.strictEqual(file.chunks[0].content, "@@ -1,2 +0,0 @@");
    assert.strictEqual(file.chunks[0].changes.length, 2);
    assert.strictEqual(file.chunks[0].changes[0].content, "-line1");
    assert.strictEqual(file.chunks[0].changes[1].content, "-line2");
  });

  it("should parse diff with old and new mode lines", () => {
    const diff = `\
diff --git a/file b/file
old mode 100644
new mode 100755
index 123..456
--- a/file
+++ b/file
@@ -1,2 +1,2 @@
- line1
+ line2\
`;
    const files = parse(diff);
    assert.strictEqual(files.length, 1);
    const file = files[0];
    assert.strictEqual(file.oldMode, "100644");
    assert.strictEqual(file.newMode, "100755");
    assert.strictEqual(file.from, "file");
    assert.strictEqual(file.to, "file");
    assert.strictEqual(file.deletions, 1);
    assert.strictEqual(file.additions, 1);
    assert.strictEqual(file.chunks.length, 1);
    const chunk = file.chunks[0];
    assert.strictEqual(chunk.content, "@@ -1,2 +1,2 @@");
    assert.strictEqual(chunk.changes.length, 2);
    assert.strictEqual(chunk.changes[0].content, "- line1");
    assert.strictEqual(chunk.changes[1].content, "+ line2");
  });

  it("should parse diff with single line files", () => {
    const diff = `\
diff --git a/file1 b/file1
deleted file mode 100644
index db81be4..0000000
--- b/file1
+++ /dev/null
@@ -1 +0,0 @@
-line1
diff --git a/file2 b/file2
new file mode 100644
index 0000000..db81be4
--- /dev/null
+++ b/file2
@@ -0,0 +1 @@
+line1\
`;
    const files = parse(diff);
    assert.strictEqual(files.length, 2);
    let file = files[0];
    assert.ok(file.deleted);
    assert.strictEqual(file.oldMode, "100644");
    assert.strictEqual(file.from, "file1");
    assert.strictEqual(file.to, "/dev/null");
    assert.strictEqual(file.chunks[0].content, "@@ -1 +0,0 @@");
    assert.strictEqual(file.chunks[0].changes.length, 1);
    assert.strictEqual(file.chunks[0].changes[0].content, "-line1");
    assert.strictEqual(file.chunks[0].changes[0].type, "del");
    file = files[1];
    assert.ok(file.new);
    assert.strictEqual(file.newMode, "100644");
    assert.strictEqual(file.from, "/dev/null");
    assert.strictEqual(file.to, "file2");
    assert.strictEqual(file.chunks[0].content, "@@ -0,0 +1 @@");
    assert.strictEqual(file.chunks[0].oldStart, 0);
    assert.strictEqual(file.chunks[0].oldLines, 0);
    assert.strictEqual(file.chunks[0].newStart, 1);
    assert.strictEqual(file.chunks[0].newLines, 1);
    assert.strictEqual(file.chunks[0].changes.length, 1);
    assert.strictEqual(file.chunks[0].changes[0].content, "+line1");
    assert.strictEqual(file.chunks[0].changes[0].type, "add");
  });

  it("should parse multiple files in diff", () => {
    const diff = `\
diff --git a/file1 b/file1
index 123..456 789
--- a/file1
+++ b/file1
@@ -1,1 +1,1 @@
- line1
+ line2
diff --git a/file2 b/file2
index 123..456 789
--- a/file2
+++ b/file2
@@ -1,1 +1,1 @@
- line1
+ line2\
`;
    const files = parse(diff);
    assert.strictEqual(files.length, 2);
    let file = files[0];
    assert.strictEqual(file.from, "file1");
    assert.strictEqual(file.to, "file1");
    assert.strictEqual(file.oldMode, "789");
    assert.strictEqual(file.newMode, "789");
    assert.strictEqual(file.chunks[0].content, "@@ -1,1 +1,1 @@");
    assert.strictEqual(file.chunks[0].changes.length, 2);
    assert.strictEqual(file.chunks[0].changes[0].content, "- line1");
    assert.strictEqual(file.chunks[0].changes[1].content, "+ line2");
    file = files[1];
    assert.strictEqual(file.from, "file2");
    assert.strictEqual(file.to, "file2");
    assert.strictEqual(file.oldMode, "789");
    assert.strictEqual(file.newMode, "789");
    assert.strictEqual(file.chunks[0].content, "@@ -1,1 +1,1 @@");
    assert.strictEqual(file.chunks[0].changes.length, 2);
    assert.strictEqual(file.chunks[0].changes[0].content, "- line1");
    assert.strictEqual(file.chunks[0].changes[1].content, "+ line2");
  });

  it("should parse diff with EOF flag", () => {
    const diff = `\
diff --git a/file1 b/file1
index 123..456 789
--- a/file1
+++ b/file1
@@ -1,1 +1,1 @@
- line1
\\ No newline at end of file
+ line2
\\ No newline at end of file
`;
    const files = parse(diff);
    assert.strictEqual(files.length, 1);
    const file = files[0];
    assert.strictEqual(file.from, "file1");
    assert.strictEqual(file.to, "file1");
    assert.strictEqual(file.oldMode, "789");
    assert.strictEqual(file.newMode, "789");
    const chunk = file.chunks[0];
    assert.strictEqual(chunk.content, "@@ -1,1 +1,1 @@");
    assert.strictEqual(chunk.changes.length, 4);
    assert.strictEqual(chunk.changes[0].content, "- line1");
    assert.strictEqual(chunk.changes[1].type, "del");
    assert.strictEqual(
      chunk.changes[1].content,
      "\\ No newline at end of file"
    );
    assert.strictEqual(chunk.changes[2].content, "+ line2");
    assert.strictEqual(chunk.changes[3].type, "add");
    assert.strictEqual(
      chunk.changes[3].content,
      "\\ No newline at end of file"
    );
  });

  it("should parse gnu sample diff", () => {
    const diff = `\
--- lao	2002-02-21 23:30:39.942229878 -0800
+++ tzu	2002-02-21 23:30:50.442260588 -0800
@@ -1,7 +1,6 @@
-The Way that can be told of is not the eternal Way;
-The name that can be named is not the eternal name.
 The Nameless is the origin of Heaven and Earth;
-The Named is the mother of all things.
+The named is the mother of all things.
+
 Therefore let there always be non-being,
	so we may see their subtlety,
 And let there always be being,
@@ -9,3 +8,6 @@
 The two are the same,
 But after they are produced,
	they have different names.
+They both may be called deep and profound.
+Deeper and more profound,
+The door of all subtleties!\
`;
    const files = parse(diff);
    assert.strictEqual(files.length, 1);
    const file = files[0];
    assert.strictEqual(file.from, "lao");
    assert.strictEqual(file.to, "tzu");
    assert.strictEqual(file.chunks.length, 2);
    const chunk0 = file.chunks[0];
    assert.strictEqual(chunk0.oldStart, 1);
    assert.strictEqual(chunk0.oldLines, 7);
    assert.strictEqual(chunk0.newStart, 1);
    assert.strictEqual(chunk0.newLines, 6);
    const chunk1 = file.chunks[1];
    assert.strictEqual(chunk1.oldStart, 9);
    assert.strictEqual(chunk1.oldLines, 3);
    assert.strictEqual(chunk1.newStart, 8);
    assert.strictEqual(chunk1.newLines, 6);
  });

  it("should parse hg diff output", () => {
    const diff = `\
diff -r 514fc757521e lib/parsers.coffee
--- a/lib/parsers.coffee	Thu Jul 09 00:56:36 2015 +0200
+++ b/lib/parsers.coffee	Fri Jul 10 16:23:43 2015 +0200
@@ -43,6 +43,9 @@
             files[file] = { added: added, deleted: deleted }
         files

+    diff: (out) ->
+        files = {}
+
 module.exports = Parsers

 module.exports.version = (out) ->\
`;
    const files = parse(diff);
    assert.strictEqual(files.length, 1);
    const file = files[0];
    assert.strictEqual(file.chunks[0].content, "@@ -43,6 +43,9 @@");
    assert.strictEqual(file.from, "lib/parsers.coffee");
    assert.strictEqual(file.to, "lib/parsers.coffee");
  });

  it("should parse svn diff output", () => {
    const diff = `\
Index: new.txt
===================================================================
--- new.txt	(revision 0)
+++ new.txt	(working copy)
@@ -0,0 +1 @@
+test
Index: text.txt
===================================================================
--- text.txt	(revision 6)
+++ text.txt	(working copy)
@@ -1,7 +1,5 @@
-This part of the
-document has stayed the
-same from version to
-version.  It shouldn't
+This is an important
+notice! It shouldn't
 be shown if it doesn't
 change.  Otherwise, that
 would not be helping to\
`;
    const files = parse(diff);
    assert.strictEqual(files.length, 2);
    const file = files[0];
    assert.strictEqual(file.from, "new.txt");
    assert.strictEqual(file.to, "new.txt");
    assert.strictEqual(file.chunks[0].changes.length, 1);
  });

  it("should parse GitHub API patch diff when listing files of a pull request", () => {
    const diff = `@@ -1 +1 @@
-hello world
+hello universe`;

    const files = parse(diff);
    assert.strictEqual(files.length, 1);
    const [file] = files;
    assert.strictEqual(file.chunks[0].content, "@@ -1 +1 @@");
    assert.strictEqual(file.from, undefined);
    assert.strictEqual(file.to, undefined);
    assert.strictEqual(file.oldMode, undefined);
    assert.strictEqual(file.newMode, undefined);
    assert.strictEqual(file.deletions, 1);
    assert.strictEqual(file.additions, 1);
    assert.strictEqual(file.chunks[0].oldStart, 1);
    assert.strictEqual(file.chunks[0].oldLines, 1);
    assert.strictEqual(file.chunks[0].newStart, 1);
    assert.strictEqual(file.chunks[0].newLines, 1);
    assert.strictEqual(file.chunks[0].changes.length, 2);
  });

  it("should parse file names for n new empty file", () => {
    const diff = `\
diff --git a/newFile.txt b/newFile.txt
new file mode 100644
index 0000000..e6a2e28\
`;
    const files = parse(diff);
    assert.strictEqual(files.length, 1);
    const file = files[0];
    assert.strictEqual(file.from, "/dev/null");
    assert.strictEqual(file.to, "newFile.txt");
    assert.strictEqual(file.newMode, "100644");
  });

  it("should parse file names for a deleted file", () => {
    const diff = `\
diff --git a/deletedFile.txt b/deletedFile.txt
deleted file mode 100644
index e6a2e28..0000000\
`;
    const files = parse(diff);
    assert.strictEqual(files.length, 1);
    const file = files[0];
    assert.strictEqual(file.from, "deletedFile.txt");
    assert.strictEqual(file.to, "/dev/null");
    assert.strictEqual(file.oldMode, "100644");
  });

  it("should parse rename diff with space in path with no changes", () => {
    const diff = `\
diff --git a/My Folder/File b/My Folder/a/File
similarity index 100%
rename from a/My Folder/File
rename to My Folder/a/File\
`;
    const files = parse(diff);
    assert.strictEqual(files.length, 1);
    const file = files[0];
    assert.strictEqual(file.from, "My Folder/File");
    assert.strictEqual(file.to, "My Folder/a/File");
    assert.strictEqual(file.chunks.length, 0);
  });

  it("should parse rename diff with space in path with changes", () => {
    const diff = `\
diff --git a/My Folder/File b/My Folder/a/File
similarity index 100%
rename from a/My Folder/File
rename to My Folder/a/File
@@ -1,2 +1,2 @@
- line1
+ line2\
`;
    const files = parse(diff);
    assert.strictEqual(files.length, 1);
    const file = files[0];
    assert.strictEqual(file.from, "My Folder/File");
    assert.strictEqual(file.to, "My Folder/a/File");
    assert.strictEqual(file.chunks.length, 1);
    const chunk = file.chunks[0];
    assert.strictEqual(chunk.content, "@@ -1,2 +1,2 @@");
    assert.strictEqual(chunk.changes.length, 2);
    assert.strictEqual(chunk.changes[0].content, "- line1");
    assert.strictEqual(chunk.changes[1].content, "+ line2");
  });

  it("should parse diff with single line quote escaped file names", () => {
    const diff = `
diff --git "a/file \\"space\\"" "b/file \\"space\\""
index 9daeafb..88bd214 100644
--- "a/file \\"space\\""  
+++ "b/file \\"space\\""  
@@ -1 +1 @@
-test
+test\n1234
`;
    const files = parse(diff);
    assert.strictEqual(files.length, 1);
    const [file] = files;
    assert.strictEqual(file.from, `file \\"space\\"`);
    assert.strictEqual(file.to, `file \\"space\\"`);
    assert.strictEqual(file.oldMode, "100644");
    assert.strictEqual(file.newMode, "100644");
  });

  it("should parse files with additional '-' and '+'", () => {
    const diff = `\
diff --git a/file1 b/file1
index 123..456 789
--- a/file1
+++ b/file1
@@ -1,2 +1,1 @@
- line11
--- line12
+ line21
diff --git a/file2 b/file2
index 123..456 789
--- a/file2
+++ b/file2
@@ -1,2 +1,1 @@
- line11
+++ line21
+ line22\
`;
    const files = parse(diff);
    assert.strictEqual(files.length, 2);
    const [file1, file2] = files;

    assert.strictEqual(file1.from, `file1`);
    assert.strictEqual(file1.to, `file1`);
    assert.strictEqual(file1.oldMode, "789");
    assert.strictEqual(file1.newMode, "789");
    assert.strictEqual(file1.chunks[0].changes.length, 3);

    assert.strictEqual(file2.from, `file2`);
    assert.strictEqual(file2.to, `file2`);
    assert.strictEqual(file2.oldMode, "789");
    assert.strictEqual(file2.newMode, "789");
    assert.strictEqual(file2.chunks[0].changes.length, 3);
  });

  describe("empty context lines (suppressBlankEmpty)", () => {
    it("should parse empty context line between del and add", () => {
      // Simulates diff.suppressBlankEmpty=true: blank context line has no leading space
      const diff = `\
diff --git a/file b/file
index 123..456 789
--- a/file
+++ b/file
@@ -1,3 +1,3 @@
-old line
+new line

 keep this\
`;
      const files = parse(diff);
      assert.strictEqual(files.length, 1);
      const chunk = files[0].chunks[0];
      assert.strictEqual(chunk.changes.length, 4);
      assert.strictEqual(chunk.changes[0].type, "del");
      assert.strictEqual(chunk.changes[1].type, "add");
      assert.strictEqual(chunk.changes[2].type, "normal");
      assert.strictEqual(chunk.changes[2].content, "");
      assert.strictEqual((chunk.changes[2] as parse.NormalChange).ln1, 2);
      assert.strictEqual((chunk.changes[2] as parse.NormalChange).ln2, 2);
      assert.strictEqual(chunk.changes[3].type, "normal");
      assert.strictEqual(chunk.changes[3].content, " keep this");
    });

    it("should parse empty context line at start of hunk", () => {
      const diff = `\
diff --git a/file b/file
index 123..456 789
--- a/file
+++ b/file
@@ -1,2 +1,2 @@

-old
+new\
`;
      const files = parse(diff);
      assert.strictEqual(files.length, 1);
      const chunk = files[0].chunks[0];
      assert.strictEqual(chunk.changes.length, 3);
      assert.strictEqual(chunk.changes[0].type, "normal");
      assert.strictEqual(chunk.changes[0].content, "");
      assert.strictEqual(chunk.changes[1].type, "del");
      assert.strictEqual(chunk.changes[2].type, "add");
    });

    it("should parse empty context line at end of hunk", () => {
      const diff = `\
diff --git a/file b/file
index 123..456 789
--- a/file
+++ b/file
@@ -1,2 +1,2 @@
-old
+new
\
`;
      const files = parse(diff);
      assert.strictEqual(files.length, 1);
      const chunk = files[0].chunks[0];
      assert.strictEqual(chunk.changes.length, 3);
      assert.strictEqual(chunk.changes[0].type, "del");
      assert.strictEqual(chunk.changes[1].type, "add");
      assert.strictEqual(chunk.changes[2].type, "normal");
      assert.strictEqual(chunk.changes[2].content, "");
    });

    it("should parse multiple consecutive empty context lines", () => {
      const diff = `\
diff --git a/file b/file
index 123..456 789
--- a/file
+++ b/file
@@ -1,4 +1,4 @@
-old
+new


 keep\
`;
      const files = parse(diff);
      assert.strictEqual(files.length, 1);
      const chunk = files[0].chunks[0];
      assert.strictEqual(chunk.changes.length, 5);
      assert.strictEqual(chunk.changes[0].type, "del");
      assert.strictEqual(chunk.changes[1].type, "add");
      assert.strictEqual(chunk.changes[2].type, "normal");
      assert.strictEqual(chunk.changes[2].content, "");
      assert.strictEqual(chunk.changes[3].type, "normal");
      assert.strictEqual(chunk.changes[3].content, "");
      assert.strictEqual(chunk.changes[4].type, "normal");
    });

    it("should not lose second hunk when first has empty context line", () => {
      const diff = `\
diff --git a/file b/file
index 123..456 789
--- a/file
+++ b/file
@@ -1,2 +1,2 @@
-old1
+new1

@@ -10,1 +10,1 @@
-old2
+new2\
`;
      const files = parse(diff);
      assert.strictEqual(files.length, 1);
      assert.strictEqual(files[0].chunks.length, 2);
      const chunk0 = files[0].chunks[0];
      assert.strictEqual(chunk0.changes.length, 3);
      assert.strictEqual(chunk0.changes[2].type, "normal");
      assert.strictEqual(chunk0.changes[2].content, "");
      const chunk1 = files[0].chunks[1];
      assert.strictEqual(chunk1.oldStart, 10);
      assert.strictEqual(chunk1.changes.length, 2);
      assert.strictEqual(chunk1.changes[0].type, "del");
      assert.strictEqual(chunk1.changes[1].type, "add");
    });

    it("should not lose second file when first has empty context line", () => {
      const diff = `\
diff --git a/file1 b/file1
index 123..456 789
--- a/file1
+++ b/file1
@@ -1,2 +1,2 @@
-old
+new

diff --git a/file2 b/file2
index 123..456 789
--- a/file2
+++ b/file2
@@ -1,1 +1,1 @@
-old2
+new2\
`;
      const files = parse(diff);
      assert.strictEqual(files.length, 2);
      assert.strictEqual(files[0].from, "file1");
      assert.strictEqual(files[0].chunks[0].changes.length, 3);
      assert.strictEqual(files[1].from, "file2");
      assert.strictEqual(files[1].chunks[0].changes.length, 2);
    });

    it("should still parse normal context lines with leading space", () => {
      // Regression guard: standard context lines (with leading space) must still work
      const diff = `\
diff --git a/file b/file
index 123..456 789
--- a/file
+++ b/file
@@ -1,3 +1,3 @@
 context before
-old
+new
 context after\
`;
      const files = parse(diff);
      assert.strictEqual(files.length, 1);
      const chunk = files[0].chunks[0];
      assert.strictEqual(chunk.changes.length, 4);
      assert.strictEqual(chunk.changes[0].type, "normal");
      assert.strictEqual(chunk.changes[0].content, " context before");
      assert.strictEqual(chunk.changes[1].type, "del");
      assert.strictEqual(chunk.changes[2].type, "add");
      assert.strictEqual(chunk.changes[3].type, "normal");
      assert.strictEqual(chunk.changes[3].content, " context after");
    });
  });

  describe("hunk header parsing", () => {
    it("should parse hunk header ranges with and without line counts", () => {
      const cases = [
        ["@@ -1,2 +3,4 @@", [1, 2, 3, 4]],
        ["@@ -1 +1 @@", [1, 1, 1, 1]],
        ["@@ -5 +5,2 @@", [5, 1, 5, 2]],
        ["@@ -12,3 +34 @@", [12, 3, 34, 1]],
      ];
      for (const [header, [oldStart, oldLines, newStart, newLines]] of cases) {
        const [chunk] = parse(`--- a/file\n+++ b/file\n${header}\n`)[0].chunks;
        assert.partialDeepStrictEqual(chunk, {
          content: header,
          oldStart,
          oldLines,
          newStart,
          newLines,
        });
      }
    });

    it("should not hang on a malformed hunk header (ReDoS)", () => {
      // The old pattern backtracked cubically on long digit runs when the
      // closing " @@" was missing (~4 KB took ~20 s).
      const digits = "0".repeat(5000);
      const start = Date.now();
      const files = parse(`@@ -${digits} +${digits}`);
      assert.ok(Date.now() - start < 500);
      assert.deepStrictEqual(
        files.flatMap((file) => file.chunks),
        []
      );
    });
  });
});
