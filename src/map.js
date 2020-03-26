import Chunk from "./chunk.js";

export default class Map
{
	constructor(display)
	{
		this.chunks = {};
		this.display = display;
	}
	
	getChunk(cx, cy)
	{
		if(this.chunks[cy] && this.chunks[cy][cx]) {
			return this.chunks[cy][cx];
		}
	}
	
	loadChunk(cx, cy)
	{
		if(!this.getChunk(cx, cy)) {
			if(!this.chunks[cy]) {
				this.chunks[cy] = {};
			}
			
			this.chunks[cy][cx] = new Chunk(this.display, cx, cy);
		}
	}
	
	getBlock(x, y, z)
	{
		let cx = Math.floor(x / 16);
		let cy = Math.floor(y / 16);
		let chunk = this.getChunk(cx, cy);
		
		return chunk ? chunk.getBlock(x - cx * 16, y - cy * 16, z) : 0;
	}
	
	draw(camera, sun)
	{
		for(let y in this.chunks) {
			if(this.chunks[y]) {
				for(let x in this.chunks[y]) {
					let chunk = this.chunks[y][x];
					
					chunk.draw(camera, sun);
				}
			}
		}
	}
	
	raymarch(start, vec)
	{
		let len      = Math.sqrt(vec[0] ** 2 + vec[1] ** 2 + vec[2] ** 2);
		let way      = 0;
		let axis     = 0;
		let voxpos   = [0,0,0];
		let step     = [0,0,0];
		let waydelta = [0,0,0];
		let waynext  = [0,0,0];
		
		for(let i=0; i<3; i++) {
			voxpos[i] = Math.floor(start[i]);
			
			if(vec[i] > 0) {
				waydelta[i] = +len / vec[i];
				waynext[i]  = waydelta[i] * (voxpos[i] + 1 - start[i]);
				step[i]     = +1;
			}
			else if(vec[i] < 0) {
				waydelta[i] = -len / vec[i];
				waynext[i]  = waydelta[i] * (start[i] - voxpos[i]);
				step[i]     = -1;
			}
			else {
				waynext[i] = Infinity;
			}
		}
		
		while(true) {
			if(waynext[0] < waynext[1] && waynext[0] < waynext[2]) {
				axis = 0;
			}
			else if(waynext[1] < waynext[2]) {
				axis = 1;
			}
			else {
				axis = 2;
			}
			
			way            = waynext[axis];
			waynext[axis] += waydelta[axis];
			voxpos[axis]  += step[axis];
			
			if(way >= len) {
				break;
			}
			
			if(this.getBlock(...voxpos) > 0) {
				return {axis, voxpos, step};
			}
		}
	}
}
