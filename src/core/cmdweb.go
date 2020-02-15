package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/netgusto/nodebook/src/core/shared"
	"github.com/netgusto/nodebook/src/core/shared/service"
)

func webRun(notebookspath string, docker bool, bindaddress string, port int) {
	if docker && !shared.IsDockerRunning() {
		fmt.Println("docker is not running on the host, but --docker requested.")
		os.Exit(1)
	}

	recipeRegistry, nbRegistry := baseServices(notebookspath)

	csrfService := service.NewCSRFService()
	routes := service.NewRoutes()

	api := makeAPI(
		nbRegistry,
		recipeRegistry,
		routes,
		csrfService,
		docker,
	)

	fmt.Printf("nbk listening on %s:%d\n", bindaddress, port)
	srv := &http.Server{
		Handler:     api,
		Addr:        fmt.Sprintf("%s:%d", bindaddress, port),
		ReadTimeout: 15 * time.Second,
		// no write timeout, we may need to stream responses for indefinite amounts of time
	}

	log.Fatal(srv.ListenAndServe())
}
