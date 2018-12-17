import {getChunkPos, getLocalPos} from "./world.js";
import {getLinearBlockIndex} from "./chunk.js";

let fs = require("fs");
let noop = () => {};

function getChunkPath(x, y, z)
{
	return `./chunks/${x}_${y}_${z}`;
}

export class Store
{
	loadChunk(x, y, z, cb = noop, ecb = noop)
	{
		return fs.readFile(getChunkPath(x, y, z), (err, data) => {
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
		fs.writeFile(getChunkPath(x, y, z), data, err => {
			if(err) {
				ecb();
			}
			else {
				cb();
			}
		});
	}
	
	storeBlock(x, y, z, t, cb = noop, ecb = noop)
	{
		let i = getLinearBlockIndex(getLocalPos(x, y, z));
		
		fs.open(getChunkPath(...cp), "r+", (err, fd) => {
			if(err) {
				ecb();
			}
			else {
				fs.write(fd, new Uint8Array([t]), 0, 1, i, (err, bw, buf) => {
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
