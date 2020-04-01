import {serve} from "https://deno.land/std/http/server.ts";
import {acceptWebSocket} from "https://deno.land/std/ws/mod.ts";
import Map from "../src/map.js";

let server = serve({hostname: "localhost", port: 12345});
let counter = 0;
let map = new Map();
let clientsocks = [];

listenForClients();

async function listenForClients()
{
	for await(let request of server) {
		let socket = await acceptWebSocket({
			conn: request.conn,
			headers: request.headers,
			bufReader: request.r,
			bufWriter: request.w,
		});
		
		listenForEvents(counter++, socket);
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
