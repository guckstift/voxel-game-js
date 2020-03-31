import Display from "./display.js";
import Camera from "./camera.js";
import Controller from "./controller.js";
import Map from "./map.js";
import Vector from "./vector.js";
import {radians} from "./math.js";
import Picker from "./picker.js";
import Crosshairs from "./crosshairs.js";
import Debugger from "./debugger.js";
import Model from "./model.js";
import Matrix from "./matrix.js";
import Texture from "./texture.js";

let display = new Display();

display.appendToBody();

let crosshairs = new Crosshairs();

crosshairs.appendToBody();

let map = new Map(display);
let camera = new Camera(map, 90, 800/600, 0.1, 1000, 8,8,16, 30,0);
let picker = new Picker(display, map);
let controller = new Controller(camera, display, picker, map);

let dbg = new Debugger(camera, map);

dbg.enable();
dbg.appendToBody();

let sun = new Vector(0,0,1);

sun.rotateX(radians(30));

let model = new Model(display, new Texture(display, "gfx/guy.png"));

model.addCube([-0.25, -0.25, 1.5], [ 0.5, 0.5, 0.5], [ 0, 0], [8,8, 8], 64); // head
model.addCube([-0.25,-0.125,0.75], [ 0.5,0.25,0.75], [ 0, 8], [8,4,12], 64); // upper body
model.addCube([ -0.5,-0.125,0.75], [0.25,0.25,0.75], [40, 0], [4,4,12], 64); // left arm
model.addCube([ 0.25,-0.125,0.75], [0.25,0.25,0.75], [40,12], [4,4,12], 64); // right arm
model.addCube([-0.25,-0.125,   0], [0.25,0.25,0.75], [ 0,20], [4,4,12], 64); // left leg
model.addCube([    0,-0.125,   0], [0.25,0.25,0.75], [20,20], [4,4,12], 64); // right leg

let modelMat = new Matrix();

modelMat.translate(6,15,9);

display.onframe = () =>
{
	dbg.frame();
	
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
	
	map.update();
	model.update();
	
	map.draw(camera, sun);
	model.draw(camera, sun, modelMat);
	picker.draw(camera);
};
