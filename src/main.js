import Display from "./display.js";
import Camera from "./camera.js";
import Controller from "./controller.js";
import Map from "./map.js";
import Vector from "./vector.js";
import {radians} from "./math.js";
import Picker from "./picker.js";
import Crosshairs from "./crosshairs.js";

let display = new Display();

display.appendToBody();

let crosshairs = new Crosshairs();

crosshairs.appendToBody();

let camera = new Camera(90, 800/600, 0.1, 1000, 1,-1,1, 90,0);
let controller = new Controller(camera, display);
let map = new Map(display);

map.loadChunk(0, 0);
map.loadChunk(-1, 0);
map.loadChunk(0, 1);
map.loadChunk(-1, 1);

let sun = new Vector(0,0,1);

sun.rotateX(radians(30));

let picker = new Picker(display, map);

display.onframe = () =>
{
	controller.update(1/60);
	
	camera.aspect = display.getAspect();
	camera.update();
	
	picker.pick(camera.pos, camera.lookat, 16);
	
	map.draw(camera, sun);
	picker.draw(camera);
};
