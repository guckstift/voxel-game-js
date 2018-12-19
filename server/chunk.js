import {CHUNK_SIZE, getLinearBlockIndex, posInChunk} from "../src/chunk.js";
import {Queue} from "../src/queue.js";

export class Chunk extends Queue
{
	constructor(x, y, z, world)
	{
		super();
		
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

	setBlockId(x, y, z, id)
	{
		if(posInChunk(x, y, z)) {
			if(this.loaded) {
				this.data[getLinearBlockIndex(x, y, z)] = id;
			}
			else {
				this.enqueue(() => this.setBlockId(x, y, z, id));
			}
		}
	}
}
