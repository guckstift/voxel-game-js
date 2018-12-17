import {NoiseField} from "./noise.js";
import {CHUNK_WIDTH, getLinearBlockIndex} from "../src/chunk.js";

export class Generator
{
	constructor()
	{
		this.counter = 0;
		this.callbacks = {};
		this.noise = new NoiseField(0, 8, 8);
		this.buf = new Uint8Array(CHUNK_WIDTH ** 3);
	}

	generateChunk(x, y, z)
	{
		let data = this.buf;

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
		
		return data;
	}
}
