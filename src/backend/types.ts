export interface EnvInfo {
    [key: string]: string
}

export interface ProcessInfo {
    cmd: string[];
    cwd: string;
    env: EnvInfo;
}

export interface ContainerMount {
    from: string;
    to: string;
    mode: 'ro'|'rw';
}

export interface ContainerInfo {
    cmd: string[];
    cwd: string;
    env: EnvInfo;
    image: string;
    mounts: Array<ContainerMount>;
}

export type WriterFunc = (msg: string) => void;

export interface ExecHandler {
    start: () => Promise<void>;
    stop: () => Promise<void>;
}

export interface Recipe {
    key: string;
    name: string;
    language: string;
    mainfile: string[];
    cmmode: string;
    dir: string;
    exec: ({
        notebook,
        docker,
        writeStdOut,
        writeStdErr,
        writeInfo,
        env
    }: {
        notebook: Notebook,
        docker: boolean,
        writeStdOut: WriterFunc,
        writeStdErr: WriterFunc,
        writeInfo: WriterFunc,
        env: EnvInfo,
    }) => Promise<ExecHandler>;

    init: ({
        notebookspath,
        name
    }: {
        notebookspath: string,
        name: string,
    }) => Promise<boolean>;
}

export interface SyntheticResponse {
    writable: boolean;
    finished: boolean;
    write: WriterFunc;
}

export interface Notebook {
    name: string;
    abspath: string;
    absdir: string;
    mainfilename: string;
    mtime: string;
    recipe: Recipe;
}

export interface NotebookSummaryFrontend {
    name: string;
    url: string;
    mtime: string;
    recipe: RecipeSummaryFrontend;
}

export interface RecipeSummaryFrontend {
    key: string;
    name: string;
    language: string;
    cmmode: string;
}

export type OutputChannel = 'stdout'|'stderr'|'info';

export type OnNotebookChangeType = (notebook: Notebook) => void;