import {getLocalPos} from "../src/world.js";
import {getLinearBlockIndex} from "../src/chunk.js";
import {getChunkPos} from "../src/world.js";

let fs = require("fs");
let noop = () => {};

export class Store
{
	getChunkPath(x, y, z)
	{
		return `./chunks/${x}_${y}_${z}`;
	}
	
	loadChunk(x, y, z, cb = noop, ecb = noop)
	{
		return fs.readFile(this.getChunkPath(x, y, z), (err, data) => {
			if(err) {
				ecb();
			}
			else {
				cb(data);
			}
		});
	}

	storeChunk(x, y, z, data, cb = noop, ecb = noop)
	{
		fs.writeFile(this.getChunkPath(x, y, z), data, err => {
			if(err) {
				ecb();
			}
			else {
				cb();
			}
		});
	}
	
	storeBlockId(x, y, z, id, cb = noop, ecb = noop)
	{
		let i = getLinearBlockIndex(getLocalPos(x, y, z));
		let cp = getChunkPos(x, y, z);
		
		fs.open(this.getChunkPath(...cp), "r+", (err, fd) => {
			if(err) {
				ecb();
			}
			else {
				fs.write(fd, new Uint8Array([id]), 0, 1, i, (err, bw, buf) => {
					if(err) {
						ecb();
					}
					else {
						cb();
					}
				});
			}
		});
	}
}
