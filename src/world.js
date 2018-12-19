import {Chunk, CHUNK_WIDTH} from "./chunk.js";
import {raycast} from "./raycast.js";
import {boxcast} from "./boxcast.js";
import {radians} from "./math.js";
import {blocks} from "./blocks.js";
import {Field} from "./field.js";
import * as vector from "./vector.js";
import {chunkSrc} from "./glsl.js";

export function getChunkPos(x, y, z)
{
	return [
		Math.floor(x / CHUNK_WIDTH),
		Math.floor(y / CHUNK_WIDTH),
		Math.floor(z / CHUNK_WIDTH),
	];
}

export function getLocalPos(x, y, z)
{
	let chunkPos = getChunkPos(x, y, z);

	return [
		x - chunkPos[0] * CHUNK_WIDTH,
		y - chunkPos[1] * CHUNK_WIDTH,
		z - chunkPos[2] * CHUNK_WIDTH,
	];
}

export class World
{
	constructor(display, camera, server)
	{
		this.solidBlock = this.solidBlock.bind(this);
		this.chunks = new Field(this.chunkFactory.bind(this));
		this.display = display;
		this.camera = camera;
		this.server = server;
		this.shader = display.getShader("chunk", chunkSrc.vert, chunkSrc.frag);
		this.sun = vector.create(0, -1, 0);
		
		vector.rotateX(this.sun, radians(-30), this.sun);
		vector.rotateY(this.sun, radians(-30), this.sun);
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

	getBlockId(x, y, z)
	{
		let chunkPos = getChunkPos(x, y, z);
		let localPos = getLocalPos(x, y, z);

		return this.getChunk(...chunkPos).getBlockId(...localPos);
	}
	
	getBlock(x, y, z)
	{
		let chunkPos = getChunkPos(x, y, z);
		let localPos = getLocalPos(x, y, z);

		return this.getChunk(...chunkPos).getBlock(...localPos);
	}
	
	getBlockType(x, y, z)
	{
		let chunkPos = getChunkPos(x, y, z);
		let localPos = getLocalPos(x, y, z);

		return this.getChunk(...chunkPos).getBlockType(...localPos);
	}

	solidBlock(p)
	{
		return this.getBlockType(...p) === 1;
	}
	
	setBlockId(x, y, z, id)
	{
		let chunkPos = getChunkPos(x, y, z);
		let localPos = getLocalPos(x, y, z);
		
		this.server.setBlock(x, y, z, id);

		return this.getChunk(...chunkPos).setBlockId(...localPos, id);
	}

	hitBlock(dirvec, pos, raylength = 8)
	{
		let hit = this.raycast(
			pos,
			[dirvec[0] * raylength,
			dirvec[1] * raylength,
			dirvec[2] * raylength],
			this.solidBlock,
		);

		if(hit) {
			let isec = hit.hitpos;
			let blockpos = hit.voxpos;
			let sqdist = vector.squareDist(pos, isec);
			let dist = vector.dist(pos, isec);
			let axis = hit.axis;
			let normal = hit.normal;

			let faceid = (
				hit.normal[0] > 0 ? 1 :
				hit.normal[0] < 0 ? 3 :
				hit.normal[1] > 0 ? 4 :
				hit.normal[1] < 0 ? 5 :
				hit.normal[2] > 0 ? 2 :
				hit.normal[2] < 0 ? 0 :
				0
			);

			return {isec, blockpos, sqdist, dist, faceid, axis, normal};
		}
	}

	raycast(start, vec)
	{
		return raycast(start, vec, this.solidBlock);
	}

	boxcast(boxmin, boxmax, vec)
	{
		return boxcast(boxmin, boxmax, vec, this.solidBlock);
	}

	draw()
	{
		this.shader.use();
		this.shader.uniformMatrix4fv("proj", this.camera.getProjection());
		this.shader.uniform3fv("sun", this.sun);
		this.chunks.each(chunk => chunk.draw());
	}
}
