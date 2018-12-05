var generator = (function (exports) {
	'use strict';

	class Field
	{
		constructor(factory = () => {})
		{
			this.factory = factory;
			this.array = Array(2 ** 32 - 1);
		}
		
		get(x, y, z)
		{
			x += 2 ** 31;
			y += 2 ** 31;
			z += 2 ** 31;
			
			if(this.array[z] === undefined) {
				this.array[z] = Array(2 ** 32 - 1);
			}
			
			let slice = this.array[z];
			
			if(slice[y] === undefined) {
				slice[y] = Array(2 ** 32 - 1);
			}
			
			let column = slice[y];
			
			if(column[x] === undefined) {
				column[x] = this.factory(x, y, z);
			}
			
			return column[x];
		}
		
		set(x, y, z, a)
		{
			x += 2 ** 31;
			y += 2 ** 31;
			z += 2 ** 31;
			
			if(this.array[z] === undefined) {
				this.array[z] = Array(2 ** 32 - 1);
			}
			
			let slice = this.array[z];
			
			if(slice[y] === undefined) {
				slice[y] = Array(2 ** 32 - 1);
			}
			
			let column = slice[y];
			
			column[x] = a;
		}
	}

	function noise3d(x, y, z, s)
	{
		x *= 15485863;   // mult with 1000000. prime
		y *= 285058399;  // mult with 15485863. prime
		z *= 6124192049; // mult with 285058399. prime
		x += y + z;
		x *= s || 1;
		x ^= x >> 2;   // xor with r-shift with 1. prime
		x ^= x << 5;   // xor with l-shift with 3. prime
		x ^= x >> 11;  // xor with r-shift with 5. prime
		x ^= x << 17;  // xor with l-shift with 7. prime
		x ^= x >> 23;  // xor with r-shift with 9. prime
		x ^= x << 31;  // xor with l-shift with 11. prime
		
		return (x + 0x80000000) / 0xFFffFFff;
	}

	const pi = Math.PI;

	function radians(d)
	{
		return d * pi / 180;
	}

	function smoothMix(a, b, x)
	{
		return a + x ** 2 * (3 - 2 * x) * (b - a);
	}

	function smoothMix3d(aaa, baa, aba, bba, aab, bab, abb, bbb, x, y, z)
	{
		return smoothMix(
			smoothMix(
				smoothMix(aaa, baa, x),
				smoothMix(aba, bba, x),
				y,
			),
			smoothMix(
				smoothMix(aab, bab, x),
				smoothMix(abb, bbb, x),
				y,
			),
			z,
		);
	}

	class NoiseField
	{
		constructor(seed = 0, amp = 1, scale = 1)
		{
			this.seed = seed;
			this.amp = amp;
			this.invscale = 1 / scale;
			this.samples = new Field((x, y, z) => this.amp * noise3d(x, y, z, this.seed));
		}
		
		sample(x, y, z)
		{
			x *= this.invscale;
			y *= this.invscale;
			z *= this.invscale;
			
			let ix  = Math.floor(x);
			let iy  = Math.floor(y);
			let iz  = Math.floor(z);
			let aaa = this.samples.get(ix,     iy,     iz);
			let baa = this.samples.get(ix + 1, iy,     iz);
			let aba = this.samples.get(ix,     iy + 1, iz);
			let bba = this.samples.get(ix + 1, iy + 1, iz);
			let aab = this.samples.get(ix,     iy,     iz + 1);
			let bab = this.samples.get(ix + 1, iy,     iz + 1);
			let abb = this.samples.get(ix,     iy + 1, iz + 1);
			let bbb = this.samples.get(ix + 1, iy + 1, iz + 1);
			
			return smoothMix3d(aaa, baa, aba, bba, aab, bab, abb, bbb, x - ix, y - iy, z - iz);
		}
	}

	function identity(out = new Float32Array(16))
	{
		out.set([
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1,
		]);
		
		return out;
	}

	function translate(m, x = 0, y = 0, z = 0, out = new Float32Array(16))
	{
		let a00 = m[0], a01 = m[1], a02 = m[2],  a03 = m[3];
		let a10 = m[4], a11 = m[5], a12 = m[6],  a13 = m[7];
		let a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
		
		out[0]  = a00;
		out[1]  = a01;
		out[2]  = a02;
		out[3]  = a03;
		out[4]  = a10;
		out[5]  = a11;
		out[6]  = a12;
		out[7]  = a13;
		out[8]  = a20;
		out[9]  = a21;
		out[10] = a22;
		out[11] = a23;
		out[12] = x * a00 + y * a10 + z * a20 + m[12];
		out[13] = x * a01 + y * a11 + z * a21 + m[13];
		out[14] = x * a02 + y * a12 + z * a22 + m[14];
		out[15] = x * a03 + y * a13 + z * a23 + m[15];
		
		return out;
	}

	function rotateX(m, a, out = new Float32Array(16))
	{
		let s = Math.sin(a);
		let c = Math.cos(a);
		
		let a10 = m[4], a11 = m[5], a12 = m[6],  a13 = m[7];
		let a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
		
		out[0]  =  m[0];
		out[1]  =  m[1];
		out[2]  =  m[2];
		out[3]  =  m[3];
		out[4]  =  c * a10 + s * a20;
		out[5]  =  c * a11 + s * a21;
		out[6]  =  c * a12 + s * a22;
		out[7]  =  c * a13 + s * a23;
		out[8]  = -s * a10 + c * a20;
		out[9]  = -s * a11 + c * a21;
		out[10] = -s * a12 + c * a22;
		out[11] = -s * a13 + c * a23;
		out[12] =  m[12];
		out[13] =  m[13];
		out[14] =  m[14];
		out[15] =  m[15];
		
		return out;
	}

	function rotateY(m, a = 0, out = new Float32Array(16))
	{
		let s = Math.sin(a);
		let c = Math.cos(a);
		
		let a00 = m[0], a01 = m[1], a02 = m[2],  a03 = m[3];
		let a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
		
		out[0]  =  c * a00 + s * a20;
		out[1]  =  c * a01 + s * a21;
		out[2]  =  c * a02 + s * a22;
		out[3]  =  c * a03 + s * a23;
		out[4]  =  m[4];
		out[5]  =  m[5];
		out[6]  =  m[6];
		out[7]  =  m[7];
		out[8]  = -s * a00 + c * a20;
		out[9]  = -s * a01 + c * a21;
		out[10] = -s * a02 + c * a22;
		out[11] = -s * a03 + c * a23;
		out[12] =  m[12];
		out[13] =  m[13];
		out[14] =  m[14];
		out[15] =  m[15];
		
		return out;
	}

	function rotateZ(m, a = 0, out = new Float32Array(16))
	{
		let s = Math.sin(a);
		let c = Math.cos(a);
		
		let a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3];
		let a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7];
		
		out[0]  =  c * a00 + s * a10;
		out[1]  =  c * a01 + s * a11;
		out[2]  =  c * a02 + s * a12;
		out[3]  =  c * a03 + s * a13;
		out[4]  = -s * a00 + c * a10;
		out[5]  = -s * a01 + c * a11;
		out[6]  = -s * a02 + c * a12;
		out[7]  = -s * a03 + c * a13;
		out[8]  =  m[8];
		out[9]  =  m[9];
		out[10] =  m[10];
		out[11] =  m[11];
		out[12] =  m[12];
		out[13] =  m[13];
		out[14] =  m[14];
		out[15] =  m[15];
		
		return out;
	}

	function transform(v, m, out = new Float32Array(3))
	{
		let x = v[0], y = v[1], z = v[2];
		let rw = 1 / (x * m[3] + y * m[7] + z * m[11] + m[15]);
		
		out.set([
			(x * m[0] + y * m[4] + z * m[8]  + m[12]) * rw,
			(x * m[1] + y * m[5] + z * m[9]  + m[13]) * rw,
			(x * m[2] + y * m[6] + z * m[10] + m[14]) * rw,
		]);
		
		return out;
	}

	function round(v, out = new Float32Array(3))
	{
		out[0] = Math.round(v[0]);
		out[1] = Math.round(v[1]);
		out[2] = Math.round(v[2]);
		
		return out;
	}

	/*
		types:
			0: empty/air
			1: solid
		faces:
			[front, right, back, left, top, bottom]
	*/

	let blocks = [
		{
			name: "air",
			type: 0,
		},
		{
			name: "grass",
			type: 1,
			faces: [2, 2, 2, 2, 0, 1],
		},
		{
			name: "stone",
			type: 1,
			faces: [3, 3, 3, 3, 3, 3],
		},
		{
			name: "dirt",
			type: 1,
			faces: [1, 1, 1, 1, 1, 1],
		},
	];

	const RAW_VERT_SIZE = 7;
	const VERT_SIZE = 6;
	const FACE_VERTS = 6;
	const BLOCK_FACES = 6;
	const CHUNK_WIDTH = 16;

	const RAW_FACE_SIZE = FACE_VERTS * RAW_VERT_SIZE;
	const FACE_SIZE = FACE_VERTS * VERT_SIZE;
	const BLOCK_SIZE = BLOCK_FACES * FACE_SIZE;

	let model = identity();

	function getLinearBlockIndex(x, y, z)
	{
		return x + y * CHUNK_WIDTH + z * CHUNK_WIDTH * CHUNK_WIDTH;
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
		let m = identity();
		let sx = slot % 16;
		let sy = Math.floor(slot / 16);
		
		translate(m, x, y, z, m);
		rotateX(m, ax, m);
		rotateY(m, ay, m);
		rotateZ(m, az, m);
		
		for(let i=0; i < FACE_VERTS; i++) {
			let o = i * RAW_VERT_SIZE;
			let v = out.subarray(o);
			let t = v.subarray(4);
			
			v.set(front.subarray(o, o + RAW_VERT_SIZE));
			transform(v, m, v);
			round(v, v);
			t[0] = (sx + t[0]) / 16;
			t[1] = (sy + t[1]) / 16;
			t[2] = faceid;
		}
		
		return out;
	}

	let blockverts = blocks.map(block => {
		if(block.type > 0) {
			return createByteCube(block.faces);
		}
		else {
			return null;
		}
	});

	class Generator
	{
		constructor(inworker = false)
		{
			this.inworker = inworker;
			this.counter = 0;
			this.callbacks = {};
			
			if(inworker) {
				this.noise = new NoiseField(0, 8, 8);
				
				onmessage = e => {
					//console.log("jup", e);
					
					this.generateChunk(e.data.x, e.data.y, e.data.z, e.data.buf);
					
					postMessage({buf: e.data.buf, id: e.data.id}, [e.data.buf]);
				};
				
				//console.log("worker running");
			}
			else {
				this.worker = new Worker("./src/generator.bundle.js");
				
				this.worker.onmessage = e => {
					this.callbacks[e.data.id](e.data.buf);
				};
				
				//console.log("client running");
			}
		}
		
		generateChunk(x, y, z, buf)
		{
			let data = new Uint8Array(buf);
			
			if(this.inworker) {
				for(let bx = 0; bx < CHUNK_WIDTH; bx++) {
					for(let by = 0; by < CHUNK_WIDTH; by++) {
						for(let bz = 0; bz < CHUNK_WIDTH; bz++) {
							let i = getLinearBlockIndex(bx, by, bz);
							let lx = bx + x * CHUNK_WIDTH;
							let ly = by + y * CHUNK_WIDTH;
							let lz = bz + z * CHUNK_WIDTH;
							let h = data[i] = this.noise.sample(lx, 0, lz);
				
							if(ly < h) {
								data[i] = this.noise.sample(lx, ly, lz) * 3 / 8 + 1;
							}
							else {
								data[i] = 0;
							}
						}
					}
				}
			}
		}
		
		requestChunk(x, y, z, buf, cb)
		{
			//console.log("request chunk");
			
			let id = this.counter++;
			
			this.callbacks[id] = cb;
			this.worker.postMessage({x, y, z, buf, id}, [buf]);
		}
	}

	try {
		window = window;
	}
	catch(e) {
		let generator = new Generator(true);
	}

	exports.Generator = Generator;

	return exports;

}({}));
