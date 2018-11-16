import {Display} from "./display.js";
import {Camera} from "./camera.js";
import {World} from "./world.js";
import {Input} from "./input.js";
import {Renderer} from "./renderer.js";

let display = new Display();
let camera = new Camera(display);
let world = new World(display);
let renderer = new Renderer(display);
let gl = display.gl;

world.touchChunk( 0, 0, 0);
world.touchChunk( 1, 0, 0);
world.touchChunk( 0, 1, 0);
world.touchChunk( 0, 0, 1);
world.touchChunk(-1, 0, 0);
world.touchChunk( 0,-1, 0);
world.touchChunk( 0, 0,-1);
camera.pos.set([-13, 32, -13]);
camera.hangle = 0.75;
camera.vangle = -0.7;

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
	if(input.panning) {
		camera.turnHori(e.movementX / 100);
		camera.turnVert(-e.movementY / 100);
		console.log(world.hitBlock(camera));
	}
};

window.display = display;
window.camera = camera;
window.world = world;
