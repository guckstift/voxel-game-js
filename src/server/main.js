import {Server} from "./server.js";

let port = 12345;

if(process.argv[2] !== undefined) {
	port = parseInt(process.argv[2]);
}

let server = new Server(port);
