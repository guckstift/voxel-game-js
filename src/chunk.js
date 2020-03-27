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
	attribute float ao;
	varying mediump vec2 vUv;
	varying mediump float factor;
	
	void main()
	{
		gl_Position = proj * view * model * vec4(pos, 1);
		vUv = uv;
		
		float diffuse = max(0.0, dot(sun, norm));
		float ambient = (4.0 - ao) * 0.25;
		
		factor = mix(diffuse, ambient, 0.5);
	}
`;

let frag = `
	uniform sampler2D tex;
	varying mediump vec2 vUv;
	varying mediump float factor;
	
	void main()
	{
		gl_FragColor = texture2D(tex, vUv);
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
		this.data = new Uint8Array(16 * 16 * 256);
		this.generator = new Generator();
		this.count = 0;
		
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
		
		for(let y = -1; y <= +1; y++) {
			for(let x = -1; x <= +1; x++) {
				if(x !== 0 || y !== 0) {
					let chunk = map.getChunk(cx + x, cy + y);
					
					if(chunk) {
						chunk.invalid = true;
					}
				}
			}
		}
		
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
	
	update()
	{
		if(this.invalid) {
			this.remesh();
			this.invalid = false;
		}
	}
	
	remesh()
	{
		let gl = this.gl;
		let mesh = [];
		
		this.remeshSide(mesh, -1, 0, 0, [0,1,0], [0,0,0], [0,1,1], [0,0,1], 0, // left
			[-1,+1,+1], [-1, 0,+1], [-1,-1,+1],
			[-1,+1, 0],             [-1,-1, 0],
			[-1,+1,-1], [-1, 0,-1], [-1,-1,-1]);
		this.remeshSide(mesh,  0,-1, 0, [0,0,0], [1,0,0], [0,0,1], [1,0,1], 1, // front
			[-1,-1,+1], [ 0,-1,+1], [+1,-1,+1],
			[-1,-1, 0],             [+1,-1, 0],
			[-1,-1,-1], [ 0,-1,-1], [+1,-1,-1]);
		this.remeshSide(mesh,  0, 0,-1, [0,1,0], [1,1,0], [0,0,0], [1,0,0], 2, // bottom
			[-1,-1,-1], [ 0,-1,-1], [+1,-1,-1],
			[-1, 0,-1],             [+1, 0,-1],
			[-1,+1,-1], [ 0,+1,-1], [+1,+1,-1]);
		this.remeshSide(mesh, +1, 0, 0, [1,0,0], [1,1,0], [1,0,1], [1,1,1], 3, // right
			[+1,-1,+1], [+1, 0,+1], [+1,+1,+1],
			[+1,-1, 0],             [+1,+1, 0],
			[+1,-1,-1], [+1, 0,-1], [+1,+1,-1]);
		this.remeshSide(mesh,  0,+1, 0, [1,1,0], [0,1,0], [1,1,1], [0,1,1], 4, // back
			[+1,+1,+1], [ 0,+1,+1], [-1,+1,+1],
			[+1,+1, 0],             [-1,+1, 0],
			[+1,+1,-1], [ 0,+1,-1], [-1,+1,-1]);
		this.remeshSide(mesh,  0, 0,+1, [0,0,1], [1,0,1], [0,1,1], [1,1,1], 5, // top
			[-1,+1,+1], [ 0,+1,+1], [+1,+1,+1],
			[-1, 0,+1],             [+1, 0,+1],
			[-1,-1,+1], [ 0,-1,+1], [+1,-1,+1]);
		
		this.buffer.update(new Float32Array(mesh));
		this.count = mesh.length / 9;
	}
	
	remeshSide(mesh, nx, ny, nz, p0, p1, p2, p3, fid, aov0, aov1, aov2, aov3, aov4, aov5, aov6, aov7)
	{
		for(let z=0, i=0; z<256; z++) {
			for(let y=0; y<16; y++) {
				for(let x=0; x<16; x++, i++) {
					let block = (
						this.getBlock(x, y, z) > 0 && this.getBlock(x + nx, y + ny, z + nz) === 0
						? this.getBlock(x, y, z)
						: 0
					);
					
					if(block > 0) {
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
						
						let face = blocks[block].faces[fid];
						let fx = face % 16 / 16;
						let fy = Math.floor(face / 16) / 16;
						let v0 = [x + p0[0], y + p0[1], z + p0[2], nx, ny, nz, 0/16 + fx, 1/16 + fy, ao0];
						let v1 = [x + p1[0], y + p1[1], z + p1[2], nx, ny, nz, 1/16 + fx, 1/16 + fy, ao1];
						let v2 = [x + p2[0], y + p2[1], z + p2[2], nx, ny, nz, 0/16 + fx, 0/16 + fy, ao2];
						let v3 = [x + p3[0], y + p3[1], z + p3[2], nx, ny, nz, 1/16 + fx, 0/16 + fy, ao3];
						let flip = ao0 + ao3 < ao1 + ao2;
						
						if(flip) {
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
	
	draw(camera, sun)
	{
		let shader = this.shader;
		
		shader.assignFloatAttrib("pos",  this.buffer, 3, 9, 0);
		shader.assignFloatAttrib("norm", this.buffer, 3, 9, 3);
		shader.assignFloatAttrib("uv",   this.buffer, 2, 9, 6);
		shader.assignFloatAttrib("ao",   this.buffer, 1, 9, 8);
		shader.use();
		shader.assignMatrix("proj", camera.proj);
		shader.assignMatrix("view", camera.view);
		shader.assignMatrix("model", this.model);
		shader.assignVector("sun", sun);
		shader.assignTexture("tex", this.texture, 0);
		
		this.display.drawTriangles(this.count);
	}
}
