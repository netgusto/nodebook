package httphandler

import (
	"io/ioutil"
	"net/http"
	"os"
	"strings"

	"github.com/gorilla/mux"
	"github.com/netgusto/nodebook/src/shared/service"
	pkgErrors "github.com/pkg/errors"
)

func NotebookHandler(notebookRegistry *service.NotebookRegistry, routes *service.Routes) HTTPHandler {
	return func(res http.ResponseWriter, req *http.Request) {
		params := mux.Vars(req)
		name, found := params["name"]
		if !found || strings.TrimSpace(name) == "" {
			res.WriteHeader(http.StatusBadRequest)
			return
		}

		notebook, err := notebookRegistry.GetNotebookByName(name)
		if err != nil {
			http.Error(res, http.StatusText(http.StatusNotFound), http.StatusNotFound)
			return
		}

		content, err := GetFileContent(notebook.GetMainFileAbsPath())
		if err != nil {
			http.Error(res, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}

		strContent, err := generatePageHtml("notebook", map[string]interface{}{
			"notebook":          extractFrontendNotebookSummary(notebook, routes),
			"homeurl":           routes.Home(),
			"renamenotebookurl": routes.APINotebookRename(notebook.GetName()),
			"execurl":           routes.APINotebookExec(notebook.GetName()),
			"stopurl":           routes.APINotebookStop(notebook.GetName()),
			"persisturl":        routes.APINotebookSetContent(notebook.GetName()),
			"content":           content,
		})
		if err != nil {
			http.Error(res, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}

		res.Header().Add("Content-Type", "text/html; charset=utf8")
		res.Header().Add("Cache-Control", "max-age=0")

		_, _ = res.Write([]byte(strContent))
	}
}

func GetFileContent(abspath string) (string, error) {
	f, err := os.Open(abspath)
	if err != nil {
		return "", pkgErrors.Wrapf(err, "Could not open notebook main file %s; ", abspath)
	}

	content, err := ioutil.ReadAll(f)
	if err != nil {
		return "", pkgErrors.Wrapf(err, "Could not read nottebook main file %s; ", abspath)
	}

	return string(content), nil
}
