package httphandler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path"
	"strings"

	"github.com/gorilla/mux"
	"github.com/netgusto/nodebook/src/core/shared/service"
	"github.com/netgusto/nodebook/src/core/shared/types"
	"github.com/pkg/errors"
)

func ApiNotebookRenameHandler(notebookRegistry *service.NotebookRegistry, csrfService *service.CSRFService, routes *service.Routes) HTTPHandler {
	return func(res http.ResponseWriter, req *http.Request) {
		decoder := json.NewDecoder(req.Body)
		var post struct {
			CSRFToken service.CSRFToken `json:"csrfToken"`
			NewName   string            `json:"newname"`
		}
		err := decoder.Decode(&post)
		if err != nil || !csrfService.IsValid(post.CSRFToken) {
			http.Error(res, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
			return
		}

		params := mux.Vars(req)
		name, found := params["name"]
		if !found || strings.TrimSpace(name) == "" {
			http.Error(res, http.StatusText(http.StatusBadRequest)+":1", http.StatusBadRequest)
			return
		}

		notebook, err := notebookRegistry.GetNotebookByName(name)
		if err != nil {
			http.Error(res, http.StatusText(http.StatusNotFound), http.StatusNotFound)
			return
		}

		sanitizedNewName, err := service.SanitizeNotebookName(post.NewName)
		if err != nil {
			http.Error(res, http.StatusText(http.StatusBadRequest)+":2", http.StatusBadRequest)
			return
		}

		renamedNotebook, err := renameNotebook(notebook, sanitizedNewName, notebookRegistry)
		if err != nil {
			http.Error(res, http.StatusText(http.StatusBadRequest)+":3"+err.Error(), http.StatusBadRequest)
			return
		}

		res.Header().Add("Content-Type", "application/stream+json; charset=utf8")
		res.Header().Add("Cache-Control", "max-age=0")

		payload, err := json.Marshal(extractFrontendNotebookSummary(renamedNotebook, routes))
		if err != nil {
			http.Error(res, "Could not summarize notebook for frontend", http.StatusInternalServerError)
			return
		}

		_, _ = res.Write(payload)
	}
}

func renameNotebook(notebook types.Notebook, newname string, notebookregistry *service.NotebookRegistry) (types.Notebook, error) {

	newabsdir := path.Join(path.Dir(notebook.GetAbsdir()), newname)
	_, err := os.Stat(newabsdir)
	if err == nil {
		return nil, fmt.Errorf("Could not rename notebook %s: the new dir %s already exists", notebook.GetName(), newabsdir)
	}

	if err = os.Rename(notebook.GetAbsdir(), newabsdir); err != nil {
		return nil, errors.Wrapf(err, "Could not rename notebook %s to %s", notebook.GetName(), newname)
	}

	renamedNotebook, err := notebookregistry.Renamed(notebook, newname)
	if err != nil {
		return nil, errors.Wrapf(err, "Could not rename notebook %s to %s", notebook.GetName(), newname)
	}

	return renamedNotebook, nil
}
