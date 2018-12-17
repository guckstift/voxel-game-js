import {Field} from "../src/field.js";
import {getChunkPos} from "../src/world.js";
import {Chunk} from "./chunk.js";
import {Generator} from "./generator.js";

export class World
{
	constructor(store)
	{
		this.chunks = new Field(this.chunkFactory.bind(this));
		this.generator = new Generator();
		this.store = store;
	}
	
	chunkFactory(x, y, z)
	{
		return new Chunk(x, y, z, this);
	}
	
	getChunk(x, y, z)
	{
		return this.chunks.get(x, y, z);
	}
	
	getChunkAt(x, y, z)
	{
		return this.getChunk(...getChunkPos(x, y, z));
	}
}
