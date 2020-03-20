import Display from "./display.js";
import Camera from "./camera.js";
import Controller from "./controller.js";
import Chunk from "./chunk.js";

let display = new Display();

display.appendToBody();

let camera = new Camera(90, 800/600, 0.1, 1000, 1,-1,1, 90,0);
let controller = new Controller(camera, display);
let chunk = new Chunk(display);

chunk.remesh();

display.onframe = () =>
{
	controller.update(1/60);
	
	camera.aspect = display.getAspect();
	camera.update();
	
	chunk.draw(camera);
};
