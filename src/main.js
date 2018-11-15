import {Display} from "./display.js";
import {Camera} from "./camera.js";
import {Chunk} from "./chunk.js";
import {Input} from "./input.js";
import {Renderer} from "./renderer.js";

let display = new Display();
let camera = new Camera(display);
let gl = display.gl;
let input = new Input(display.canvas);
let chunk1 = new Chunk( 0, 0, 0, display);
let chunk2 = new Chunk(-1, 0, 0, display);
let renderer = new Renderer(display);

camera.moveBackward(3);
document.body.appendChild(display.canvas);

let angle = 0.0;
let atlas = display.createTexture("gfx/atlas.png");
let speed = 0.1;

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
	renderer.drawChunk(chunk1);
	renderer.drawChunk(chunk2);
};

input.onMove = e =>
{
	if(input.panning) {
		camera.turnHori(e.movementX / 100);
		camera.turnVert(-e.movementY / 100);
	}
};

window.display = display;
window.camera = camera;
window.chunk1 = chunk1;
