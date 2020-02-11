package main

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/markbates/pkger"
	"github.com/netgusto/nodebook/src/backend/httphandler"
	"github.com/netgusto/nodebook/src/shared/service"
)

func makeAPI(
	nbRegistry *service.NotebookRegistry,
	recipeRegistry *service.RecipeRegistry,
	routes *service.Routes,
	csrfService *service.CSRFService,
	useDocker bool,
) *mux.Router {
	fs := http.FileServer(pkger.Dir("/dist/frontend/"))

	root := mux.NewRouter()
	root.Path("/").HandlerFunc(httphandler.HomePageHandler(nbRegistry, recipeRegistry, routes))
	root.Path("/csrf").HandlerFunc(httphandler.CsrfHandler(csrfService))
	root.Path("/notebook/{name}").HandlerFunc(httphandler.NotebookHandler(nbRegistry, routes))

	api := root.Methods("post").PathPrefix("/api").Subrouter()
	api.Path("/notebook/new").HandlerFunc(httphandler.ApiNewNotebookHandler(
		nbRegistry,
		recipeRegistry,
		csrfService,
		routes,
		nbRegistry.GetNotebooksPath(),
	))

	api.Path("/notebook/{name}/rename").HandlerFunc(httphandler.ApiNotebookRenameHandler(nbRegistry, csrfService, routes))
	api.Path("/notebook/{name}/setcontent").HandlerFunc(httphandler.ApiNotebookSetContentHandler(nbRegistry, csrfService))
	api.Path("/notebook/{name}/exec").HandlerFunc(httphandler.ApiNotebookExecHandler(nbRegistry, csrfService, useDocker))
	api.Path("/notebook/{name}/stop").HandlerFunc(httphandler.ApiNotebookStopHandler(nbRegistry, csrfService))

	root.PathPrefix("/").Handler(fs)

	return root
}
