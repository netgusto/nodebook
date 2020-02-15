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

  private post(url, body) {
    return this.getCsrfToken().then((csrfToken) => {
      const options = Object.assign({}, this.options, {
        method: 'POST',
        body: JSON.stringify(Object.assign({}, body, { csrfToken }))
      })
      return window.fetch(url, options);
    });
  }

  getCsrfToken(): Promise<string> {
    if (this.csrfToken) return Promise.resolve(this.csrfToken);
    return window.fetch('/csrf')
      .then((res) => res.json())
      .then((json) => {
        this.csrfToken = json.csrfToken;
        return this.csrfToken;
      })
  }

  persist(url: string, content: string) {
    return this.post(url, { content });
  }

  debouncedPersist(url: string, value: string) {
    clearTimeout(this.debounceTimeout);
    this.debounceTimeout = setTimeout(() => {
      this.persist(url, value)
    }, this.debounceWait);
  }

  stop(url: string) {
    return this.post(url, {});
  }

  rename(url: string, newname: string) {
    return this.post(url, { newname });
  }

  create(url, recipekey) {
    return this.post(url, { recipekey });
  }
}

export default ApiClient;
