import * as matrix from "./matrix.js";
import * as vector from "./vector.js";

export class Chunk
{
	constructor(x, y, z, display)
	{
		this.x = x;
		this.y = y;
		this.z = z;
		this.data = new Uint8Array(16 ** 3);

		for(let i=0; i<16**3; i++) {
			this.data[i] = Math.floor(Math.random() * 3);
		}

		this.mesh = new Float32Array(16 ** 3 * 6 * 2 * 3 * 6);

		for(let z=0; z<16; z++) {
			for(let y=0; y<16; y++) {
				for(let x=0; x<16; x++) {
					let i = x + y * 16 + z * 16 * 16;
					let t = this.data[i];
					let block = blocks[t];
			
					if(block) {
						let target = this.mesh.subarray(i * 6 * 2 * 3 * 6);
				
						target.set(block);
				
						for(let k=0; k < 6 * 2 * 3; k++) {
							let vertex = target.subarray(k * 6);
					
							vertex[0] += x;
							vertex[1] += y;
							vertex[2] += z;
						}
					}
				}
			}
		}

		this.buf = display.createStaticFloatBuffer(this.mesh);
	}
}

function createCube(slots, out = new Float32Array(6 * 6 * 6))
{
	let r = Math.PI / 2;
	let s = Math.PI;
	
	createQuad(0, 0, 0,  0, 0, 0,  slots[0], out.subarray(6 * 6 * 0)); // front
	createQuad(1, 0, 0,  0, r, 0,  slots[1], out.subarray(6 * 6 * 1)); // right
	createQuad(1, 0, 1,  0, s, 0,  slots[2], out.subarray(6 * 6 * 2)); // back
	createQuad(0, 0, 1,  0,-r, 0,  slots[3], out.subarray(6 * 6 * 3)); // left
	createQuad(0, 1, 0,  r, 0, 0,  slots[4], out.subarray(6 * 6 * 4)); // top
	createQuad(0, 0, 1, -r, 0, 0,  slots[5], out.subarray(6 * 6 * 5)); // bottom
	
	return out;
}

let front = new Float32Array([
	0, 0, 0, 1,  0, 1,
	1, 0, 0, 1,  1, 1,
	0, 1, 0, 1,  0, 0,
	0, 1, 0, 1,  0, 0,
	1, 0, 0, 1,  1, 1,
	1, 1, 0, 1,  1, 0,
]);

function createQuad(x, y, z, ax, ay, az, slot, out = new Float32Array(6 * 6))
{
	let m = matrix.identity();
	let sx = slot % 16;
	let sy = Math.floor(slot / 16);
	
	matrix.translate(m, x, y, z, m);
	matrix.rotateX(m, ax, m);
	matrix.rotateY(m, ay, m);
	matrix.rotateZ(m, az, m);
	
	for(let i=0; i<6; i++) {
		let o = i * 6;
		let v = out.subarray(o);
		let t = v.subarray(4);
		
		v.set(front.subarray(o, o + 6));
		vector.transform(v, m, v);
		vector.round(v, v);
		t[0] = (sx + t[0]) / 16;
		t[1] = (sy + t[1]) / 16;
	}
	
	return out;
}

let blocks = [
	null, // air
	createCube([2, 2, 2, 2, 0, 1]), // grass
	createCube([3, 3, 3, 3, 3, 3]), // stone
];
