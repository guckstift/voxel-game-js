start: ./bundles/server.js
	node ./bundles/server.js

./bundles/server.js: ./src/server/main.js
	rollup ./src/server/main.js --file ./bundles/server.js --format iife --name server

install:
	npm i ws
	npm i colors

.PHONY: start install
