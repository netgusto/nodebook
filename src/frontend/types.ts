export type Route = "home" | "notebook";

export interface NotebookHandle {
    name: string;
    url: string;
    recipe: Recipe;
    mtime: string;
}

export interface Notebook extends NotebookHandle {
    execurl: string;
    persisturl: string;
    content: string;
    stopurl: string;
}

export interface Recipe {
    key: string;
    name: string;
    language: string;
    cmmode: string;
}

export interface ApiClient {
    persist: (notebook: Notebook, value: string) => Promise<Response>;
    debouncedPersist: (notebook: Notebook, value: string) => void;
    stop: (notebook: Notebook) => Promise<Response>;
    rename: (url: string, name: string) => Promise<Response>;
    create: (url: string, recipekey: string) => Promise<Response>;
}
