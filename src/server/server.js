import {World} from "../world.js";
import {Client} from "./client.js";

let http = require("http");
let ws = require("ws");
let fs = require("fs");
let colors = require("colors");

export class Server
{
	constructor(port = 12345)
	{
		this.world = new World();
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
		let client = new Client(this, ws, request.socket);

		this.log("New connection", request.socket.remoteAddress);
	}

	log(...messages)
	{
		console.log("[%s]".yellow, new Date().toLocaleString(), ...messages);
	}
}
