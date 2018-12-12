import {SocketServer} from "./socketserver.js";
import {World} from "./world.js";

let server = new SocketServer();
let world = new World();

server.onNewClient = client => {
	client.onMessage = data => {
		// console.log(data);
		let data32 = new Int32Array(data.buffer, 0, 2);
		let cmd = data32[0];
		let requestid = data32[1];

		// console.log("Message reqid", requestid);

		if(cmd === 1) {
			data32 = new Int32Array(data.buffer, 0, 5);
			let x = data32[2];
			let y = data32[3];
			let z = data32[4];

			console.log(
				"Client", client.id,
				"wants chunk", x, y, z,
				"reqid", requestid
			);

			let chunk = world.touchChunk(x, y, z);

			if(chunk.loading) {
				chunk.onLoaded = () => {
					client.sendData(new Int32Array([requestid]), chunk.data);
				};
			}
			else {
				client.sendData(new Int32Array([requestid]), chunk.data);
			}
		}
		else if(cmd === 2) {
			data32 = new Int32Array(data.buffer, 0, 5);
			let x = data32[2];
			let y = data32[3];
			let z = data32[4];

			console.log(
				"Client", client.id,
				"wants to store chunk", x, y, z,
				"reqid", requestid
			);
			
			world.touchChunk(x, y, z).setChunkData(data.subarray(5 * 4));
		}
	};
};
