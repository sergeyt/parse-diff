type Handler = (line: string, match: RegExpMatchArray) => void;

namespace parse {
  export interface File {
    chunks: Chunk[];
    deletions: number;
    additions: number;
    from?: string;
    to?: string;
    oldMode?: string;
    newMode?: string;
    index?: string[];
    deleted?: true;
    new?: true;
  }

  export interface Chunk {
    content: string;
    changes: Change[];
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
  }

  export interface NormalChange {
    type: "normal";
    ln1: number;
    ln2: number;
    normal: true;
    content: string;
  }

  export interface AddChange {
    type: "add";
    add: true;
    ln: number;
    content: string;
  }

  export interface DeleteChange {
    type: "del";
    del: true;
    ln: number;
    content: string;
  }

  export type ChangeType = "normal" | "add" | "del";

  export type Change = NormalChange | AddChange | DeleteChange;
}

const parse = (input?: string | null): parse.File[] => {
  if (!input) return [];
  if (typeof input !== "string" || input.match(/^\s+$/)) return [];

  const lines = input.split("\n");
  if (lines.length === 0) return [];

  const files: parse.File[] = [];
  let currentFile: parse.File | null = null;
  let currentChunk: parse.Chunk | null = null;
  let deletedLineCounter = 0;
  let addedLineCounter = 0;
  let currentFileChanges: { oldLines: number; newLines: number } | null = null;

  const normal: Handler = (line) => {
    if (!currentFileChanges) return;

    currentChunk?.changes.push({
      type: "normal",
      normal: true,
      ln1: deletedLineCounter++,
      ln2: addedLineCounter++,
      content: line,
    });
    currentFileChanges.oldLines--;
    currentFileChanges.newLines--;
  };

  const start = (line?: string): parse.File => {
    const [fromFileName, toFileName] = parseFiles(line) ?? [];

    const file: parse.File = {
      chunks: [],
      deletions: 0,
      additions: 0,
      from: fromFileName,
      to: toFileName,
    };

    currentFile = file;
    files.push(file);
    return file;
  };

  const restart = (): parse.File => {
    if (!currentFile || currentFile.chunks.length) return start();
    return currentFile;
  };

  const newFile: Handler = (_, match) => {
    const file = restart();
    file.new = true;
    file.newMode = match[1];
    file.from = "/dev/null";
  };

  const deletedFile: Handler = (_, match) => {
    const file = restart();
    file.deleted = true;
    file.oldMode = match[1];
    file.to = "/dev/null";
  };

  const oldMode: Handler = (_, match) => {
    restart().oldMode = match[1];
  };

  const newMode: Handler = (_, match) => {
    restart().newMode = match[1];
  };

  const index: Handler = (line, match) => {
    const file = restart();
    file.index = line.split(" ").slice(1);
    if (match[1]) {
      file.oldMode = file.newMode = match[1].trim();
    }
  };

  const fromFile: Handler = (line) => {
    restart().from = parseOldOrNewFile(line);
  };

  const toFile: Handler = (line) => {
    restart().to = parseOldOrNewFile(line);
  };

  const toNumOfLines = (number?: string) => +(number || 1);

  const chunk: Handler = (line, match) => {
    const file = currentFile ?? start(line);

    const [oldStart, oldNumLines, newStart, newNumLines] = match.slice(1);

    deletedLineCounter = +oldStart;
    addedLineCounter = +newStart;
    currentChunk = {
      content: line,
      changes: [],
      oldStart: +oldStart,
      oldLines: toNumOfLines(oldNumLines),
      newStart: +newStart,
      newLines: toNumOfLines(newNumLines),
    };
    currentFileChanges = {
      oldLines: toNumOfLines(oldNumLines),
      newLines: toNumOfLines(newNumLines),
    };
    file.chunks.push(currentChunk);
  };

  const del: Handler = (line) => {
    if (!currentChunk || !currentFile || !currentFileChanges) return;

    currentChunk.changes.push({
      type: "del",
      del: true,
      ln: deletedLineCounter++,
      content: line,
    });
    currentFile.deletions++;
    currentFileChanges.oldLines--;
  };

  const add: Handler = (line) => {
    if (!currentChunk || !currentFile || !currentFileChanges) return;

    currentChunk.changes.push({
      type: "add",
      add: true,
      ln: addedLineCounter++,
      content: line,
    });
    currentFile.additions++;
    currentFileChanges.newLines--;
  };

  const eof: Handler = (line) => {
    if (!currentChunk) return;

    const [mostRecentChange] = currentChunk.changes.slice(-1);
    const { type, ln1, ln2, ln } = mostRecentChange as {
      type: parse.ChangeType;
      ln1?: number;
      ln2?: number;
      ln?: number;
    };

    // The computed `[type]` key can't be checked against the Change union.
    currentChunk.changes.push({
      type,
      [type]: true,
      ln1,
      ln2,
      ln,
      content: line,
    } as unknown as parse.Change);
  };

  const schemaHeaders: [RegExp, Handler][] = [
    [/^diff\s/, start],
    [/^new file mode (\d+)$/, newFile],
    [/^deleted file mode (\d+)$/, deletedFile],
    [/^old mode (\d+)$/, oldMode],
    [/^new mode (\d+)$/, newMode],
    [/^index\s[\da-zA-Z]+\.\.[\da-zA-Z]+(\s(\d+))?$/, index],
    [/^---\s/, fromFile],
    [/^\+\+\+\s/, toFile],
    [/^@@\s+-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s@@/, chunk],
    [/^\\ No newline at end of file$/, eof],
  ];

  const schemaContent: [RegExp, Handler][] = [
    [/^\\ No newline at end of file$/, eof],
    [/^-/, del],
    [/^\+/, add],
    [/^\s*/, normal],
  ];

  const parseContentLine = (line: string) => {
    for (const [pattern, handler] of schemaContent) {
      const match = line.match(pattern);
      if (match) {
        handler(line, match);
        break;
      }
    }
    if (
      currentFileChanges?.oldLines === 0 &&
      currentFileChanges.newLines === 0
    ) {
      currentFileChanges = null;
    }
  };

  const parseHeaderLine = (line: string) => {
    for (const [pattern, handler] of schemaHeaders) {
      const match = line.match(pattern);
      if (match) {
        handler(line, match);
        break;
      }
    }
  };

  const parseLine = (line: string) => {
    if (currentFileChanges) {
      parseContentLine(line);
    } else {
      parseHeaderLine(line);
    }
    return;
  };

  for (const line of lines) parseLine(line);

  return files;
};

const fileNameDiffRegex =
  /(a|i|w|c|o|1|2)\/.*(?=["']? ["']?(b|i|w|c|o|1|2)\/)|(b|i|w|c|o|1|2)\/.*$/g;
const gitFileHeaderRegex = /^(a|b|i|w|c|o|1|2)\//;
const parseFiles = (line?: string) => {
  const fileNames = line?.match(fileNameDiffRegex);
  return fileNames?.map((fileName) =>
    fileName.replace(gitFileHeaderRegex, "").replace(/("|')$/, "")
  );
};

const qoutedFileNameRegex = /^\\?['"]|\\?['"]$/g;
const parseOldOrNewFile = (line: string) => {
  let fileName = leftTrimChars(line, "-+").trim();
  fileName = removeTimeStamp(fileName);
  return fileName
    .replace(qoutedFileNameRegex, "")
    .replace(gitFileHeaderRegex, "");
};

const leftTrimChars = (string: string, trimmingChars: string | RegExp) => {
  const trimmingString = formTrimmingString(trimmingChars);

  return makeString(string).replace(new RegExp(`^${trimmingString}+`), "");
};

const timeStampRegex =
  /\t.*|\d{4}-\d\d-\d\d\s\d\d:\d\d:\d\d(.\d+)?\s(\+|-)\d\d\d\d/;
const removeTimeStamp = (string: string) => {
  const timeStamp = timeStampRegex.exec(string);
  if (timeStamp) {
    string = string.substring(0, timeStamp.index).trim();
  }
  return string;
};

const formTrimmingString = (trimmingChars: string | RegExp) => {
  if (trimmingChars instanceof RegExp) return trimmingChars.source;
  return `[${makeString(trimmingChars).replace(
    /([.*+?^=!:${}()|[\]/\\])/g,
    "\\$1"
  )}]`;
};

const makeString = (itemToConvert: unknown) => `${itemToConvert ?? ""}`;

export = parse;
