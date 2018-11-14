import {Display} from "./display.js";
import {Camera} from "./camera.js";
import {Chunk} from "./chunk.js";
import * as matrix from "./matrix.js";
import * as vector from "./vector.js";

let display = new Display();
let camera = new Camera(display);
let gl = display.gl;
let chunk = new Chunk(display);

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

let angle = 0.0;

let atlas = display.createTexture("gfx/atlas.png");

let model = matrix.identity();
let speed = 0.1;
let keymap = {};
let panning = false;

display.onRender = () => {
	if(keymap.a) {
		camera.moveLeft(speed);
	}
	if(keymap.d) {
		camera.moveRight(speed);
	}
	if(keymap.s) {
		camera.moveBackward(speed);
	}
	if(keymap.w) {
		camera.moveForward(speed);
	}
	if(keymap.Shift) {
		camera.moveUp(speed);
	}
	if(keymap[" "]) {
		camera.moveDown(speed);
	}
	
	shader.use();
	
	shader.uniformMatrix4fv("proj", camera.getProjection());
	shader.uniformMatrix4fv("view", camera.getView());
	
	drawTriangles(chunk.buf,  16 ** 3 * 6 * 2 * 3,  0,0,3,  0,  atlas);
}

document.onkeydown = e => {
	keymap[e.key] = true;
};

document.onkeyup = e => {
	keymap[e.key] = false;
};

display.canvas.onmousedown = e => {
	display.canvas.requestPointerLock();
	panning = true;
};

display.canvas.onmouseup = e => {
	document.exitPointerLock();
	panning = false;
};

display.canvas.onmousemove = e => {
	if(panning) {
		camera.turnHori(e.movementX / 100);
		camera.turnVert(-e.movementY / 100);
	}
};

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

window.display = display;
window.camera = camera;
