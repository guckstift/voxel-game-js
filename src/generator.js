import {NoiseField} from "./noisefield.js";
import {CHUNK_WIDTH, getLinearBlockIndex} from "./chunk.js";
import {env} from "./env.js";

export class Generator
{
	constructor()
	{
		this.counter = 0;
		this.callbacks = {};
		this.noise = new NoiseField(0, 8, 8);

		if(env === "worker") {
			onmessage = e => {
				//console.log("jup", e);

				this.generateChunk(e.data.x, e.data.y, e.data.z, e.data.buf);

				postMessage({buf: e.data.buf, id: e.data.id}, [e.data.buf]);
			};

			//console.log("worker running");
		}
		else if(env === "web") {
			this.worker = new Worker("./src/generator.bundle.js");

			this.worker.onmessage = e => {
				this.callbacks[e.data.id](e.data.buf);
			};

			//console.log("client running");
		}
	}

	generateChunk(x, y, z, buf)
	{
		let data = new Uint8Array(buf);

		for(let bx = 0; bx < CHUNK_WIDTH; bx++) {
			for(let by = 0; by < CHUNK_WIDTH; by++) {
				for(let bz = 0; bz < CHUNK_WIDTH; bz++) {
					let i = getLinearBlockIndex(bx, by, bz);
					let lx = bx + x * CHUNK_WIDTH;
					let ly = by + y * CHUNK_WIDTH;
					let lz = bz + z * CHUNK_WIDTH;
					let h = data[i] = this.noise.sample(lx, 0, lz);

					if(ly < h) {
						data[i] = this.noise.sample(lx, ly, lz) * 3 / 8 + 1;
					}
					else {
						data[i] = 0;
					}
				}
			}
		}
	}

	requestChunk(x, y, z, buf, cb)
	{
		//console.log("request chunk");

		let id = this.counter++;

		this.callbacks[id] = cb;
		this.worker.postMessage({x, y, z, buf, id}, [buf]);
	}
}

if(env === "worker") {
	let generator = new Generator();
}
