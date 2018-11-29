import * as matrix from "./matrix.js";
import * as vector3 from "./vector3.js";
import {noise3d} from "./noise.js";
import {radians} from "./math.js";

export const RAW_VERT_SIZE = 7;
export const VERT_SIZE = 6;
export const FACE_VERTS = 6;
export const BLOCK_FACES = 6;
export const CHUNK_WIDTH = 16;

export const RAW_FACE_SIZE = FACE_VERTS * RAW_VERT_SIZE;
export const FACE_SIZE = FACE_VERTS * VERT_SIZE;
export const BLOCK_SIZE = BLOCK_FACES * FACE_SIZE;

export let vertSrc = `
	uniform mat4 proj;
	uniform mat4 viewmodel;
	uniform vec3 sun;

	attribute vec3 pos;
	attribute vec2 texcoord;
	attribute float faceid;

	varying vec2 vTexcoord;
	varying float vCoef;

	void main()
	{
		gl_Position = proj * viewmodel * vec4(pos, 1.0);

		vTexcoord = texcoord / 16.0;
		
		vec3 normal =
			faceid == 0.0 ? vec3(0, 0, -1) :
			faceid == 1.0 ? vec3(+1, 0, 0) :
			faceid == 2.0 ? vec3(0, 0, +1) :
			faceid == 3.0 ? vec3(-1, 0, 0) :
			faceid == 4.0 ? vec3(0, +1, 0) :
			faceid == 5.0 ? vec3(0, -1, 0) :
			vec3(0,0,0);
		
		vCoef = 0.5 + max(0.0, dot(normal, -sun)) * 0.5;
	}
`;

export let fragSrc = `
	precision highp float;

	uniform sampler2D tex;

	varying vec2 vTexcoord;
	varying float vCoef;

	void main()
	{
		gl_FragColor = texture2D(tex, vTexcoord);
		gl_FragColor.rgb *= vCoef;
	}
`;

let model = matrix.identity();

function getLinearBlockIndex(x, y, z)
{
	return x + y * CHUNK_WIDTH + z * CHUNK_WIDTH * CHUNK_WIDTH;
}

export class Chunk
{
	constructor(x, y, z, display, camera)
	{
		this.x = x;
		this.y = y;
		this.z = z;
		this.display = display;
		this.camera = camera;
		this.meshsize = 0;
		this.vertnum = 0;
		this.data = new Uint8Array(CHUNK_WIDTH ** 3);
		this.mesh = new Uint8Array(CHUNK_WIDTH ** 3 * BLOCK_SIZE);
		this.buf = this.display.createStaticByteBuffer(this.mesh);
		this.shader = display.getShader("chunk", vertSrc, fragSrc);
		this.atlas = display.getTexture("gfx/atlas.png");
		
		for(let bx = 0; bx < CHUNK_WIDTH; bx++) {
			for(let by = 0; by < CHUNK_WIDTH; by++) {
				for(let bz = 0; bz < CHUNK_WIDTH; bz++) {
					let i = getLinearBlockIndex(bx, by, bz);
					let lx = bx + x * CHUNK_WIDTH;
					let ly = by + y * CHUNK_WIDTH;
					let lz = bz + z * CHUNK_WIDTH;
					
					if(lx + ly < 0) {
						this.data[i] = noise3d(lx, ly, lz, 0) * 4;
					}
					else {
						this.data[i] = 0;
					}
				}
			}
		}
		
		this.updateMesh();
	}
	
	getBlock(x, y, z)
	{
		if(x < 0 || y < 0 || z < 0 || x >= CHUNK_WIDTH || y >= CHUNK_WIDTH || z >= CHUNK_WIDTH) {
			return null;
		}
		
		let i = getLinearBlockIndex(x, y, z);
		let t = this.data[i];
		let block = blocks[t];
		
		return block;
	}
	
	setBlock(x, y, z, t)
	{
		if(x < 0 || y < 0 || z < 0 || x >= CHUNK_WIDTH || y >= CHUNK_WIDTH || z >= CHUNK_WIDTH) {
			return;
		}
		
		let i = getLinearBlockIndex(x, y, z);
		
		this.data[i] = t;
		this.updateMesh();
	}
	
	updateMesh()
	{
		let gl = this.display.gl;
		
		this.meshsize = 0;
		this.vertnum = 0;

		for(let z=0; z < CHUNK_WIDTH; z++) {
			for(let y=0; y < CHUNK_WIDTH; y++) {
				for(let x=0; x < CHUNK_WIDTH; x++) {
					let block = this.getBlock(x, y, z);
			
					if(block) {
						this.addFaceIfVisible(block, x,y,z,  0, 0,-1, 0); // front
						this.addFaceIfVisible(block, x,y,z, +1, 0, 0, 1); // right
						this.addFaceIfVisible(block, x,y,z,  0, 0,+1, 2); // back
						this.addFaceIfVisible(block, x,y,z, -1, 0, 0, 3); // left
						this.addFaceIfVisible(block, x,y,z,  0,+1, 0, 4); // top
						this.addFaceIfVisible(block, x,y,z,  0,-1, 0, 5); // bottom
					}
				}
			}
		}
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.mesh.subarray(0, this.meshsize));
	}
	
	addFaceIfVisible(block, x, y, z, ax, ay, az, faceid)
	{
		if(!this.getBlock(x + ax, y + ay, z + az)) {
			let target = this.mesh.subarray(this.meshsize);
			let face = block.subarray(FACE_SIZE * faceid, FACE_SIZE * (faceid + 1));

			target.set(face);

			for(let k=0; k < FACE_VERTS; k++) {
				let vertex = target.subarray(k * VERT_SIZE);

				vertex[0] += x;
				vertex[1] += y;
				vertex[2] += z;
			}
		
			this.meshsize += FACE_SIZE;
			this.vertnum += FACE_VERTS;
		}
	}

	draw()
	{
		if(this.vertnum > 0) {
			this.drawTriangles(
				this.buf, this.vertnum,
				this.x * CHUNK_WIDTH, this.y * CHUNK_WIDTH, this.z * CHUNK_WIDTH,
				this.atlas
			);
		}
	}

	drawTriangles(buf, vertnum, x, y, z, tex)
	{
		let gl = this.display.gl;
		
		matrix.translation(x, y, z, model);
		
		this.shader.uniformMatrix4fv("viewmodel", this.camera.getViewModel(x, y, z));
		this.shader.uniformTex("tex", tex, 0);
		
		this.shader.vertexAttrib("pos",      buf, 3, true, VERT_SIZE, 0);
		this.shader.vertexAttrib("texcoord", buf, 2, true, VERT_SIZE, 3);
		this.shader.vertexAttrib("faceid",   buf, 1, true, VERT_SIZE, 5);
		
		gl.drawArrays(gl.TRIANGLES, 0, vertnum);
	}
}

function createCube(slots, out = new Float32Array(BLOCK_SIZE))
{
	let r = radians(90);
	let s = radians(180);
	
	createQuad(0, 0, 0,  0, 0, 0,  slots[0], out.subarray(FACE_SIZE * 0)); // front
	createQuad(1, 0, 0,  0, r, 0,  slots[1], out.subarray(FACE_SIZE * 1)); // right
	createQuad(1, 0, 1,  0, s, 0,  slots[2], out.subarray(FACE_SIZE * 2)); // back
	createQuad(0, 0, 1,  0,-r, 0,  slots[3], out.subarray(FACE_SIZE * 3)); // left
	createQuad(0, 1, 0,  r, 0, 0,  slots[4], out.subarray(FACE_SIZE * 4)); // top
	createQuad(0, 0, 1, -r, 0, 0,  slots[5], out.subarray(FACE_SIZE * 5)); // bottom
	
	return out;
}

function createByteCube(slots, out = new Uint8Array(BLOCK_SIZE))
{
	let r = radians(90);
	let s = radians(180);
	
	createByteQuad(0, 0, 0,  0, 0, 0,  slots[0], 0, out.subarray(FACE_SIZE * 0)); // front
	createByteQuad(1, 0, 0,  0, r, 0,  slots[1], 1, out.subarray(FACE_SIZE * 1)); // right
	createByteQuad(1, 0, 1,  0, s, 0,  slots[2], 2, out.subarray(FACE_SIZE * 2)); // back
	createByteQuad(0, 0, 1,  0,-r, 0,  slots[3], 3, out.subarray(FACE_SIZE * 3)); // left
	createByteQuad(0, 1, 0,  r, 0, 0,  slots[4], 4, out.subarray(FACE_SIZE * 4)); // top
	createByteQuad(0, 0, 1, -r, 0, 0,  slots[5], 5, out.subarray(FACE_SIZE * 5)); // bottom
	
	return out;
}

let front = new Float32Array([
	0, 0, 0, 1,  0, 1,  0,
	1, 0, 0, 1,  1, 1,  0,
	0, 1, 0, 1,  0, 0,  0,
	0, 1, 0, 1,  0, 0,  0,
	1, 0, 0, 1,  1, 1,  0,
	1, 1, 0, 1,  1, 0,  0,
]);

function createByteQuad(x, y, z, ax, ay, az, slot, faceid, out = new Uint8Array(FACE_SIZE))
{
	let floatquad = createQuad(x, y, z, ax, ay, az, slot, faceid);
	
	for(let i=0; i < FACE_VERTS; i++) {
		let o  = i * VERT_SIZE;
		let o2 = i * RAW_VERT_SIZE;
		let v = out.subarray(o);
		let f = floatquad.subarray(o2);
		
		v.set(f.subarray(0, 3));
		v[3] = f[4] * 16;
		v[4] = f[5] * 16;
		v[5] = f[6];
	}
	
	return out;
}

function createQuad(x, y, z, ax, ay, az, slot, faceid, out = new Float32Array(RAW_FACE_SIZE))
{
	let m = matrix.identity();
	let sx = slot % 16;
	let sy = Math.floor(slot / 16);
	
	matrix.translate(m, x, y, z, m);
	matrix.rotateX(m, ax, m);
	matrix.rotateY(m, ay, m);
	matrix.rotateZ(m, az, m);
	
	for(let i=0; i < FACE_VERTS; i++) {
		let o = i * RAW_VERT_SIZE;
		let v = out.subarray(o);
		let t = v.subarray(4);
		
		v.set(front.subarray(o, o + RAW_VERT_SIZE));
		vector3.transform(v, m, v);
		vector3.round(v, v);
		t[0] = (sx + t[0]) / 16;
		t[1] = (sy + t[1]) / 16;
		t[2] = faceid;
	}
	
	return out;
}

let blocks = [
	null, // air
	createByteCube([2, 2, 2, 2, 0, 1]), // grass
	createByteCube([3, 3, 3, 3, 3, 3]), // stone
	createByteCube([1, 1, 1, 1, 1, 1]), // dirt
];
