import {World} from "./world.js";
import {Client} from "./client.js";
import {Store} from "./store.js";
import {Generator} from "./generator.js";

let http = require("http");
let ws = require("ws");
let fs = require("fs");
let colors = require("colors");

export class Server
{
	constructor(port = 12345)
	{
		this.nextClientId = 0;
		this.generator = new Generator();
		this.store = new Store();
		this.world = new World(null, null, null, this.generator, this.store);
		this.server = http.createServer(this.onRequest.bind(this));
		this.server.listen(port);
		this.wss = new ws.Server({server: this.server});
		this.wss.on("connection", this.onConnection.bind(this));

		console.log("\n  BlockWeb Server  \n".rainbow);
		this.log("Listening on port", port);
	}

	onRequest(request, response)
	{
		let url = request.url;

		if(url === "/") {
			url = "/index.html";
		}

		if(!fs.existsSync("." + url)) {
			url = "/index.html";
		}

		let ext = url.split(".").pop();
		let mime = "text/html";

		if(ext === "png") {
			mime = "image/png";
		}
		else if(ext === "js") {
			mime = "application/javascript";
		}

		response.setHeader("Content-Type", mime);
		response.end(fs.readFileSync("." + url));
	}

	onConnection(ws, request)
	{
		this.log("New connection", request.socket.remoteAddress);
		
		let client = new Client(this, ws, request.socket, this.nextClientId++);
	}

	log(...messages)
	{
		console.log("[%s]".yellow, new Date().toLocaleString(), ...messages);
	}
}

let port = 12345;

if(process.argv[2] !== undefined) {
	port = parseInt(process.argv[2]);
}

let server = new Server(port);
