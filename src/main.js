import {Display} from "./display.js";
import * as matrix from "./matrix.js";

let display = new Display();
let gl = display.gl;

document.body.appendChild(display.canvas);

let shader = display.createShader(`
	uniform mat4 proj;
	uniform mat4 view;
	uniform mat4 model;

	attribute vec3 pos;
	attribute vec2 texcoord;
	
	varying vec2 vTexcoord;
	
	void main()
	{
		gl_Position = proj * view * model * vec4(pos, 1.0);
		
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

let buf = display.createStaticFloatBuffer([
	0, 0, 0,  0, 1,
	1, 0, 0,  1, 1,
	0, 1, 0,  0, 0,
	0, 1, 0,  0, 0,
	1, 0, 0,  1, 1,
	1, 1, 0,  1, 0,
]);

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
	
	drawQuad([  0,   0, 2],   tex1);
	drawQuad([-.5, -.5, 2.5], tex2);
	
	angle -= 0.01;
}

function drawQuad(offs, tex)
{
	matrix.translation(...offs, model);
	matrix.rotateY(model, angle, model);
	
	shader.uniformMatrix4fv("model", model);
	shader.uniformTex("tex", tex, 0);
	
	shader.vertexAttrib("pos",      buf, 3, 5, 0);
	shader.vertexAttrib("texcoord", buf, 2, 5, 3);
	
	gl.drawArrays(gl.TRIANGLES, 0, 6);
}

window.display = display;
