import {NoiseField} from "./noisefield.js";
import {CHUNK_WIDTH, getLinearBlockIndex} from "./chunk.js";

export class Generator
{
	constructor(inworker = false)
	{
		this.inworker = inworker;
		this.counter = 0;
		this.callbacks = {};
		
		if(inworker) {
			this.noise = new NoiseField(0, 8, 8);
			
			onmessage = e => {
				//console.log("jup", e);
				
				this.generateChunk(e.data.x, e.data.y, e.data.z, e.data.buf);
				
				postMessage({buf: e.data.buf, id: e.data.id}, [e.data.buf]);
			};
			
			//console.log("worker running");
		}
		else {
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
		
		if(this.inworker) {
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
		else {
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

try {
	window = window;
}
catch(e) {
	let generator = new Generator(true);
}
