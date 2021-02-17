import Shader from "./shader.js";
import Texture from "./texture.js";
import Buffer from "./buffer.js";
import Matrix from "./matrix.js";
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

let zeroChunk = new Uint8Array(16 * 16 * 256);

export default class Chunk
{
	constructor(display, map, cx, cy)
	{
		if(display) {
			this.shader = display.getCached("Chunk.shader", () => new Shader(display, vert, frag));
			this.texture = display.getCached("Chunk.texture", () => new Texture(display, "gfx/blocks.png"));
			this.buffer = new Buffer(display);
			this.transbuf = new Buffer(display);
			this.gl = display.gl;
		}
		
		this.data = new Uint8Array(16 * 16 * 256);
		this.generator = new Generator();
		this.count = 0;
		this.transcount = 0;
		this.display = display;
		this.map = map;
		this.cx = cx;
		this.cy = cy;
		this.invalid = false;
		this.meshingStartTime = 0;
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
	
	generate()
	{
		for(let z=0, i=0; z<256; z++) {
			for(let y=0; y<16; y++) {
				for(let x=0; x<16; x++, i++) {
					this.data[i] = this.generator.getBlock(
						x + this.cx * 16,
						y + this.cy * 16,
						z,
					);
				}
			}
		}
		
		this.invalidateVicinity();
	}
	
	setData(data)
	{
		this.data = data;
		this.invalidateVicinity();
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
	
	getVicinity()
	{
		let chunks = [];
		
		for(let y = -1; y <= +1; y++) {
			for(let x = -1; x <= +1; x++) {
				let chunk = this.map.getChunk(this.cx + x, this.cy + y);
				
				if(chunk) {
					chunks.push(chunk.data);
				}
				else {
					chunks.push(zeroChunk);
				}
			}
		}
		
		return chunks;
	}
	
	update()
	{
		if(this.invalid) {
			this.meshingStartTime = performance.now();
			this.map.remeshChunk(this);
			this.invalid = false;
		}
	}
	
	applyMesh(mesh, transmesh)
	{
		this.buffer.update(new Float32Array(mesh));
		this.count = mesh.length / 10;
		this.transbuf.update(new Float32Array(transmesh));
		this.transcount = transmesh.length / 10;
		
		console.log("chunk mesh updated", this.cx, this.cy, "time", performance.now() - this.meshingStartTime);
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
