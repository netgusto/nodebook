export type Route = "home" | "notebook";

export interface NotebookHandle {
    name: string;
    url: string;
    recipe: Recipe;
    mtime: string;
}

export interface Notebook extends NotebookHandle {
}

export interface Recipe {
    key: string;
    name: string;
    language: string;
    cmmode: string;
}

export interface ApiClient {
    getCsrfToken: () => Promise<string>;
    persist: (url: string, value: string) => Promise<Response>;
    debouncedPersist: (url: string, value: string) => void;
    stop: (url: string) => Promise<Response>;
    rename: (url: string, name: string) => Promise<Response>;
    create: (url: string, recipekey: string) => Promise<Response>;
}
