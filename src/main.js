import {Display} from "./display.js";
import {Camera} from "./camera.js";
import {World} from "./world.js";
import {Input} from "./input.js";
import {Renderer} from "./renderer.js";
import * as matrix from "./matrix.js";

let display = new Display();
let camera = new Camera(display);
let world = new World(display);
let renderer = new Renderer(display);
let gl = display.gl;

world.touchChunk( 0, 0, 0);
//world.touchChunk( 1, 0, 0);
//world.touchChunk( 0, 1, 0);
//world.touchChunk( 0, 0, 1);
//world.touchChunk(-1, 0, 0);
//world.touchChunk( 0,-1, 0);
//world.touchChunk( 0, 0,-1);
//camera.pos.set([-13, 32, -13]);
//camera.hangle = 0.75;
//camera.vangle = -0.7;
camera.pos.set([0,0,-3]);

let container = document.createElement("div");
let crosshairs = document.createElement("img");

crosshairs.src = "gfx/crosshairs.png";
crosshairs.style.position = "absolute";
crosshairs.style.left = "50%";
crosshairs.style.top = "50%";
crosshairs.style.transform = "translateX(-50%) translateY(-50%)";
display.canvas.style.display = "block";
container.style.display = "inline-block";
container.style.position = "relative";
container.appendChild(display.canvas);
container.appendChild(crosshairs);
document.body.appendChild(container);

let input = new Input(container);
let speed = 0.1;
let blockHit = null;

let axis = display.createStaticByteBuffer([
	0,0,0, 1,0,0,
	1,0,0, 1,0,0,
	0,0,0, 0,1,0,
	0,1,0, 0,1,0,
	0,0,0, 0,0,1,
	0,0,1, 0,0,1,
]);

let axisShader = display.createShader(`
	uniform mat4 proj;
	uniform mat4 view;
	attribute vec3 pos;
	attribute vec3 col;
	varying vec3 vCol;
	void main()
	{
		gl_Position = proj * view * vec4(pos, 1.0);
		vCol = col;
	}
`,`
	precision highp float;
	varying vec3 vCol;
	void main()
	{
		gl_FragColor = vec4(vCol, 1.0);
	}
`);

let p = -1 / 16;

let selector = display.createStaticFloatBuffer([
	0,0,p, 1,0,p, 0,1,p,
	0,1,p, 1,0,p, 1,1,p,
]);

let selectorShader = display.createShader(`
	uniform mat4 model;
	uniform mat4 proj;
	uniform mat4 view;
	attribute vec3 pos;
	void main()
	{
		gl_Position = proj * view * model * vec4(pos, 1.0);
	}
`,`
	precision highp float;
	void main()
	{
		gl_FragColor = vec4(1.0, 1.0, 1.0, 0.5);
	}
`);

let selectorMat = matrix.identity();

display.onRender = () =>
{
	if(input.keymap.a) {
		camera.moveLeft(speed);
	}
	if(input.keymap.d) {
		camera.moveRight(speed);
	}
	if(input.keymap.s) {
		camera.moveBackward(speed);
	}
	if(input.keymap.w) {
		camera.moveForward(speed);
	}
	if(input.keymap.space) {
		camera.moveUp(speed);
	}
	if(input.keymap.shift) {
		camera.moveDown(speed);
	}
	
	renderer.begin(camera);
	renderer.drawWorld(world);
	
	if(blockHit) {
		let r = Math.PI / 2;
		let s = Math.PI;
		let [x, y, z,  ax,ay,az] = [
			[0, 0, 0,  0, 0, 0],
			[1, 0, 0,  0, r, 0],
			[1, 0, 1,  0, s, 0],
			[0, 0, 1,  0,-r, 0],
			[0, 1, 0,  r, 0, 0],
			[0, 0, 1, -r, 0, 0],
		][blockHit.faceid];
	
		matrix.identity(selectorMat);
		
		matrix.translate(
			selectorMat,
			x + blockHit.blockpos[0],
			y + blockHit.blockpos[1],
			z + blockHit.blockpos[2],
			selectorMat
		);
		
		matrix.rotateX(selectorMat, ax, selectorMat);
		matrix.rotateY(selectorMat, ay, selectorMat);
		matrix.rotateZ(selectorMat, az, selectorMat);
	
		selectorShader.use();
		selectorShader.uniformMatrix4fv("proj", camera.getProjection());
		selectorShader.uniformMatrix4fv("view", camera.getView());
		selectorShader.uniformMatrix4fv("model", selectorMat);
		selectorShader.vertexAttrib("pos", selector, 3);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}
	
	gl.disable(gl.DEPTH_TEST);
	gl.lineWidth(2);
	axisShader.use();
	axisShader.uniformMatrix4fv("proj", camera.getProjection());
	axisShader.uniformMatrix4fv("view", camera.getView());
	axisShader.vertexAttrib("pos", axis, 3, true, 6, 0);
	axisShader.vertexAttrib("col", axis, 3, true, 6, 3);
	gl.drawArrays(gl.LINES, 0, 6);
	gl.enable(gl.DEPTH_TEST);
};

input.onMove = e =>
{
	camera.turnHori(e.movementX / 100);
	camera.turnVert(-e.movementY / 100);
	blockHit = world.hitBlock(camera.getDirVec(), camera.pos);
};

input.onClick = e =>
{
	if(blockHit) {
		world.setBlock(...blockHit.blockpos, 0);
		console.log(blockHit);
	}
};

window.display = display;
window.camera = camera;
window.world = world;
window.input = input;
