import {env} from "./env.js";

export class Store
{
	constructor()
	{
		if(env === "web") {
			this.isready = false;
			this.requestid = 0;
			this.requests = {};

			this.ready = new Promise(res => {
				this.connect(res);
			});
		}
		else if(env === "node") {
			this.fs = require("fs");
		}
	}

	connect(cb)
	{
		this.host = window.location.host;
		this.protocol = "ws";

		if(window.location.protocol === "https:") {
			this.protocol = "wss";
		}

		this.socket = new WebSocket(this.protocol + "://" + this.host, "blockweb");
		this.socket.binaryType = "arraybuffer";

		this.socket.onopen = e => {
			console.log("Websocket open", e);
			cb && cb();
			this.isready = true;
		};

		this.socket.onclose = e => {
			console.log("Connection closed", e);
			//this.isready = false;
			//this.connect();
		};

		this.socket.onerror = e => {
			console.log("WebSocket error", e);
		};

		this.socket.onmessage = e => {
			// console.log("Websocket message", e);

			let requestid = new Int32Array(e.data)[0];
			let payload = new Uint8Array(e.data, 4);

			this.requests[requestid](payload);
		};

		window.addEventListener("beforeunload", e => {
			console.log("Close web socket");
			this.socket.close();
		});
	}

	loadChunk(x, y, z, cb, errcb)
	{
		if(env === "web") {
			if(this.isready) {
				let requestid = this.requestid++;

				this.requests[requestid] = cb;

				this.socket.send(
					new Int32Array([1, requestid, x, y, z]),
				);
			}
			else {
				this.ready.then(() => this.loadChunk(x, y, z, cb, errcb));
			}
		}
		else if(env === "node") {
			this.fs.readFile(
				`./chunks/${x}_${y}_${z}`,
				(err, data) => {
					if(err) {
						errcb();
					}
					else {
						cb(new Uint8Array(data));
					}
				},
			);
		}
	}

	storeChunk(chunk)
	{
		if(env === "web") {
			if(this.isready) {
				let requestid = this.requestid++;
				let dataOffs = 5 * 4;
				let buf8 = new Uint8Array(dataOffs + chunk.data.byteLength);
				let buf32 = new Int32Array(buf8.buffer, 0, dataOffs);

				buf32[0] = 2;
				buf32[1] = requestid;
				buf32[2] = chunk.x;
				buf32[3] = chunk.y;
				buf32[4] = chunk.z;
				buf8.set(chunk.data, dataOffs);

				this.socket.send(buf8);
			}
			else {
				this.ready.then(() => this.storeChunk(chunk));
			}
		}
		else if(env === "node") {
			this.fs.writeFile(
				`./chunks/${chunk.x}_${chunk.y}_${chunk.z}`,
				chunk.data,
				err => {
					if(err) {
						console.log("fs write err", err);
					}
				},
			);
		}
	}
}
