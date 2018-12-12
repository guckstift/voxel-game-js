(function () {
	'use strict';

	let noop = () => {};
	let zeroKey = new Uint8Array(4);
	let idctr = 0;

	class SocketServer
	{
		constructor(port = 12345)
		{
			this.http = require("http");
			this.crypto = require("crypto");
			this.fs = require("fs");
			this.onNewClient = noop;

			this.server = this.http.createServer((req, res) => {
				if(
					req.headers.upgrade === "websocket" &&
					req.headers.connection === "Upgrade" &&
					req.headers["sec-websocket-version"] === "13"
				) {
					let clientKey = req.headers["sec-websocket-key"];
					let serverKey = this.createServerKey(clientKey);

					res.statusCode = 101;
					res.setHeader("Upgrade", "websocket");
					res.setHeader("Connection", "upgrade");
					res.setHeader("Sec-WebSocket-Accept", serverKey);
					res.setHeader("Sec-WebSocket-Protocol", "blockweb");
					res.end();

					let client = new Client(req.socket);

					this.onNewClient(client);
				}
				else if(req.method === "GET") {
					let url = req.url;
					let ext = url.split(".").pop();

					console.log(url);

					if(url === "/") {
						url = "/index.html";
					}

					this.fs.readFile(
						"." + url,
						(err, data) => {
							if(err) {
								res.statusCode = 404;
								res.end();
							}
							else {
								if(ext === "js") {
									res.setHeader("Content-Type", "application/javascript");
								}
								else if(ext === "html") {
									res.setHeader("Content-Type", "text/html");
								}
								else if(ext === "png") {
									res.setHeader("Content-Type", "image/png");
								}

								res.end(data);
							}
						}
					);
				}
			});

			this.server.listen(port);
		}

		createServerKey(clientKey)
		{
			return this.crypto
				.createHash("sha1")
				.update(clientKey + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
				.digest("base64");
		}
	}

	class Client
	{
		constructor(socket)
		{
			this.id = idctr++;
			this.socket = socket;
			this.socket.on("data", e => this.onData(e));
			this.type = 0;
			this.msgparts = [];
			this.message = "";
			this.onMessage = () => {};
		}

		sendData(...bufs)
		{
			let length = bufs.reduce((len, buf) => len + buf.byteLength, 0);
			let frame = new Uint8Array(length + 10);
			let i = 0;

			// fin / rsv / opc = 1 / 0 / 2
			frame[i++] = 0b10000010;

			if(length > 2**16 - 1) {
				frame[i++] = 127;
				frame[i++] = length >> 56 & 0xff;
				frame[i++] = length >> 48 & 0xff;
				frame[i++] = length >> 40 & 0xff;
				frame[i++] = length >> 32 & 0xff;
				frame[i++] = length >> 24 & 0xff;
				frame[i++] = length >> 16 & 0xff;
				frame[i++] = length >>  8 & 0xff;
				frame[i++] = length >>  0 & 0xff;
			}
			else if(length > 125) {
				frame[i++] = 126;
				frame[i++] = length >> 8 & 0xff;
				frame[i++] = length >> 0 & 0xff;
			}
			else {
				frame[i++] = length;
			}

			bufs.forEach(buf => {
				frame.set(new Uint8Array(buf.buffer), i);
				i += buf.byteLength;
			});

			this.socket.write(frame);
		}

		onData(data)
		{
			let frames = this.parseData(data);

			frames.forEach(frame => {
				if(frame.opc === 1) {
					throw "Error: client texts me. I don't want that!";
				}
				else if(frame.opc === 2) {
					this.type = frame.opc;
					this.msgparts = [frame.dec];
				}
				else if(frame.opc === 0) {
					this.msgparts.push(frame.dec);
				}

				if(this.type === 2 && (frame.opc === 0 || frame.opc === 2)) {
					if(frame.fin) {
						this.message = this.msgparts.reduce((left, right) => left.concat(right));
						this.msgparts = [];
						this.onMessage(this.message);
					}
				}
			});
		}

		parseData(buf)
		{
			let frames = [];

			while(buf.length > 0) {
				let frame = this.parseFrame(buf);

				frames.push(frame);
				buf = buf.subarray(frame.consumed);
			}

			return frames;
		}

		parseFrame(buf)
		{
			let consumed = 0;
			let key = zeroKey;
			let fin = (buf[0] & 0b10000000) >> 7;
			let rsv = (buf[0] &  0b1110000) >> 4;
			let opc = (buf[0] &     0b1111) >> 0;
			let msk = (buf[1] & 0b10000000) >> 7;
			let len = (buf[1] &  0b1111111) >> 0;

			if(len === 126) {
				len =  buf[2] << 8;
				len += buf[3];
				buf = buf.subarray(4);
				consumed += 4;
			}
			else if(len === 127) {
				len =  buf[2] << 56;
				len += buf[3] << 48;
				len += buf[4] << 40;
				len += buf[5] << 32;
				len += buf[6] << 24;
				len += buf[7] << 16;
				len += buf[8] << 8;
				len += buf[9];
				buf = buf.subarray(10);
				consumed += 10;
			}
			else {
				buf = buf.subarray(2);
				consumed += 2;
			}

			let dec = new Uint8Array(len);

			if(msk > 0) {
				key = buf.subarray(0, 4);
				buf = buf.subarray(4);
				consumed += 4;
			}

			for(let i=0; i < len; i++) {
				dec[i] = buf[i] ^ key[i % 4];
				consumed += 1;
			}

			// console.log("frame", fin, rsv, opc, msk, len, key, dec);

			return {fin, rsv, opc, msk, len, key, dec, consumed};
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

	function translation(x = 0, y = 0, z = 0, out = new Float32Array(16))
	{
		out.set([
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			x, y, z, 1,
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

	function create(x = 0, y = 0, z = 0, out = new Float32Array(3))
	{
		out[0] = x;
		out[1] = y;
		out[2] = z;
		
		return out;
	}

	function create64(x = 0, y = 0, z = 0, out = new Float64Array(3))
	{
		out[0] = x;
		out[1] = y;
		out[2] = z;
		
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

	function squareDist(a, b)
	{
		return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
	}

	function dist(a, b)
	{
		return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
	}

	function rotateX$1(v, a, out = new Float32Array(3))
	{
		let s = Math.sin(a);
		let c = Math.cos(a);
		
		return create(
			v[0],
			v[1] * c - v[2] * s,
			v[1] * s + v[2] * c,
			out,
		);
	}

	function rotateY$1(v, a, out = new Float32Array(3))
	{
		let s = Math.sin(a);
		let c = Math.cos(a);
		
		return create(
			v[0] * c - v[2] * s,
			v[1],
			v[0] * s + v[2] * c,
			out,
		);
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

	let vertSrc = `
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

		vCoef = 0.25 + max(0.0, dot(normal, -sun)) * 0.75;
	}
`;

	let fragSrc = `
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

	let model = identity();

	function getLinearBlockIndex(x, y, z)
	{
		return x + y * CHUNK_WIDTH + z * CHUNK_WIDTH * CHUNK_WIDTH;
	}

	class Chunk
	{
		constructor(x, y, z, display, camera, generator, store, inserver = false)
		{
			this.x = x;
			this.y = y;
			this.z = z;
			this.display = display;
			this.camera = camera;
			this.store = store;
			this.inserver = inserver;
			this.meshsize = 0;
			this.vertnum = 0;
			this.data = new Uint8Array(CHUNK_WIDTH ** 3);
			this.loading = true;
			this.onLoaded = () => {};

			if(!this.inserver) {
				this.mesh = new Uint8Array(CHUNK_WIDTH ** 3 * BLOCK_SIZE);
				this.buf = this.display.createStaticByteBuffer(this.mesh);
				this.shader = display.getShader("chunk", vertSrc, fragSrc);
				this.atlas = display.getTexture("gfx/atlas.png");
			}

			store.loadChunk(
				x, y, z,
				data => {
					this.data = data;
					this.loading = false;
					this.onLoaded();
					this.updateMesh();
				},
				() => {
					if(this.inserver) {
						generator.generateChunk(x, y, z, this.data.buffer);
						this.loading = false;
						this.onLoaded();
						this.updateMesh();
					}
					else {
						generator.requestChunk(x, y, z, this.data.buffer, (data) => {
							this.data = new Uint8Array(data);
							this.loading = false;
							this.onLoaded();
							this.updateMesh();
						});
					}
				},
			);
		}

		getBlock(x, y, z)
		{
			if(this.loading) {
				return blocks[1];
			}

			if(x < 0 || y < 0 || z < 0 || x >= CHUNK_WIDTH || y >= CHUNK_WIDTH || z >= CHUNK_WIDTH) {
				return blocks[0];
			}

			let i = getLinearBlockIndex(x, y, z);
			let t = this.data[i];
			let block = blocks[t];

			return block;
		}

		getBlockVerts(x, y, z)
		{
			if(x < 0 || y < 0 || z < 0 || x >= CHUNK_WIDTH || y >= CHUNK_WIDTH || z >= CHUNK_WIDTH) {
				return null;
			}

			let i = getLinearBlockIndex(x, y, z);
			let t = this.data[i];
			let block = blockverts[t];

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
			this.store.storeChunk(this);
		}

		setChunkData(data)
		{
			this.data.set(data);
			this.updateMesh();
			this.store.storeChunk(this);
		}

		updateMesh()
		{
			if(this.inserver) {
				return;
			}

			let gl = this.display.gl;

			this.meshsize = 0;
			this.vertnum = 0;

			for(let z=0; z < CHUNK_WIDTH; z++) {
				for(let y=0; y < CHUNK_WIDTH; y++) {
					for(let x=0; x < CHUNK_WIDTH; x++) {
						let block = this.getBlockVerts(x, y, z);

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
			if(this.getBlock(x + ax, y + ay, z + az).type === 0) {
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

			translation(x, y, z, model);

			this.shader.uniformMatrix4fv("viewmodel", this.camera.getViewModel(x, y, z));
			this.shader.uniformTex("tex", tex, 0);

			this.shader.vertexAttrib("pos",      buf, 3, true, VERT_SIZE, 0);
			this.shader.vertexAttrib("texcoord", buf, 2, true, VERT_SIZE, 3);
			this.shader.vertexAttrib("faceid",   buf, 1, true, VERT_SIZE, 5);

			gl.drawArrays(gl.TRIANGLES, 0, vertnum);
		}
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

	let sqrt  = Math.sqrt;
	let floor$1 = Math.floor;
	let ceil  = Math.ceil;
	let abs$1   = Math.abs;

	let dir      = create64();
	let voxpos   = create64();
	let step     = create64();
	let waydelta = create64();
	let waynext  = create64();

	function raycast(start, vec, getvox)
	{
		let len      = sqrt(vec[0] ** 2 + vec[1] ** 2 + vec[2] ** 2);
		let way      = 0;
		let axis     = 0;
		let distnext = 0;
		
		if(len === 0) {
			return;
		}
		
		for(let k=0; k<3; k++) {
			dir[k]      = vec[k] / len;
			waydelta[k] = abs$1(1 / dir[k]);
			
			if(dir[k] > 0) {
				step[k]   = 1;
				voxpos[k] = ceil(start[k]) - 1;
				distnext  = ceil(start[k]) - start[k];
			}
			else {
				step[k]   = -1;
				voxpos[k] = floor$1(start[k]);
				distnext  = start[k] - floor$1(start[k]);
			}
			
			if(waydelta[k] === Infinity) {
				waynext[k] = Infinity;
			}
			else {
				waynext[k] = waydelta[k] * distnext;
			}
		}
		
		while(way <= len) {
			if(waynext[0] < waynext[1] && waynext[0] < waynext[2]) {
				axis = 0;
			}
			else if(waynext[1] < waynext[2]) {
				axis = 1;
			}
			else {
				axis = 2;
			}
			
			way            = waynext[axis];
			waynext[axis] += waydelta[axis];
			voxpos[axis]  += step[axis];
			
			if(way <= len && getvox(voxpos)) {
				return {
					axis,
					voxpos: [
						voxpos[0],
						voxpos[1],
						voxpos[2],
					],
					hitpos: [
						start[0] + way * dir[0],
						start[1] + way * dir[1],
						start[2] + way * dir[2],
					],
					normal: [
						axis === 0 ? -step[0] : 0,
						axis === 1 ? -step[1] : 0,
						axis === 2 ? -step[2] : 0,
					],
				};
			}
		}
	}

	let sqrt$1  = Math.sqrt;
	let floor$2 = Math.floor;
	let ceil$1  = Math.ceil;
	let abs$2   = Math.abs;

	let dir$1      = create64();
	let lead     = create64();
	let voxpos$1   = create64();
	let leadvox  = create64();
	let trailvox = create64();
	let step$1     = create64();
	let waydelta$1 = create64();
	let waynext$1  = create64();

	function boxcast(boxmin, boxmax, vec, getvox)
	{
		let len      = sqrt$1(vec[0] ** 2 + vec[1] ** 2 + vec[2] ** 2);
		let way      = 0;
		let axis     = 0;
		let distnext = 0;
		let trail    = 0;
		
		if(len === 0) {
			return;
		}
		
		for(let k = 0; k < 3; k ++) {
			dir$1[k]      = vec[k] / len;
			waydelta$1[k] = abs$2(1 / dir$1[k]);
			
			if(dir$1[k] > 0) {
				step$1[k]     = 1;
				lead[k]     = boxmax[k];
				trail       = boxmin[k];
				leadvox[k]  = ceil$1(lead[k]) - 1;
				trailvox[k] = floor$2(trail);
				distnext    = ceil$1(lead[k]) - lead[k];
			}
			else {
				step$1[k]     = -1;
				lead[k]     = boxmin[k];
				trail       = boxmax[k];
				leadvox[k]  = floor$2(lead[k]);
				trailvox[k] = ceil$1(trail) - 1;
				distnext    = lead[k] - floor$2(lead[k]);
			}
			
			if(waydelta$1[k] === Infinity) {
				waynext$1[k] = Infinity;
			}
			else {
				waynext$1[k] = waydelta$1[k] * distnext;
			}
		}
		
		while(way <= len) {
			if(waynext$1[0] < waynext$1[1] && waynext$1[0] < waynext$1[2]) {
				axis = 0;
			}
			else if(waynext$1[1] < waynext$1[2]) {
				axis = 1;
			}
			else {
				axis = 2;
			}
			
			way             = waynext$1[axis];
			waynext$1[axis]  += waydelta$1[axis];
			leadvox[axis]  += step$1[axis];
			trailvox[axis] += step$1[axis];
			
			if(way <= len) {
				let stepx = step$1[0];
				let stepy = step$1[1];
				let stepz = step$1[2];
				let xs = axis === 0 ? leadvox[0] : trailvox[0];
				let ys = axis === 1 ? leadvox[1] : trailvox[1];
				let zs = axis === 2 ? leadvox[2] : trailvox[2];
				let xe = leadvox[0] + stepx;
				let ye = leadvox[1] + stepy;
				let ze = leadvox[2] + stepz;

				for(let x = xs; x !== xe; x += stepx) {
					for(let y = ys; y !== ye; y += stepy) {
						for(let z = zs; z !== ze; z += stepz) {
							voxpos$1[0] = x;
							voxpos$1[1] = y;
							voxpos$1[2] = z;
							
							if(getvox(voxpos$1)) {
								return {
									axis: axis,
									step: step$1[axis],
									pos:  lead[axis] + way * dir$1[axis],
								};
							}
						}
					}
				}
			}
		}
	}

	class ClientStore
	{
		constructor()
		{
			this.isready = false;
			this.requestid = 0;
			this.requests = {};

			this.ready = new Promise(res => {
				this.host = window.location.host;
				this.socket = new WebSocket("ws://" + this.host, "blockweb");
				this.socket.binaryType = "arraybuffer";

				this.socket.onopen = e => {
					res();
					this.isready = true;
				};

				this.socket.onerror = e => {
					console.log("WebSocket error", e);
				};

				this.socket.onmessage = e => {
					let requestid = new Int32Array(e.data)[0];
					let payload = new Uint8Array(e.data, 4);

					this.requests[requestid](payload);
				};
			});
		}

		loadChunk(x, y, z, cb, errcb)
		{
			if(this.isready) {
				let requestid = this.requestid++;

				this.requests[requestid] = cb;

				this.socket.send(
					new Int32Array([1, requestid, x, y, z]),
				);
			}
			else {
				this.ready.then(() => this.loadChunk(x, y, z, cb, errcb));
			}
		}

		storeChunk(chunk)
		{
			if(this.isready) {
				let requestid = this.requestid++;
				let dataOffs = 5 * 4;
				let buf8 = new Uint8Array(dataOffs + chunk.data.byteLength);
				let buf32 = new Int32Array(buf8.buffer, 0, dataOffs);

				buf32[0] = 2;
				buf32[1] = requestid;
				buf32[2] = chunk.x;
				buf32[3] = chunk.y;
				buf32[4] = chunk.z;
				buf8.set(chunk.data, dataOffs);

				// this.requests[requestid] = () => {});
				this.socket.send(buf8);

				// this.socket.send(
				// 	new Int32Array([2, requestid, chunk.x, chunk.y, chunk.z]),
				// );
				// this.socket.send(
				// 	chunk.data,
				// );
			}
			else {
				this.ready.then(() => this.storeChunk(chunk));
			}
				// let transaction = this.db.transaction(["chunks"], "readwrite");
				//
				// transaction.onerror = e => {
				// 	//console.log("transaction error", e);
				// };
				//
				// transaction.oncomplete = e => {
				// 	//console.log("transaction complete", e);
				// };
				//
				// let chunkStore = transaction.objectStore("chunks");
				// let data = chunk.data;
				//
				// let pos = [
				// 	chunk.x,
				// 	chunk.y,
				// 	chunk.z,
				// ];
				//
				// chunkStore.put({data, pos});
		}
	}

	class ServerStore
	{
		constructor()
		{
			this.fs = require("fs");
		}

		loadChunk(x, y, z, cb, errcb)
		{
			this.fs.readFile(
				`./chunks/${x}_${y}_${z}`,
				(err, data) => {
					if(err) {
						errcb();
					}
					else {
						cb(new Uint8Array(data));
					}
				},
			);
		}

		storeChunk(chunk)
		{
			this.fs.writeFile(
				`./chunks/${chunk.x}_${chunk.y}_${chunk.z}`,
				chunk.data,
				err => {
					if(err) {
						console.log("fs write err", err);
					}
				},
			);
		}
	}

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

	let env = "";

	try {
		if(window) {
			env = "web";
		}
	}
	catch(e) {
		try {
			if(module) {
				env = "node";
			}
		}
		catch(e) {
			env = "worker";
		}
	}

	class Generator
	{
		constructor()
		{
			this.counter = 0;
			this.callbacks = {};
			this.noise = new NoiseField(0, 8, 8);

			if(env === "worker") {
				onmessage = e => {
					//console.log("jup", e);

					this.generateChunk(e.data.x, e.data.y, e.data.z, e.data.buf);

					postMessage({buf: e.data.buf, id: e.data.id}, [e.data.buf]);
				};

				//console.log("worker running");
			}
			else if(env === "web") {
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

		requestChunk(x, y, z, buf, cb)
		{
			//console.log("request chunk");

			let id = this.counter++;

			this.callbacks[id] = cb;
			this.worker.postMessage({x, y, z, buf, id}, [buf]);
		}
	}

	if(env === "worker") {
		let generator = new Generator();
	}

	let sun = create(0, -1, 0);

	rotateX$1(sun, radians(-30), sun);
	rotateY$1(sun, radians(-30), sun);

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

	class World
	{
		constructor(display, camera)
		{
			this.inserver = !display;
			this.solidVoxel = this.solidVoxel.bind(this);
			this.getBlock = this.getBlock.bind(this);
			this.generator = new Generator();
			this.chunks = {};

			if(this.inserver) {
				this.store = new ServerStore();
			}
			else {
				this.store = new ClientStore();
				this.display = display;
				this.camera = camera;
				this.shader = display.getShader("chunk", vertSrc, fragSrc);
			}
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
				column[x] = new Chunk(
					x, y, z,
					this.display,
					this.camera,
					this.generator,
					this.store,
					this.inserver,
				);
			}

			return column[x];
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
				let sqdist = squareDist(pos, isec);
				let dist$$1 = dist(pos, isec);
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

				return {isec, blockpos, sqdist, dist: dist$$1, faceid, axis, normal};
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

	let port = 12345;

	if(process.argv[2] !== undefined) {
		port = parseInt(process.argv[2]);
	}
	else if(process.env.PORT) {
		port = parseInt(process.env.PORT);
	}

	console.log("Using port", port);

	let server = new SocketServer(port);
	let world = new World();

	server.onNewClient = client => {
		client.onMessage = data => {
			// console.log(data);
			let data32 = new Int32Array(data.buffer, 0, 2);
			let cmd = data32[0];
			let requestid = data32[1];

			// console.log("Message reqid", requestid);

			if(cmd === 1) {
				data32 = new Int32Array(data.buffer, 0, 5);
				let x = data32[2];
				let y = data32[3];
				let z = data32[4];

				console.log(
					"Client", client.id,
					"wants chunk", x, y, z,
					"reqid", requestid
				);

				let chunk = world.touchChunk(x, y, z);

				if(chunk.loading) {
					chunk.onLoaded = () => {
						client.sendData(new Int32Array([requestid]), chunk.data);
					};
				}
				else {
					client.sendData(new Int32Array([requestid]), chunk.data);
				}
			}
			else if(cmd === 2) {
				data32 = new Int32Array(data.buffer, 0, 5);
				let x = data32[2];
				let y = data32[3];
				let z = data32[4];

				console.log(
					"Client", client.id,
					"wants to store chunk", x, y, z,
					"reqid", requestid
				);

				world.touchChunk(x, y, z).setChunkData(data.subarray(5 * 4));
			}
		};
	};

}());
