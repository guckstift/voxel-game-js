import {serve} from "https://deno.land/std/http/server.ts";
import {acceptWebSocket, acceptable} from "https://deno.land/std/ws/mod.ts";
import {lookup} from "https://deno.land/std/media_types/mod.ts";
import Map from "../src/map.js";
import Client from "./client.js";

export default class Server
{
	constructor()
	{
		this.counter = 0;
		this.map = new Map();
		this.clients = [];
	}

	async run()
	{
		this.server = serve({hostname: "0.0.0.0", port: 12345});
		
		for await(let request of this.server) {
			if(acceptable(request)) {
				let socket = await acceptWebSocket({
					conn: request.conn,
					headers: request.headers,
					bufReader: request.r,
					bufWriter: request.w,
				});
				
				let client = new Client(this, this.counter++, socket);
				
				this.clients.push(client);
				
				client.run().then(() => {
					this.clients = this.clients.filter(c => c !== client);
				});
			}
			else {
				let path = "." + request.url;
				
				if(path === "./") {
					path = "./index.html";
				}
				
				console.log("requested", path);
				
				try {
					let body = await Deno.readFile(path);
					let mime = lookup(path);
					let headers = new Headers();
					
					headers.set("Content-Type", mime);
					request.respond({headers, body});
				}
				catch(e) {
					request.respond({
						body: "Not found",
					});
				}
			}
		}
	}
	
	broadcast(except, msg)
	{
		this.clients.forEach(client => {
			if(client !== except) {
				client.socket.send(JSON.stringify(msg));
			}
		});
	}
}
