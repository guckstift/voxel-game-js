import {Chunk} from "./chunk.js";

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
}
