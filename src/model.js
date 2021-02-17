import Shader from "./shader.js";
import Buffer from "./buffer.js";

let vert = `
	uniform mat4 proj;
	uniform mat4 view;
	uniform mat4 model;
	uniform vec3 sun;
	uniform mat4 bones[16];
	attribute vec3 pos;
	attribute vec3 norm;
	attribute vec2 uv;
	attribute float bone;
	varying mediump vec2 vUv;
	varying mediump float factor;
	
	void main()
	{
		gl_Position = vec4(pos, 1);
		
		vec4 normal = vec4(norm, 0);
		
		for(int i=0; i<16; i++) {
			if(i + 1 == int(bone)) {
				gl_Position = bones[i] * gl_Position;
				normal = bones[i] * normal;
			}
		}
		
		normal = model * normal;
		
		gl_Position = proj * view * model * gl_Position;
		vUv = uv;
		
		float diffuse = max(0.0, dot(sun, normal.xyz));
		float ambient = 1.0;
		
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

export default class Model
{
	constructor(display, texture, roots)
	{
		this.gl = display.gl;
		this.display = display;
		this.shader = display.getCached("Model.shader", () => new Shader(display, vert, frag));
		this.texture = texture;
		this.buffer = new Buffer(display);
		this.mesh = [];
		this.invalid = false;
		this.boneCount = 0;
		this.roots = roots;
	}
	
	addQuad(v0, v1, v2, v3, n, uvStart, uvSize, bone)
	{
		let uv00 = [uvStart[0],             uvStart[1] + uvSize[1]];
		let uv01 = [uvStart[0],             uvStart[1]];
		let uv10 = [uvStart[0] + uvSize[0], uvStart[1] + uvSize[1]];
		let uv11 = [uvStart[0] + uvSize[0], uvStart[1]];
		
		this.mesh.push(...v0, ...n, ...uv00, bone);
		this.mesh.push(...v1, ...n, ...uv10, bone);
		this.mesh.push(...v2, ...n, ...uv01, bone);
		this.mesh.push(...v2, ...n, ...uv01, bone);
		this.mesh.push(...v1, ...n, ...uv10, bone);
		this.mesh.push(...v3, ...n, ...uv11, bone);
		
		this.invalid = true;
		this.boneCount = Math.max(this.boneCount, bone);
	}
	
	addCube(start, size, texpos, texbox, div, bone)
	{
		let end = [start[0] + size[0], start[1] + size[1], start[2] + size[2]];
		let v000 = start;
		let v001 = [start[0], start[1], end[2]];
		let v010 = [start[0], end[1],   start[2]];
		let v011 = [start[0], end[1],   end[2]];
		let v100 = [end[0],   start[1], start[2]];
		let v101 = [end[0],   start[1], end[2]];
		let v110 = [end[0],   end[1],   start[2]];
		let v111 = end;
		let u = texpos[0];
		let v = texpos[1];
		let sx = texbox[0];
		let sy = texbox[1];
		let sz = texbox[2];
		
		// left
		this.addQuad(v010, v000, v011, v001, [-1, 0, 0], [  (2*sx+sy+u)/div,      v/div], [sy/div, sz/div], bone);
		
		// front
		this.addQuad(v000, v100, v001, v101, [ 0,-1, 0], [            u/div,      v/div], [sx/div, sz/div], bone);
		
		// bottom
		this.addQuad(v010, v110, v000, v100, [ 0, 0,-1], [(2*sx+2*sy+u)/div, (sy+v)/div], [sx/div, sy/div], bone);
		
		// right
		this.addQuad(v100, v110, v101, v111, [+1, 0, 0], [       (sx+u)/div,      v/div], [sy/div, sz/div], bone);
		
		// back
		this.addQuad(v110, v010, v111, v011, [ 0,+1, 0], [    (sx+sy+u)/div,      v/div], [sx/div, sz/div], bone);
		
		// top
		this.addQuad(v001, v101, v011, v111, [ 0, 0,+1], [(2*sx+2*sy+u)/div,      v/div], [sx/div, sy/div], bone);
	}
	
	update()
	{
		if(this.invalid) {
			this.buffer.update(new Float32Array(this.mesh));
			this.invalid = false;
		}
	}
	
	draw(camera, sun, modelMat, bones)
	{
		let shader = this.shader;
		let buffer = this.buffer;
		
		shader.assignFloatAttrib("pos",  buffer, 3, 9, 0);
		shader.assignFloatAttrib("norm", buffer, 3, 9, 3);
		shader.assignFloatAttrib("uv",   buffer, 2, 9, 6);
		shader.assignFloatAttrib("bone", buffer, 1, 9, 8);
		shader.use();
		shader.assignMatrix("proj", camera.proj);
		shader.assignMatrix("view", camera.view);
		shader.assignMatrix("model", modelMat);
		shader.assignMatrices("bones", bones);
		shader.assignVector("sun", sun);
		shader.assignTexture("tex", this.texture, 0);
		
		this.display.drawTriangles(this.mesh.length / 9);
	}
}
