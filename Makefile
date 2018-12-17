start: ./bundles/server.js
	node ./bundles/server.js

install:
	npm i ws
	npm i colors

build: ./bundles/server.js

backup:
	cp -a ./chunks ./backups/`date +'%Y-%m-%d-%H-%M-%S'`

clean:
	rm ./bundles/server.js

.PHONY: start install build backup clean

./bundles/server.js: ./src/*.js ./server/*.js
	rollup ./server/main.js --file ./bundles/server.js --format iife --name server
