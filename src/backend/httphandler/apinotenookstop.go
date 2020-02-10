package httphandler

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
	"github.com/netgusto/nodebook/src/shared/service"
)

func ApiNotebookStopHandler(notebookRegistry *service.NotebookRegistry, csrfService *service.CSRFService) HTTPHandler {
	return func(res http.ResponseWriter, req *http.Request) {
		res.Header().Add("Content-Type", "application/json; charset=utf8")
		res.Header().Add("Cache-Control", "max-age=0")
		decoder := json.NewDecoder(req.Body)
		var post struct {
			CSRFToken service.CSRFToken `json:"csrfToken"`
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

		_, err = notebookRegistry.GetNotebookByName(name)
		if err != nil {
			http.Error(res, http.StatusText(http.StatusNotFound), http.StatusNotFound)
			return
		}

		for _, stop := range running {
			stop()
		}

		// empty running stop funcs
		running = map[string]func(){}

		_, _ = res.Write([]byte("\"OK\""))
	}
}
