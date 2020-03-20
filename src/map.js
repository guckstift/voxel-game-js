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
}
