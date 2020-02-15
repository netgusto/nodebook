package httphandler

import (
	"encoding/json"
	"net/http"

	"github.com/Pallinder/sillyname-go"
	"github.com/netgusto/nodebook/src/core/shared/service"
)

func ApiNewNotebookHandler(
	notebookRegistry *service.NotebookRegistry,
	recipeRegistry *service.RecipeRegistry,
	csrfService *service.CSRFService,
	routes *service.Routes,
	notebookspath string) HTTPHandler {
	return func(res http.ResponseWriter, req *http.Request) {

		decoder := json.NewDecoder(req.Body)
		var post struct {
			CSRFToken service.CSRFToken `json:"csrfToken"`
			RecipeKey string            `json:"recipekey"`
		}
		err := decoder.Decode(&post)
		if err != nil {
			panic(err)
		}

		if !csrfService.IsValid(post.CSRFToken) {
			// TODO: log
			http.Error(res, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
			return
		}

		// find recipe
		recipe := recipeRegistry.GetRecipeByKey(post.RecipeKey)
		if recipe == nil {
			http.Error(res, "Recipe does not exist", http.StatusBadRequest)
			return
		}

		// Generate name
		var name string
		for {
			name, err = service.SanitizeNotebookName(sillyname.GenerateStupidName())
			if err != nil {
				http.Error(res, "Could not generate notebook name", http.StatusInternalServerError)
				return
			}

			_, err = notebookRegistry.GetNotebookByName(name)
			if err != nil {
				// notebook doe not exist yet; found unused name
				break
			}
		}

		// Create notebook
		if err := (*recipe).InitNotebook(*recipe, notebookspath, name); err != nil {
			http.Error(res, "newNotebook: Could not initialize recipe for notebook", http.StatusInternalServerError)
			return
		}

		// update cache
		notebook, err := notebookRegistry.BuildNotebookDescriptor(name, *recipe)
		if err != nil {
			http.Error(res, "Could not build notebook descriptor for notebook", http.StatusInternalServerError)
			return
		}

		// Register notebook
		notebookRegistry.RegisterNotebook(notebook)

		payload, err := json.Marshal(extractFrontendNotebookSummary(notebook, routes))
		if err != nil {
			http.Error(res, "Could not summarize notebook for frontend", http.StatusInternalServerError)
			panic(err)
		}

		res.Header().Add("Content-Type", "application/json")
		res.Header().Add("Cache-Control", "max-age=0")

		_, _ = res.Write(payload)
	}
}
