import {Display} from "./display.js";
import {Camera} from "./camera.js";
import {World} from "./world.js";
import {CHUNK_WIDTH} from "./chunk.js";
import {Input} from "./input.js";
import {Body} from "./body.js";
import {radians} from "./math.js";
import * as matrix from "./matrix.js";
import * as vector3 from "./vector3.js";

const runspeed  = 3;
const jumpspeed = 6.5;
const gravity   = 20;

let display = new Display();
let camera = new Camera(display);
let world = new World(display, camera);
let body = new Body(world, [-0.25, 0, -0.25], [0.25, 1.75, 0.25]);
let gl = display.gl;

world.touchChunk( 0, 0, 0);

body.pos.set([8.5,-4.5,8.5]);
body.acc[1] = -gravity;

let container = document.createElement("div");
let crosshairs = document.createElement("img");

crosshairs.src = "gfx/crosshairs.png";
crosshairs.style.position = "absolute";
crosshairs.style.left = "50%";
crosshairs.style.top = "50%";
crosshairs.style.transform = "translateX(-50%) translateY(-50%)";
display.canvas.style.display = "block";
container.style.display = "inline-block";
container.style.position = "absolute";
container.style.left = "0";
container.style.top = "0";
container.appendChild(display.canvas);
container.appendChild(crosshairs);
document.body.appendChild(container);

let input = new Input(container);
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

let p = -1 / 1024;

let selector = display.createStaticFloatBuffer([
	0,0,p, 1,0,p, 0,1,p,
	0,1,p, 1,0,p, 1,1,p,
]);

let selectorShader = display.createShader(`
	uniform mat4 proj;
	uniform mat4 viewmodel;
	attribute vec3 pos;
	void main()
	{
		gl_Position = proj * viewmodel * vec4(pos, 1.0);
	}
`,`
	precision highp float;
	void main()
	{
		gl_FragColor = vec4(1.0, 1.0, 1.0, 0.25);
	}
`);

display.onRender = () =>
{
	if(input.keymap.space && body.rest[1] === 1) {
		body.accelerate([0, jumpspeed, 0], 1);
	}
	if(input.keymap.w) {
		let vec = camera.getForward(runspeed);
		body.move(vec, 1 / 60);
	}
	if(input.keymap.a) {
		let vec = camera.getLeftward(runspeed);
		body.move(vec, 1 / 60);
	}
	if(input.keymap.s) {
		let vec = camera.getForward(-runspeed);
		body.move(vec, 1 / 60);
	}
	if(input.keymap.d) {
		let vec = camera.getLeftward(-runspeed);
		body.move(vec, 1 / 60);
	}
	
	body.update(1 / 60);
	camera.setPos(body.pos);
	camera.pos[1] += 1.5;
	
	blockHit = world.hitBlock(camera.getDirVec(), camera.pos);
	
	world.touchChunkAt(...body.pos);
	world.touchChunkAt(body.pos[0] - CHUNK_WIDTH, body.pos[1], body.pos[2]);
	world.touchChunkAt(body.pos[0], body.pos[1] - CHUNK_WIDTH, body.pos[2]);
	world.touchChunkAt(body.pos[0], body.pos[1], body.pos[2] - CHUNK_WIDTH);
	world.touchChunkAt(body.pos[0] + CHUNK_WIDTH, body.pos[1], body.pos[2]);
	world.touchChunkAt(body.pos[0], body.pos[1] + CHUNK_WIDTH, body.pos[2]);
	world.touchChunkAt(body.pos[0], body.pos[1], body.pos[2] + CHUNK_WIDTH);
	
	world.draw();
	
	if(blockHit) {
		let r = radians(90);
		let s = radians(180);
		let [x, y, z,  ax,ay,az] = [
			[0, 0, 0,  0, 0, 0],
			[1, 0, 0,  0, r, 0],
			[1, 0, 1,  0, s, 0],
			[0, 0, 1,  0,-r, 0],
			[0, 1, 0,  r, 0, 0],
			[0, 0, 1, -r, 0, 0],
		][blockHit.faceid];
		
		selectorShader.use();
		selectorShader.uniformMatrix4fv("proj", camera.getProjection());
		
		selectorShader.uniformMatrix4fv("viewmodel", camera.getViewModel(
			x + blockHit.blockpos[0],
			y + blockHit.blockpos[1],
			z + blockHit.blockpos[2],
			ax, ay, az,
		));
		
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
	window.blockHit = blockHit;
};

input.onClick = e =>
{
	if(blockHit) {
		world.setBlock(...blockHit.blockpos, 0);
	}
};

input.onResize = e =>
{
	display.resize(window.innerWidth, window.innerHeight);
};

input.onResize();

window.display = display;
window.camera = camera;
window.world = world;
window.input = input;
window.body = body;
