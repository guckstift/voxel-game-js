import {Chunk, CHUNK_WIDTH} from "./chunk.js";
import * as vector from "./vector.js";
import * as vector3 from "./vector3.js";

export class World
{
	constructor(display)
	{
		this.display = display;
		this.chunks = {};
	}
	
	touchChunk(x, y, z)
	{
		if(!this.chunks[z]) {
			this.chunks[z] = {};
		}
		
		let slice = this.chunks[z];
		
		if(!slice[y]) {
			slice[y] = {};
		}
		
		let column = slice[y];
		
		if(!column[x]) {
			column[x] = new Chunk(x, y, z, this.display);
		}
	}
	
	getChunkPos(x, y, z)
	{
		return [
			Math.floor(x / CHUNK_WIDTH),
			Math.floor(y / CHUNK_WIDTH),
			Math.floor(z / CHUNK_WIDTH),
		];
	}
	
	getLocalPos(x, y, z)
	{
		let chunkPos = this.getChunkPos(x, y, z);
		
		return [
			x - chunkPos[0] * CHUNK_WIDTH,
			y - chunkPos[1] * CHUNK_WIDTH,
			z - chunkPos[2] * CHUNK_WIDTH,
		];
	}
	
	getChunk(x, y, z)
	{
		if(!this.chunks[z]) {
			return null;
		}
		
		let slice = this.chunks[z];
		
		if(!slice[y]) {
			return null;
		}
		
		let column = slice[y];
		
		if(!column[x]) {
			return null;
		}
		
		return column[x];
	}
	
	getBlock(x, y, z)
	{
		let chunkPos = this.getChunkPos(x, y, z);
		let localPos = this.getLocalPos(x, y, z);
		let chunk = this.getChunk(...chunkPos);
		
		if(!chunk) {
			return null;
		}
		
		return chunk.getBlock(...localPos);
	}
	
	hitBlock(camera, steps = 8)
	{
		let dirvec = camera.getDirVec();
		let sample = camera.pos.slice();
		let diry_dirx = dirvec[1] / dirvec[0];
		let dirz_dirx = dirvec[2] / dirvec[0];
		let dirx_diry = dirvec[0] / dirvec[1];
		let dirz_diry = dirvec[2] / dirvec[1];
		let dirx_dirz = dirvec[0] / dirvec[2];
		let diry_dirz = dirvec[1] / dirvec[2];
		let results = [];
		
		for(let i=0; i<steps; i++) {
			// left or right face hit
			if(dirvec[0] !== 0) {
				let isleft  = dirvec[0] > 0;
				let isright = dirvec[0] < 0;
				let isecx = isleft ? Math.ceil(sample[0]) : Math.floor(sample[0]);
				let dx    = isecx - sample[0];
				let isecy = sample[1] + diry_dirx * dx;
				let isecz = sample[2] + dirz_dirx * dx;
				let blocky = Math.floor(isecy);
				let blockz = Math.floor(isecz);
				let blockBefore = this.getBlock(isecx - isleft,  blocky, blockz);
				let blockAfter  = this.getBlock(isecx - isright, blocky, blockz);
			
				if(!blockBefore && blockAfter) {
					let isec = [isecx, isecy, isecz];
					let blockpos = [isecx - isright, blocky, blockz];
					let sqdist = vector3.squareDist(camera.pos, isec);
					let faceid = isleft ? 3 : 1;
					
					results.push({isec, blockpos, sqdist, faceid});
				}
			}
			
			// bottom or top face hit
			if(dirvec[1] !== 0) {
				let isbot = dirvec[1] > 0;
				let istop = dirvec[1] < 0;
				let isecy = isbot ? Math.ceil(sample[1]) : Math.floor(sample[1]);
				let dy    = isecy - sample[1];
				let isecx = sample[0] + dirx_diry * dy;
				let isecz = sample[2] + dirz_diry * dy;
				let blockx = Math.floor(isecx);
				let blockz = Math.floor(isecz);
				let blockBefore = this.getBlock(blockx, isecy - isbot, blockz);
				let blockAfter  = this.getBlock(blockx, isecy - istop, blockz);
			
				if(!blockBefore && blockAfter) {
					let isec = [isecx, isecy, isecz];
					let blockpos = [blockx, isecy - istop, blockz];
					let sqdist = vector3.squareDist(camera.pos, isec);
					let faceid = isbot ? 5 : 4;
					
					results.push({isec, blockpos, sqdist, faceid});
				}
			}
			
			// front or back face hit
			if(dirvec[2] !== 0) {
				let isfront = dirvec[2] > 0;
				let isback  = dirvec[2] < 0;
				let isecz = isfront ? Math.ceil(sample[2]) : Math.floor(sample[2]);
				let dz    = isecz - sample[2];
				let isecx = sample[0] + dirx_dirz * dz;
				let isecy = sample[1] + diry_dirz * dz;
				let blockx = Math.floor(isecx);
				let blocky = Math.floor(isecy);
				let blockBefore = this.getBlock(blockx, blocky, isecz - isfront);
				let blockAfter  = this.getBlock(blockx, blocky, isecz - isback);
			
				if(!blockBefore && blockAfter) {
					let isec = [isecx, isecy, isecz];
					let blockpos = [blockx, blocky, isecz - isback];
					let sqdist = vector3.squareDist(camera.pos, isec);
					let faceid = isfront ? 0 : 2;
					
					results.push({isec, blockpos, sqdist, faceid});
				}
			}
			
			if(results.length >= 3) {
				break;
			}
			
			vector.add(sample, dirvec, sample);
		}
		
		if(results.length) {
			return results.reduce((min, cur) => cur.sqdist < min.sqdist ? cur : min);
		}
		
		return null;
	}
}
