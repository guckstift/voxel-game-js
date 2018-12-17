import {Client} from "./client.js";
import {World} from "./world.js";
import {Store} from "./store.js";

let http = require("http");
let ws = require("ws");
let fs = require("fs");
let colors = require("colors");

export class Server
{
	constructor(port)
	{
		this.nextClientId = 0;
		this.server = http.createServer(this.onRequest.bind(this));
		this.server.listen(port);
		this.wss = new ws.Server({server: this.server});
		this.wss.on("connection", this.onConnection.bind(this));
		this.store = new Store();
		this.world = new World(this.store);

		this.nlog("\n  BlockWeb Server  \n".rainbow);
		this.tlog("Listening on port", port);
	}

	onRequest(request, response)
	{
		let url = request.url;

		if(url === "/" || !fs.existsSync("." + url)) {
			url = "/index.html";
		}

		response.setHeader("Content-Type", this.getMime(url));
		response.end(fs.readFileSync("." + url));
	}

	onConnection(ws, req)
	{
		this.tlog("New connection", req.socket.remoteAddress);
		
		let sock = req.socket;
		let client = new Client(this, ws, sock, this.nextClientId++);
	}
	
	getMime(url)
	{
		let ext = url.split(".").pop();
		let mime = "text/html";

		if(ext === "png") {
			mime = "image/png";
		}
		else if(ext === "js") {
			mime = "application/javascript";
		}
		
		return mime;
	}
	
	nlog(...messages)
	{
		console.log(...messages);
	}

	tlog(...messages)
	{
		console.log("[%s]".yellow, new Date().toLocaleString(), ...messages);
	}
}
