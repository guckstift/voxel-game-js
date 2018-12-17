import {CHUNK_SIZE} from "../src/chunk.js";

export class Chunk
{
	constructor(x, y, z, world)
	{
		this.x = x;
		this.y = y;
		this.z = z;
		this.world = world
		this.data = new Uint8Array(CHUNK_SIZE);
		this.loaded = false;
		this.queue = [];
		
		world.store.loadChunk(x, y, z, data => {
			this.data.set(data);
			this.loaded = true;
			this.processQueue();
		}, () => {
			this.data.set(world.generator.generateChunk(x, y, z));
			this.loaded = true;
			this.processQueue();
		});
	}
	
	enqueue(cb)
	{
		this.queue.push(cb);
	}
	
	processQueue()
	{
		while(this.queue.length > 0) {
			this.queue.shift()();
		}
	}
}
