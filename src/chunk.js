import Shader from "./shader.js";
import Texture from "./texture.js";
import Buffer from "./buffer.js";
import Matrix from "./matrix.js";
import blocks from "./blocks.js";
import Generator from "./generator.js";

let vert = `
	uniform mat4 proj;
	uniform mat4 view;
	uniform mat4 model;
	uniform vec3 sun;
	attribute vec3 pos;
	attribute vec3 norm;
	attribute vec2 uv;
	attribute float face;
	attribute float ao;
	varying mediump vec2 vUv;
	varying mediump vec2 texOffs;
	varying mediump float factor;
	
	void main()
	{
		gl_Position = proj * view * model * vec4(pos, 1);
		vUv = uv;
		
		float texX = mod(face, 16.0);
		float texY = floor(face / 16.0);
		
		texOffs = vec2(texX, texY) / 16.0;
		
		float diffuse = max(0.0, dot(sun, norm));
		float ambient = (4.0 - ao) * 0.25;
		
		factor = mix(diffuse, ambient, 0.5);
	}
`;

let frag = `
	uniform sampler2D tex;
	varying mediump vec2 vUv;
	varying mediump vec2 texOffs;
	varying mediump float factor;
	
	void main()
	{
		mediump vec2 texCoord = texOffs + fract(vUv) / 16.0;
		
		gl_FragColor = texture2D(tex, texCoord);
		gl_FragColor.rgb *= factor;
	}
`;

export default class Chunk
{
	constructor(display, map, cx, cy)
	{
		this.shader = display.getCached("Chunk.shader", () => new Shader(display, vert, frag));
		this.texture = display.getCached("Chunk.texture", () => new Texture(display, "gfx/blocks.png"));
		this.buffer = new Buffer(display);
		this.transbuf = new Buffer(display);
		this.data = new Uint8Array(16 * 16 * 256);
		this.generator = new Generator();
		this.count = 0;
		this.transcount = 0;
		
		for(let z=0, i=0; z<256; z++) {
			for(let y=0; y<16; y++) {
				for(let x=0; x<16; x++, i++) {
					this.data[i] = this.generator.getBlock(
						x + cx * 16,
						y + cy * 16,
						z,
					);
				}
			}
		}
		
		this.gl = display.gl;
		this.display = display;
		this.map = map;
		this.cx = cx;
		this.cy = cy;
		this.invalid = true;
		
		this.invalidateVicinity();
		
		this.model = new Matrix();
		this.model.translate(cx * 16, cy * 16, 0);
	}
	
	getBlock(x, y, z)
	{
		if(x >= 0 && y >= 0 && z >= 0 && x < 16 && y < 16 && z < 256) {
			return this.data[x + y * 16 + z * 16 * 16];
		}
		
		if(z >= 0 && z < 256) {
			return this.map.getBlock(this.cx * 16 + x, this.cy * 16 + y, z);
		}
		
		return 0;
	}
	
	setBlock(x, y, z, b)
	{
		if(x >= 0 && y >= 0 && z >= 0 && x < 16 && y < 16 && z < 256) {
			this.data[x + y * 16 + z * 16 * 16] = b;
			this.invalid = true;
			
			let adjacentList = [];
			
			if(x === 0) {
				adjacentList.push(this.map.getChunk(this.cx - 1, this.cy));
			
				if(y === 0) {
					adjacentList.push(this.map.getChunk(this.cx - 1, this.cy - 1));
				}
				else if(y === 15) {
					adjacentList.push(this.map.getChunk(this.cx - 1, this.cy + 1));
				}
			}
			else if(x === 15) {
				adjacentList.push(this.map.getChunk(this.cx + 1, this.cy));
			
				if(y === 0) {
					adjacentList.push(this.map.getChunk(this.cx + 1, this.cy - 1));
				}
				else if(y === 15) {
					adjacentList.push(this.map.getChunk(this.cx + 1, this.cy + 1));
				}
			}
			
			if(y === 0) {
				adjacentList.push(this.map.getChunk(this.cx, this.cy - 1));
			}
			else if(y === 15) {
				adjacentList.push(this.map.getChunk(this.cx, this.cy + 1));
			}
			
			adjacentList.forEach(chunk => {
				if(chunk) {
					chunk.invalid = true;
				}
			});
		}
	}
	
	invalidateVicinity()
	{
		this.invalid = true;
		
		for(let y = -1; y <= +1; y++) {
			for(let x = -1; x <= +1; x++) {
				let chunk = this.map.getChunk(this.cx + x, this.cy + y);
				
				if(chunk) {
					chunk.invalid = true;
				}
			}
		}
	}
	
	update()
	{
		if(this.invalid) {
			this.remesh(false);
			this.remesh(true);
			this.invalid = false;
		}
	}
	
	remesh(meshTrans)
	{
		let gl = this.gl;
		let mesh = [];
		
		this.remeshSide(mesh, -1, 0, 0, 0, meshTrans, // left
			1, 2, 0, false, true, false,
			[-1,+1,+1], [-1, 0,+1], [-1,-1,+1],
			[-1,+1, 0],             [-1,-1, 0],
			[-1,+1,-1], [-1, 0,-1], [-1,-1,-1]);
		this.remeshSide(mesh,  0,-1, 0, 1, meshTrans, // front
			0, 2, 1, false, false, false,
			[-1,-1,+1], [ 0,-1,+1], [+1,-1,+1],
			[-1,-1, 0],             [+1,-1, 0],
			[-1,-1,-1], [ 0,-1,-1], [+1,-1,-1]);
		this.remeshSide(mesh,  0, 0,-1, 2, meshTrans, // bottom
			0, 1, 2, false, true, false,
			[-1,-1,-1], [ 0,-1,-1], [+1,-1,-1],
			[-1, 0,-1],             [+1, 0,-1],
			[-1,+1,-1], [ 0,+1,-1], [+1,+1,-1]);
		this.remeshSide(mesh, +1, 0, 0, 3, meshTrans, // right
			1, 2, 0, false, false, false,
			[+1,-1,+1], [+1, 0,+1], [+1,+1,+1],
			[+1,-1, 0],             [+1,+1, 0],
			[+1,-1,-1], [+1, 0,-1], [+1,+1,-1]);
		this.remeshSide(mesh,  0,+1, 0, 4, meshTrans, // back
			0, 2, 1, true, false, false,
			[+1,+1,+1], [ 0,+1,+1], [-1,+1,+1],
			[+1,+1, 0],             [-1,+1, 0],
			[+1,+1,-1], [ 0,+1,-1], [-1,+1,-1]);
		this.remeshSide(mesh,  0, 0,+1, 5, meshTrans, // top
			0, 1, 2, false, false, false,
			[-1,+1,+1], [ 0,+1,+1], [+1,+1,+1],
			[-1, 0,+1],             [+1, 0,+1],
			[-1,-1,+1], [ 0,-1,+1], [+1,-1,+1]);
		
		if(meshTrans) {
			this.transbuf.update(new Float32Array(mesh));
			this.transcount = mesh.length / 10;
		}
		else {
			this.buffer.update(new Float32Array(mesh));
			this.count = mesh.length / 10;
		}
	}
	
	remeshSide(
		mesh, nx, ny, nz, fid, meshTrans,
		ax0, ax1, ax2, fx, fy, fz, aov0, aov1, aov2, aov3, aov4, aov5, aov6, aov7
	) {
		let map = [];
		
		for(let z=0, i=0; z<256; z++) {
			for(let y=0; y<16; y++) {
				for(let x=0; x<16; x++, i++) {
					let block = this.getBlock(x, y, z);
					let adjacent = this.getBlock(x + nx, y + ny, z + nz);
					let transparent = blocks[block].transparent || false;
					let adjTrans = blocks[adjacent].transparent || false;
					
					if(meshTrans) {
						map[i] = (
							block > 0 && transparent === true && adjacent !== block && adjTrans === true
							? block
							: 0
						);
					}
					else {
						map[i] = (
							block > 0 && transparent === false && adjTrans === true
							? block
							: 0
						);
					}
					
					if(map[i] > 0) {
						let ao0 = this.getOcclusion(
							[x + aov3[0], y + aov3[1], z + aov3[2]],
							[x + aov5[0], y + aov5[1], z + aov5[2]],
							[x + aov6[0], y + aov6[1], z + aov6[2]],
						);
						
						let ao1 = this.getOcclusion(
							[x + aov4[0], y + aov4[1], z + aov4[2]],
							[x + aov7[0], y + aov7[1], z + aov7[2]],
							[x + aov6[0], y + aov6[1], z + aov6[2]],
						);
						
						let ao2 = this.getOcclusion(
							[x + aov3[0], y + aov3[1], z + aov3[2]],
							[x + aov0[0], y + aov0[1], z + aov0[2]],
							[x + aov1[0], y + aov1[1], z + aov1[2]],
						);
						
						let ao3 = this.getOcclusion(
							[x + aov4[0], y + aov4[1], z + aov4[2]],
							[x + aov2[0], y + aov2[1], z + aov2[2]],
							[x + aov1[0], y + aov1[1], z + aov1[2]],
						);
						
						map[i] |= ao0 << 8 | ao1 << 10 | ao2 << 12 | ao3 << 14;
					}
				}
			}
		}
		
		let a = [fx ? 15 : 0,  fy ? 15 : 0,  fz ? 255 : 0];
		let b = [fx ? -1 : 16, fy ? -1 : 16, fz ? -1  : 256];
		let s = [fx ? -1 : +1, fy ? -1 : +1, fz ? -1  : +1];
		let i = [0,0,0];
		let j = [0,0,0];
		let k = [0,0,0];
		
		for(i[ax2] = a[ax2]; i[ax2] !== b[ax2]; i[ax2] += s[ax2]) {
			for(i[ax1] = a[ax1]; i[ax1] !== b[ax1]; i[ax1] += s[ax1]) {
				for(i[ax0] = a[ax0]; i[ax0] !== b[ax0]; i[ax0] += s[ax0]) {
					let I = i[0] + i[1] * 16 + i[2] * 16 * 16;
					let val = map[I];
					
					if(val > 0) {
						j[0] = i[0];
						j[1] = i[1];
						j[2] = i[2];
						k[0] = i[0];
						k[1] = i[1];
						k[2] = i[2];
						
						for(j[ax0] = i[ax0] + s[ax0]; j[ax0] !== b[ax0]; j[ax0] += s[ax0]) {
							let J = j[0] + j[1] * 16 + j[2] * 16 * 16;
							
							if(map[J] !== val) {
								break;
							}
							
							map[J] = 0;
						}
						
						outer:
						for(k[ax1] = i[ax1] + s[ax1]; k[ax1] !== b[ax1]; k[ax1] += s[ax1]) {
							for(k[ax0] = i[ax0]; k[ax0] !== j[ax0]; k[ax0] += s[ax0]) {
								let K = k[0] + k[1] * 16 + k[2] * 16 * 16;
								
								if(map[K] !== val) {
									break outer;
								}
							}
							
							for(k[ax0] = i[ax0]; k[ax0] !== j[ax0]; k[ax0] += s[ax0]) {
								let K = k[0] + k[1] * 16 + k[2] * 16 * 16;
								
								map[K] = 0;
							}
						}
						
						let block = val & 0xff;
						let face = blocks[block].faces[fid];
						let ao0 = val >>  8 & 3;
						let ao1 = val >> 10 & 3;
						let ao2 = val >> 12 & 3;
						let ao3 = val >> 14 & 3;
						let quadw = (j[ax0] - i[ax0]) * s[ax0];
						let quadh = (k[ax1] - i[ax1]) * s[ax1];
						let v0 = [...i, nx, ny, nz,     0, quadh, face, ao0];
						let v1 = [...i, nx, ny, nz, quadw, quadh, face, ao1];
						let v2 = [...i, nx, ny, nz,     0,     0, face, ao2];
						let v3 = [...i, nx, ny, nz, quadw,     0, face, ao3];
						
						v1[ax0] = j[ax0];
						v3[ax0] = j[ax0];
						v2[ax1] = k[ax1];
						v3[ax1] = k[ax1];
						
						if(s[ax0] < 0) {
							v0[ax0] ++;
							v1[ax0] ++;
							v2[ax0] ++;
							v3[ax0] ++;
						}
						
						if(s[ax1] < 0) {
							v0[ax1] ++;
							v1[ax1] ++;
							v2[ax1] ++;
							v3[ax1] ++;
						}
						
						if(nx > 0 || ny > 0 || nz > 0) {
							v0[ax2] ++;
							v1[ax2] ++;
							v2[ax2] ++;
							v3[ax2] ++;
						}
						
						if(ao0 + ao3 < ao1 + ao2) {
							mesh.push(...v1, ...v3, ...v0, ...v0, ...v3, ...v2);
						}
						else {
							mesh.push(...v0, ...v1, ...v2, ...v2, ...v1, ...v3);
						}
					}
				}
			}
		}
	}
	
	getOcclusion(p0, p1, p2)
	{
		let ao0 = this.getBlock(...p0) > 0 ? 1 : 0;
		let ao1 = this.getBlock(...p1) > 0 ? 1 : 0;
		let ao2 = this.getBlock(...p2) > 0 ? 1 : 0;
		
		return ao0 > 0 && ao2 > 0 ? 3 : ao0 + ao1 + ao2;
	}
	
	draw(camera, sun, drawTrans)
	{
		let shader = this.shader;
		let buffer = null;
		let count = 0;
		
		if(drawTrans) {
			buffer = this.transbuf;
			count = this.transcount;
		}
		else {
			buffer = this.buffer;
			count = this.count;
		}
		
		if(count === 0) {
			return;
		}
		
		shader.assignFloatAttrib("pos",  buffer, 3, 10, 0);
		shader.assignFloatAttrib("norm", buffer, 3, 10, 3);
		shader.assignFloatAttrib("uv",   buffer, 2, 10, 6);
		shader.assignFloatAttrib("face", buffer, 1, 10, 8);
		shader.assignFloatAttrib("ao",   buffer, 1, 10, 9);
		shader.use();
		shader.assignMatrix("proj", camera.proj);
		shader.assignMatrix("view", camera.view);
		shader.assignMatrix("model", this.model);
		shader.assignVector("sun", sun);
		shader.assignTexture("tex", this.texture, 0);
		
		this.display.drawTriangles(count);
	}
}
