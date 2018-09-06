export type Route = "home" | "notebook";

export interface NotebookHandle {
    name: string;
    url: string;
}

export interface Notebook extends NotebookHandle {
    execurl: string;
    persisturl: string;
    content: string;
}
