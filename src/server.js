import {World} from "./world.js";

let http = require("http");
let ws = require("ws");
let fs = require("fs");

let intsize = Int32Array.BYTES_PER_ELEMENT;

export class Server
{
	constructor(port = 12345)
	{
		this.world = new World();
		this.server = http.createServer(this.onRequest.bind(this));
		this.server.listen(port);
		this.wss = new ws.Server({server: this.server});
		this.wss.on("connection", this.onConnection.bind(this));
	}
	
	onRequest(request, response)
	{
		let url = request.url;
		
		if(url === "/") {
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
		
		if(fs.existsSync("." + url)) {
			response.setHeader("Content-Type", mime);
			response.end(fs.readFileSync("." + url));
		}
		else {
			response.writeHead(404);
			response.end();
		}
	}
	
	onConnection(socket, request)
	{
		let client = new Client(this, socket);
	}
}

class Client
{
	constructor(server, socket)
	{
		this.server = server;
		this.socket = socket;
		this.socket.on("message", this.onMessage.bind(this));
	}
	
	onMessage(data)
	{
		let values = new Int32Array(new Uint8Array(data).buffer);
		let cmd = values[0];
		let reqid = values[1];
		
		if(cmd === 1) {
			this.onGetChunk(reqid, values[2], values[3], values[4]);
		}
		else if(cmd === 2) {
			let chunkData = new Uint8Array(data).subarray(intsize * 5);
			
			this.onStoreChunk(reqid, values[2], values[3], values[4], chunkData);
		}
	}
	
	onGetChunk(reqid, x, y, z)
	{
		let chunk = this.server.world.touchChunk(x, y, z);

		if(chunk.loading) {
			chunk.onLoaded = () => this.sendChunk(reqid, chunk.data);
		}
		else {
			this.sendChunk(reqid, chunk.data);
		}
	}
	
	sendChunk(reqid, data)
	{
		let bytes = new Uint8Array(intsize + data.byteLength);
		let values = new Int32Array(bytes.buffer);
		
		values[0] = reqid;
		bytes.set(data, intsize);
		this.socket.send(bytes);
	}
	
	onStoreChunk(reqid, x, y, z, data)
	{
		this.server.world.touchChunk(x, y, z).setChunkData(data);
	}
}

let port = 12345;

if(process.argv[2] !== undefined) {
	port = parseInt(process.argv[2]);
}

let server = new Server(port);
