import {
  ApiClient as ApiClientType,
  Notebook as NotebookType
} from '../types';

class ApiClient implements ApiClientType {
  private csrfToken: string;
  private debounceWait = 400;
  private debounceTimeout;

  persist(notebook: NotebookType, value: string) {
    return window.fetch(notebook.persisturl, {
      method: 'POST',
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({
          content: value,
      })
    });
  }

  debouncedPersist(notebook: NotebookType, value: string) {
    clearTimeout(this.debounceTimeout);
    this.debounceTimeout = setTimeout(() => {
      this.persist(notebook, value)
    }, this.debounceWait);
  }

  stop(notebook: NotebookType) {
    return window.fetch(notebook.stopurl, {
      method: 'POST',
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
      },
    })
  }

  rename(url: string, sanitizedName: string) {
    return window.fetch(url, {
      method: 'POST',
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({
          newname: sanitizedName,
      })
    })
  }

  create(url, recipekey) {
    return window.fetch(url, {
      method: 'POST',
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({
          recipekey,
      })
    })
  }
}

export default ApiClient;
