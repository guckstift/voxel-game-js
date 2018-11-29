import {Chunk, CHUNK_WIDTH, vertSrc, fragSrc} from "./chunk.js";
import {raycast} from "./raycast.js";
import {boxcast} from "./boxcast.js";
import {radians} from "./math.js";
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
		this.solidVoxel = this.solidVoxel.bind(this);
		this.getBlock = this.getBlock.bind(this);
		this.display = display;
		this.camera = camera;
		this.shader = display.getShader("chunk", vertSrc, fragSrc);
		this.chunks = {};
	}
	
	touchChunkAt(x, y, z)
	{
		let chunkPos = getChunkPos(x, y, z);
		
		this.touchChunk(...chunkPos);
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
			column[x] = new Chunk(x, y, z, this.display, this.camera);
		}
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
		let chunkPos = getChunkPos(x, y, z);
		let localPos = getLocalPos(x, y, z);
		let chunk = this.getChunk(...chunkPos);
		
		if(!chunk) {
			return null;
		}
		
		return chunk.getBlock(...localPos);
	}
	
	solidVoxel(p)
	{
		return !!this.getBlock(...p);
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
			
			let faceid = (
				hit.normal[0] > 0 ? 1 :
				hit.normal[0] < 0 ? 3 :
				hit.normal[1] > 0 ? 4 :
				hit.normal[1] < 0 ? 5 :
				hit.normal[2] > 0 ? 2 :
				hit.normal[2] < 0 ? 0 :
				0
			);
			
			return {isec, blockpos, sqdist, dist, faceid, axis};
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
		
		for(let z in this.chunks) {
			let slice = this.chunks[z];
			
			for(let y in slice) {
				let column = slice[y];
				
				for(let x in column) {
					let chunk = column[x];
					
					chunk.draw();
				}
			}
		}
	}
}
