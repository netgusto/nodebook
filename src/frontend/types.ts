export type Route = "home" | "notebook";

export interface NotebookHandle {
    name: string;
    url: string;
    recipe: Recipe;
}

export interface Notebook extends NotebookHandle {
    execurl: string;
    persisturl: string;
    content: string;
}

export interface Recipe {
    key: string;
    name: string;
    language: string;
}