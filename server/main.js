import {serve} from "https://deno.land/std/http/server.ts";
import {acceptWebSocket, acceptable} from "https://deno.land/std/ws/mod.ts";
import {lookup} from "https://deno.land/std/media_types/mod.ts";
import Map from "../src/map.js";

let server = serve({hostname: "0.0.0.0", port: 12345});
let counter = 0;
let map = new Map();
let clientsocks = [];

listenForClients();

async function listenForClients()
{
	for await(let request of server) {
		if(acceptable(request)) {
			let socket = await acceptWebSocket({
				conn: request.conn,
				headers: request.headers,
				bufReader: request.r,
				bufWriter: request.w,
			});
			
			listenForEvents(counter++, socket);
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

async function listenForEvents(id, socket)
{
	clientsocks.push(socket);
	
	console.log(`client ${id}: joined`);
	
	for await(let event of socket.receive()) {
		if(typeof event === "string") {
			handleMessage(id, socket, JSON.parse(event));
		}
	}
	
	console.log(`client ${id}: left`);
	
	clientsocks = clientsocks.filter(s => s !== socket);
}

function handleMessage(id, socket, msg)
{
	if(msg.msg === 0) {
		let x = msg.x;
		let y = msg.y;
		
		console.log(`client ${id}: getChunk ${x} ${y}`);
		
		let chunk = map.loadChunk(x, y);
		let buf = new Uint8Array(3 * 8 + chunk.data.byteLength);
		let f64 = new Float64Array(buf.buffer);
		
		f64[0] = 1;
		f64[1] = x;
		f64[2] = y;
		buf.set(chunk.data, 3 * 8);
		
		socket.send(buf);
	}
	else if(msg.msg === 2) {
		let x = msg.x;
		let y = msg.y;
		let z = msg.z;
		let block = msg.block;
		
		console.log(`client ${id}: setBlock ${x} ${y} ${z} ${block}`);
		
		let chunk = map.setBlock(x, y, z, block);
		
		clientsocks.forEach(s => {
			if(s !== socket) {
				s.send(JSON.stringify({
					msg: 2,
					x, y, z,
					block,
				}));
			}
		});
	}
}
