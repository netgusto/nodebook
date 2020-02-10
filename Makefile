.PHONY: install build install-frontend build-frontend

install:
	go get github.com/markbates/pkger/cmd/pkger

build:
	pkger
	cd src/backend && go build -o ../../dist/nbk

install-frontend:
	cd src/frontend && npm i

build-frontend:
	cd src/frontend && npm run build
