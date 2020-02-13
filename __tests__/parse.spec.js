const parse = require("../index");

describe("diff parser", function() {
  it("should parse null", () => {
    expect(parse(null).length).toBe(0);
  });

  it("should parse empty string", () => {
    expect(parse("").length).toBe(0);
  });

  it("should parse whitespace", () => {
    expect(parse(" ").length).toBe(0);
  });

  it("should parse simple git-like diff", function() {
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
    expect(files.length).toBe(1);
    const file = files[0];
    expect(file.from).toBe("file");
    expect(file.to).toBe("file");
    expect(file.chunks.length).toBe(1);
    const chunk = file.chunks[0];
    expect(chunk.content).toBe("@@ -1,2 +1,2 @@");
    expect(chunk.changes.length).toBe(2);
    expect(chunk.changes[0].content).toBe("- line1");
    expect(chunk.changes[1].content).toBe("+ line2");
  });

  it("should parse simple git-like diff with file enclosed by double-quote", function() {
    const diff = `\
diff --git "a/file1" "b/file2"
similarity index 100%
rename from "file1"
rename to "file2"\
`;
    const files = parse(diff);
    expect(files.length).toBe(1);
    const file = files[0];
    expect(file.from).toBe("file1");
    expect(file.to).toBe("file2");
    expect(file.chunks.length).toBe(0);
  });

  it('should parse file names for changed binaries with spaces in their names', function() {
    const diff = `\
diff --git a/Artsy_Tests/ReferenceImages/ARTopMenuViewControllerSpec/selects 'home' by default as ipad@2x.png b/Artsy_Tests/ReferenceImages/ARTopMenuViewControllerSpec/selects 'home' by default as ipad@2x.png
index fc72ba34b..ec373e9a4 100644
Binary files a/Artsy_Tests/ReferenceImages/ARTopMenuViewControllerSpec/selects 'home' by default as ipad@2x.png and b/Artsy_Tests/ReferenceImages/ARTopMenuViewControllerSpec/selects 'home' by default as ipad@2x.png differ\
`;
    const files = parse(diff);
    expect(files.length).toBe(1)
    const file = files[0]
    expect(file.from).toBe("Artsy_Tests/ReferenceImages/ARTopMenuViewControllerSpec/selects 'home' by default as ipad@2x.png")
    expect(file.to).toBe("Artsy_Tests/ReferenceImages/ARTopMenuViewControllerSpec/selects 'home' by default as ipad@2x.png")
  });

  it("should parse diff with new file mode line", function() {
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
    expect(files.length).toBe(1);
    const file = files[0];
    expect(file.new).toBeTruthy();
    expect(file.from).toBe("/dev/null");
    expect(file.to).toBe("test");
    expect(file.chunks[0].content).toBe("@@ -0,0 +1,2 @@");
    expect(file.chunks[0].changes.length).toBe(2);
    expect(file.chunks[0].changes[0].content).toBe("+line1");
    expect(file.chunks[0].changes[1].content).toBe("+line2");
  });

  it("should parse diff with deleted file mode line", function() {
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
    expect(files.length).toBe(1);
    const file = files[0];
    expect(file.deleted).toBeTruthy();
    expect(file.from).toBe("test");
    expect(file.to).toBe("/dev/null");
    expect(file.chunks[0].content).toBe("@@ -1,2 +0,0 @@");
    expect(file.chunks[0].changes.length).toBe(2);
    expect(file.chunks[0].changes[0].content).toBe("-line1");
    expect(file.chunks[0].changes[1].content).toBe("-line2");
  });

  it("should parse diff with single line files", function() {
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
    expect(files.length).toBe(2);
    let file = files[0];
    expect(file.deleted).toBeTruthy();
    expect(file.from).toBe("file1");
    expect(file.to).toBe("/dev/null");
    expect(file.chunks[0].content).toBe("@@ -1 +0,0 @@");
    expect(file.chunks[0].changes.length).toBe(1);
    expect(file.chunks[0].changes[0].content).toBe("-line1");
    expect(file.chunks[0].changes[0].type).toBe("del");
    file = files[1];
    expect(file.new).toBeTruthy();
    expect(file.from).toBe("/dev/null");
    expect(file.to).toBe("file2");
    expect(file.chunks[0].content).toBe("@@ -0,0 +1 @@");
    expect(file.chunks[0].oldStart).toBe(0);
    expect(file.chunks[0].oldLines).toBe(0);
    expect(file.chunks[0].newStart).toBe(1);
    expect(file.chunks[0].newLines).toBe(1);
    expect(file.chunks[0].changes.length).toBe(1);
    expect(file.chunks[0].changes[0].content).toBe("+line1");
    expect(file.chunks[0].changes[0].type).toBe("add");
  });

  it("should parse multiple files in diff", function() {
    const diff = `\
diff --git a/file1 b/file1
index 123..456 789
--- a/file1
+++ b/file1
@@ -1,2 +1,2 @@
- line1
+ line2
diff --git a/file2 b/file2
index 123..456 789
--- a/file2
+++ b/file2
@@ -1,3 +1,3 @@
- line1
+ line2\
`;
    const files = parse(diff);
    expect(files.length).toBe(2);
    let file = files[0];
    expect(file.from).toBe("file1");
    expect(file.to).toBe("file1");
    expect(file.chunks[0].content).toBe("@@ -1,2 +1,2 @@");
    expect(file.chunks[0].changes.length).toBe(2);
    expect(file.chunks[0].changes[0].content).toBe("- line1");
    expect(file.chunks[0].changes[1].content).toBe("+ line2");
    file = files[1];
    expect(file.from).toBe("file2");
    expect(file.to).toBe("file2");
    expect(file.chunks[0].content).toBe("@@ -1,3 +1,3 @@");
    expect(file.chunks[0].changes.length).toBe(2);
    expect(file.chunks[0].changes[0].content).toBe("- line1");
    expect(file.chunks[0].changes[1].content).toBe("+ line2");
  });

  it("should parse diff with EOF flag", function() {
    const diff = `\
diff --git a/file1 b/file1
index 123..456 789
--- a/file1
+++ b/file1
@@ -1,2 +1,2 @@
- line1
+ line2
\\ No newline at end of file\
`;
    const files = parse(diff);
    expect(files.length).toBe(1);
    const file = files[0];
    expect(file.from).toBe("file1");
    expect(file.to).toBe("file1");
    const chunk = file.chunks[0];
    expect(chunk.content).toBe("@@ -1,2 +1,2 @@");
    expect(chunk.changes.length).toBe(3);
    expect(chunk.changes[0].content).toBe("- line1");
    expect(chunk.changes[1].content).toBe("+ line2");
    expect(chunk.changes[2].type).toBe("add");
    expect(chunk.changes[2].content).toBe("\\ No newline at end of file");
  });

  it("should parse gnu sample diff", function() {
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
    expect(files.length).toBe(1);
    const file = files[0];
    expect(file.from).toBe("lao");
    expect(file.to).toBe("tzu");
    expect(file.chunks.length).toBe(2);
    const chunk0 = file.chunks[0];
    expect(chunk0.oldStart).toBe(1);
    expect(chunk0.oldLines).toBe(7);
    expect(chunk0.newStart).toBe(1);
    expect(chunk0.newLines).toBe(6);
    const chunk1 = file.chunks[1];
    expect(chunk1.oldStart).toBe(9);
    expect(chunk1.oldLines).toBe(3);
    expect(chunk1.newStart).toBe(8);
    expect(chunk1.newLines).toBe(6);
  });

  it("should parse hg diff output", function() {
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
    expect(files.length).toBe(1);
    const file = files[0];
    expect(file.chunks[0].content).toBe("@@ -43,6 +43,9 @@");
    expect(file.from).toBe("lib/parsers.coffee");
    expect(file.to).toBe("lib/parsers.coffee");
  });

  it("should parse svn diff output", function() {
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
    expect(files.length).toBe(2);
    const file = files[0];
    expect(file.from).toBe("new.txt");
    expect(file.to).toBe("new.txt");
    expect(file.chunks[0].changes.length).toBe(1);
  });

  it("should parse file names for n new empty file", function() {
    const diff = `\
diff --git a/newFile.txt b/newFile.txt
new file mode 100644
index 0000000..e6a2e28\
`;
    const files = parse(diff);
    expect(files.length).toBe(1);
    const file = files[0];
    expect(file.from).toBe("/dev/null");
    expect(file.to).toBe("newFile.txt");
  });

  it("should parse file names for a deleted file", function() {
    const diff = `\
diff --git a/deletedFile.txt b/deletedFile.txt
deleted file mode 100644
index e6a2e28..0000000\
`;
    const files = parse(diff);
    expect(files.length).toBe(1);
    const file = files[0];
    expect(file.from).toBe("deletedFile.txt");
    expect(file.to).toBe("/dev/null");
  });

  it("should parse rename diff with space in path with no changes", function() {
    const diff = `\
diff --git a/My Folder/File b/My Folder/a/File
similarity index 100%
rename from a/My Folder/File
rename to My Folder/a/File\
`;
    const files = parse(diff);
    expect(files.length).toBe(1);
    const file = files[0];
    expect(file.from).toBe("My Folder/File");
    expect(file.to).toBe("My Folder/a/File");
    expect(file.chunks.length).toBe(0);
  });

  it("should parse rename diff with space in path with changes", function() {
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
    expect(files.length).toBe(1);
    const file = files[0];
    expect(file.from).toBe("My Folder/File");
    expect(file.to).toBe("My Folder/a/File");
    expect(file.chunks.length).toBe(1);
    const chunk = file.chunks[0];
    expect(chunk.content).toBe("@@ -1,2 +1,2 @@");
    expect(chunk.changes.length).toBe(2);
    expect(chunk.changes[0].content).toBe("- line1");
    expect(chunk.changes[1].content).toBe("+ line2");
  });
});
