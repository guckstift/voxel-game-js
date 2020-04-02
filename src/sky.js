import Buffer from "./buffer.js";
import Shader from "./shader.js";

const verts = new Float32Array([
	-1,+1,-1, +1,+1,-1, -1,+1,+1,  -1,+1,+1, +1,+1,-1, +1,+1,+1, // back
	+1,-1,-1, -1,-1,-1, +1,-1,+1,  +1,-1,+1, -1,-1,-1, -1,-1,+1, // front
	-1,-1,-1, -1,+1,-1, -1,-1,+1,  -1,-1,+1, -1,+1,-1, -1,+1,+1, // left
	+1,+1,-1, +1,-1,-1, +1,+1,+1,  +1,+1,+1, +1,-1,-1, +1,-1,+1, // right
	-1,-1,-1, +1,-1,-1, -1,+1,-1,  -1,+1,-1, +1,-1,-1, +1,+1,-1, // bottom
	-1,+1,+1, +1,+1,+1, -1,-1,+1,  -1,-1,+1, +1,+1,+1, +1,-1,+1, // top
]);

const vert = `
	uniform mat4 proj;
	uniform mat4 view;
	uniform mat4 model;
	attribute vec3 pos;
	varying mediump vec3 vPos;
	
	void main()
	{
		gl_Position = proj * view * model * vec4(pos, 1);
		vPos = pos;
	}
`;

const frag = `
	varying mediump vec3 vPos;
	
	void main()
	{
		mediump vec3 norm = normalize(vPos);
		
		gl_FragColor = mix(
			vec4(0.5,   0.75, 1.0, 1),
			vec4(0.125, 0.25, 0.5, 1),
			clamp(norm.z, 0.0, 1.0)
		);
	}
`;

export default class Sky
{
	constructor(display)
	{
		this.buffer = new Buffer(display, verts);
		this.shader = new Shader(display, vert, frag);
		this.display = display;
	}
	
	draw(camera)
	{
		let shader = this.shader;
		let buffer = this.buffer;
		let gl = this.display.gl;
		
		shader.assignFloatAttrib("pos", buffer, 3, 3, 0);
		shader.use();
		shader.assignMatrix("proj", camera.proj);
		shader.assignMatrix("view", camera.view);
		shader.assignMatrix("model", camera.model);
		
		gl.disable(gl.DEPTH_TEST);
		
		this.display.drawTriangles(verts.length / 3);
		
		gl.enable(gl.DEPTH_TEST);
	}
}
