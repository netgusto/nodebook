import {
  ApiClient as ApiClientType,
  Notebook as NotebookType
} from '../types';

class ApiClient implements ApiClientType {
  private csrfToken: string;
  private debounceWait = 400;
  private debounceTimeout;
  private options = {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  };

  private getCsrfToken(): Promise<string> {
    if (this.csrfToken) return Promise.resolve(this.csrfToken);
    return window.fetch('/csrf')
      .then((res) => res.json())
      .then((json) => {
        this.csrfToken = json.csrfToken;
        return this.csrfToken;
      })
  }

  private post(url, body) {
    return this.getCsrfToken().then((csrfToken) => {
      const options = Object.assign({}, this.options, {
        method: 'POST',
        body: JSON.stringify(Object.assign({}, body, { csrfToken }))
      })
      return window.fetch(url, options);
    });
  }

  persist(notebook: NotebookType, content: string) {
    return this.post(notebook.persisturl, { content });
  }

  debouncedPersist(notebook: NotebookType, value: string) {
    clearTimeout(this.debounceTimeout);
    this.debounceTimeout = setTimeout(() => {
      this.persist(notebook, value)
    }, this.debounceWait);
  }

  stop(notebook: NotebookType) {
    return this.post(notebook.stopurl, {});
  }

  rename(url: string, newname: string) {
    return this.post(url, { newname });
  }

  create(url, recipekey) {
    return this.post(url, { recipekey });
  }
}

export default ApiClient;
