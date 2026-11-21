declare namespace parse {
    interface File {
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
    interface Chunk {
        content: string;
        changes: Change[];
        oldStart: number;
        oldLines: number;
        newStart: number;
        newLines: number;
    }
    interface NormalChange {
        type: "normal";
        ln1: number;
        ln2: number;
        normal: true;
        content: string;
    }
    interface AddChange {
        type: "add";
        add: true;
        ln: number;
        content: string;
    }
    interface DeleteChange {
        type: "del";
        del: true;
        ln: number;
        content: string;
    }
    type ChangeType = "normal" | "add" | "del";
    type Change = NormalChange | AddChange | DeleteChange;
}
declare const parse: (input?: string | null) => parse.File[];
export = parse;
