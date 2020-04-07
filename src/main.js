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
import Texture from "./texture.js";
import Server from "./server.js";
import Sky from "./sky.js";
import Speaker from "./speaker.js";
import Mob from "./mob.js";

let display = new Display();

display.appendToBody();

let crosshairs = new Crosshairs();

crosshairs.appendToBody();

let server = new Server();
let map = new Map(display, server);

let camera = new Camera(map, 90, 800/600, 0.1, 1000, 8,8,16, -30,0);

let picker = new Picker(display, map);
let speaker = new Speaker();
let controller = new Controller(camera, display, picker, map, speaker);

let dbg = new Debugger(camera, map, controller, server);

dbg.enable();
dbg.appendToBody();

let sun = new Vector(0,0,1);

sun.rotateX(radians(30));

let model = new Model(display, new Texture(display, "gfx/guy.png"), [[-0.375, 0, -0.375], [+0.375, 0, -0.375]]);

model.addCube([-0.25, -0.25,-0.25], [ 0.5, 0.5, 0.5], [ 0, 0], [8,8, 8], 64, 0); // head
model.addCube([-0.25,-0.125, -1.0], [ 0.5,0.25,0.75], [ 0, 8], [8,4,12], 64, 0); // upper body
model.addCube([ -0.5,-0.125, -1.0], [0.25,0.25,0.75], [40, 0], [4,4,12], 64, 1); // left arm
model.addCube([ 0.25,-0.125, -1.0], [0.25,0.25,0.75], [40,12], [4,4,12], 64, 2); // right arm
model.addCube([-0.25,-0.125,-1.75], [0.25,0.25,0.75], [ 0,20], [4,4,12], 64, 0); // left leg
model.addCube([    0,-0.125,-1.75], [0.25,0.25,0.75], [20,20], [4,4,12], 64, 0); // right leg

let guy = new Mob(map, 6,15,64, 0,0, [-0.25, -0.25, -1.75], [+0.25, +0.25, +0.25], model);

guy.acc.set(0,0,-20);

let sky = new Sky(display);

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
	camera.update(1/60);
	
	picker.pick(camera.pos, camera.lookat, 16);
	
	map.update();
	
	guy.rz += 1;
	guy.bones[0].rx -= 1;
	guy.bones[1].rx += 1;
	guy.update(1/60);
	
	sky.draw(camera);
	map.draw(camera, sun);
	guy.draw(camera, sun);
	picker.draw(camera);
};
