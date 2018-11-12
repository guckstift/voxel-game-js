import {Display} from "./display.js";
import * as matrix from "./matrix.js";
import * as vector from "./vector.js";

let display = new Display();
let gl = display.gl;

document.body.appendChild(display.canvas);

let shader = display.createShader(`
	uniform mat4 proj;
	uniform mat4 view;
	uniform mat4 model;

	attribute vec4 pos;
	attribute vec2 texcoord;
	
	varying vec2 vTexcoord;
	
	void main()
	{
		gl_Position = proj * view * model * pos;
		
		vTexcoord = texcoord;
	}
`,`
	precision highp float;
	
	uniform sampler2D tex;
	
	varying vec2 vTexcoord;
	
	void main()
	{
		gl_FragColor = texture2D(tex, vTexcoord);
	}
`);

let front = new Float32Array([
	0, 0, 0, 1,  0, 1,
	1, 0, 0, 1,  1, 1,
	0, 1, 0, 1,  0, 0,
	0, 1, 0, 1,  0, 0,
	1, 0, 0, 1,  1, 1,
	1, 1, 0, 1,  1, 0,
]);

let buf = display.createStaticFloatBuffer(createCube());

let angle = 0.0;

let tex1 = display.createTexture("gfx/grass.png");
let tex2 = display.createTexture("gfx/stone.png");

let proj = matrix.identity();
let view = matrix.identity();
let model = matrix.identity();

display.onRender = () => {
	matrix.perspective(90 * Math.PI / 180, display.aspect, 0.1, 100, proj);
	
	shader.use();
	
	shader.uniformMatrix4fv("proj", proj);
	shader.uniformMatrix4fv("view", view);
	
	drawTriangles(buf, 6 * 6,  0, 0, 3,  angle, tex1);
	drawTriangles(buf, 6 * 6, -1,-1, 3,  angle, tex2);
	
	angle += 0.01;
}

function drawTriangles(buf, vertnum, x, y, z, a, tex)
{
	matrix.translation(x, y, z, model);
	matrix.rotateX(model, a, model);
	matrix.rotateY(model, a, model);
	
	shader.uniformMatrix4fv("model", model);
	shader.uniformTex("tex", tex, 0);
	
	shader.vertexAttrib("pos",      buf, 4, 6, 0);
	shader.vertexAttrib("texcoord", buf, 2, 6, 4);
	
	gl.drawArrays(gl.TRIANGLES, 0, vertnum);
}

function createCube(out = new Float32Array(6 * 6 * 6))
{
	let r = Math.PI / 2;
	let s = Math.PI;
	
	createQuad(0, 0, 0,  0, 0, 0,  out.subarray(6 * 6 * 0)); // front
	createQuad(1, 0, 0,  0, r, 0,  out.subarray(6 * 6 * 1)); // right
	createQuad(1, 0, 1,  0, s, 0,  out.subarray(6 * 6 * 2)); // back
	createQuad(0, 0, 1,  0,-r, 0,  out.subarray(6 * 6 * 3)); // left
	createQuad(0, 1, 0,  r, 0, 0,  out.subarray(6 * 6 * 4)); // top
	createQuad(0, 0, 1, -r, 0, 0,  out.subarray(6 * 6 * 5)); // bottom
	
	return out;
}

function createQuad(x, y, z, ax, ay, az, out = new Float32Array(6 * 6))
{
	let m = matrix.identity();
	
	matrix.translate(m, x, y, z, m);
	matrix.rotateX(m, ax, m);
	matrix.rotateY(m, ay, m);
	matrix.rotateZ(m, az, m);
	
	for(let i=0; i<6; i++) {
		let o = i * 6;
		let v = out.subarray(o);
		
		v.set(front.subarray(o, o + 6));
		vector.transform(v, m, v);
		vector.round(v, v);
	}
	
	return out;
}

window.display = display;
