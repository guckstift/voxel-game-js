import {Chunk, CHUNK_WIDTH, vertSrc, fragSrc} from "./chunk.js";
import {raycast} from "./raycast.js";
import {boxcast} from "./boxcast.js";
import {radians} from "./math.js";
import {Store} from "./store.js";
import {blocks} from "./blocks.js";
import {Generator} from "./generator.js";
import {Field} from "./field.js";
import * as vector from "./vector.js";

let sun = vector.create(0, -1, 0);

vector.rotateX(sun, radians(-30), sun);
vector.rotateY(sun, radians(-30), sun);

function getChunkPos(x, y, z)
{
	return [
		Math.floor(x / CHUNK_WIDTH),
		Math.floor(y / CHUNK_WIDTH),
		Math.floor(z / CHUNK_WIDTH),
	];
}

function getLocalPos(x, y, z)
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
	constructor(display, camera)
	{
		this.inserver = !display;
		this.solidVoxel = this.solidVoxel.bind(this);
		this.getBlock = this.getBlock.bind(this);
		this.chunks = new Field(this.chunkFactory.bind(this));
		this.store = new Store();

		if(this.inserver) {
			this.generator = new Generator();
		}
		else {
			this.display = display;
			this.camera = camera;
			this.shader = display.getShader("chunk", vertSrc, fragSrc);
		}
	}

	chunkFactory(x, y, z)
	{
		return new Chunk(
			x, y, z,
			this.display,
			this.camera,
			this.generator,
			this.store,
			this.inserver,
		);
	}

	touchChunkAt(x, y, z)
	{
		let chunkPos = getChunkPos(x, y, z);

		this.touchChunk(...chunkPos);
	}

	touchChunk(x, y, z)
	{
		return this.chunks.get(x, y, z);
	}

	getChunk(x, y, z)
	{
		return this.chunks.softGet(x, y, z);
	}

	getBlock(x, y, z)
	{
		let chunkPos = getChunkPos(x, y, z);
		let localPos = getLocalPos(x, y, z);
		let chunk = this.getChunk(...chunkPos);

		if(!chunk) {
			return blocks[0];
		}

		return chunk.getBlock(...localPos);
	}

	solidVoxel(p)
	{
		return this.getBlock(...p).type > 0;
	}

	setBlock(x, y, z, t)
	{
		let chunkPos = getChunkPos(x, y, z);
		let localPos = getLocalPos(x, y, z);
		let chunk = this.getChunk(...chunkPos);

		if(!chunk) {
			return;
		}

		chunk.setBlock(...localPos, t);
	}

	hitBlock(dirvec, pos, raylength = 8)
	{
		let hit = raycast(
			[pos[0], pos[1], pos[2]],
			[dirvec[0] * raylength,
			dirvec[1] * raylength,
			dirvec[2] * raylength],
			this.solidVoxel,
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
		return raycast(start, vec, this.solidVoxel);
	}

	boxcast(boxmin, boxmax, vec)
	{
		return boxcast(boxmin, boxmax, vec, this.solidVoxel);
	}

	draw()
	{
		this.shader.use();
		this.shader.uniformMatrix4fv("proj", this.camera.getProjection());
		this.shader.uniform3fv("sun", sun.subarray(0, 3));
		this.chunks.each(chunk => chunk.draw());
	}
}
