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

let map = new Map(display);
let camera = new Camera(map, 90, 800/600, 0.1, 1000, 8,8,64, 15,0);
let controller = new Controller(camera, display);

let sun = new Vector(0,0,1);

sun.rotateX(radians(30));

let picker = new Picker(display, map);

display.onframe = () =>
{
	let cx = Math.floor(camera.pos.x / 16);
	let cy = Math.floor(camera.pos.y / 16);
	
	for(let y = cy - 1; y <= cy + 1; y++) {
		for(let x = cx - 1; x <= cx + 1; x++) {
			map.loadChunk(x, y);
		}
	}
	
	controller.update(1/60);
	
	camera.aspect = display.getAspect();
	camera.update();
	
	picker.pick(camera.pos, camera.lookat, 16);
	
	map.draw(camera, sun);
	picker.draw(camera);
};
