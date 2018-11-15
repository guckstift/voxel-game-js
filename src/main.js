import {Display} from "./display.js";
import {Camera} from "./camera.js";
import {World} from "./world.js";
import {Input} from "./input.js";
import {Renderer} from "./renderer.js";

let display = new Display();
let camera = new Camera(display);
let input = new Input(display.canvas);
let world = new World(display);
let renderer = new Renderer(display);

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
document.body.appendChild(display.canvas);

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
	renderer.drawWorld(world);
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
window.world = world;
