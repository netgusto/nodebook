package httphandler

import (
	"encoding/json"
	"io/ioutil"
	"net/http"
	"os"
	"strings"

	"github.com/gorilla/mux"
	"github.com/netgusto/nodebook/src/core/shared/service"
	"github.com/netgusto/nodebook/src/core/shared/types"
	pkgErrors "github.com/pkg/errors"
)

func ApiNotebookSetContentHandler(notebookRegistry *service.NotebookRegistry, csrfService *service.CSRFService) HTTPHandler {
	return func(res http.ResponseWriter, req *http.Request) {
		res.Header().Add("Content-Type", "application/json; charset=utf8")
		res.Header().Add("Cache-Control", "max-age=0")
		decoder := json.NewDecoder(req.Body)
		var post struct {
			CSRFToken service.CSRFToken `json:"csrfToken"`
			Content   string            `json:"content"`
		}
		err := decoder.Decode(&post)
		if err != nil || !csrfService.IsValid(post.CSRFToken) {
			http.Error(res, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
			return
		}

		params := mux.Vars(req)
		name, found := params["name"]
		if !found || strings.TrimSpace(name) == "" {
			http.Error(res, http.StatusText(http.StatusBadRequest), http.StatusUnauthorized)
			return
		}

		notebook, err := notebookRegistry.GetNotebookByName(name)
		if err != nil {
			http.Error(res, http.StatusText(http.StatusNotFound), http.StatusNotFound)
			return
		}

		if err := updateNotebookContent(notebook, []byte(post.Content), notebookRegistry); err != nil {
			http.Error(res, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}

		_, _ = res.Write([]byte("\"OK\""))
	}
}

func updateNotebookContent(notebook types.Notebook, content []byte, notebookregistry *service.NotebookRegistry) error {

	mainfile := notebook.GetMainFileAbsPath()

	info, err := os.Stat(mainfile)
	if err != nil {
		return pkgErrors.Wrapf(err, "updateNotebookContent: could not stat %s", mainfile)
	}

	err = ioutil.WriteFile(mainfile, content, info.Mode())
	if err != nil {
		return pkgErrors.Wrapf(err, "updateNotebookContent: could not write content to file %s", mainfile)
	}

	if _, err := notebookregistry.Refresh(notebook); err != nil {
		return pkgErrors.Wrapf(err, "updateNotebookContent: could not refresh descriptor for notebook %s", notebook.GetName())
	}

	return nil
}
