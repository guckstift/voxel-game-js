import Vector from "./vector.js";

export default class Controller
{
	constructor(camera, display, picker, map, speaker)
	{
		let canvas = display.canvas;
		
		this.canvas = canvas;
		this.camera = camera;
		this.picker = picker;
		this.speaker = speaker;
		this.map = map;
		this.keymap = {};
		this.locked = false;
		this.movespeed = 8;
		this.jumpspeed = 8;
		this.flymode = false;
		this.jumpsound = null;
		
		speaker.loadSound("sfx/jump.ogg").then(sound => this.jumpsound = sound);
		
		window.addEventListener("keydown", e => this.keydown(e));
		window.addEventListener("keyup", e => this.keyup(e));
		canvas.addEventListener("mousedown", e => this.mousedown(e));
		canvas.addEventListener("mousemove", e => this.mousemove(e));
		document.addEventListener("pointerlockchange", e => this.lockchange(e));
	}
	
	getKey(e)
	{
		let key = e.key.toLowerCase();
		
		if(key === " ") {
			key = "space";
		}
		
		return key;
	}
	
	keydown(e)
	{
		this.speaker.activate();
		
		let key = this.getKey(e);
		
		this.keymap[key] = true;
	}
	
	keyup(e)
	{
		let key = this.getKey(e);
		
		this.keymap[key] = false;
	}
	
	mousedown(e)
	{
		this.speaker.activate();
		
		if(this.locked) {
			if(e.button === 0 && this.picker.hasHit) {
				this.map.setBlock(...this.picker.hitVox, 0);
			}
		}
		else {
			this.canvas.requestPointerLock();
			this.locked = true;
		}
	}
	
	mousemove(e)
	{
		if(this.locked) {
			this.camera.rx -= e.movementY;
			this.camera.rz -= e.movementX;
		}
	}
	
	lockchange(e)
	{
		if(document.pointerLockElement !== this.canvas) {
			this.locked = false;
		}
	}
	
	enableFly()
	{
		this.flymode = true;
		this.camera.acc.set(0,0,0);
		this.camera.vel.set(0,0,0);
	}
	
	disableFly()
	{
		this.flymode = false;
		this.camera.acc.set(0,0,-16);
	}
	
	update(delta)
	{
		if(this.flymode) {
			if(this.keymap.space) {
				this.camera.moveUpward(delta * this.movespeed);
			}
			if(this.keymap.shift) {
				this.camera.moveDownward(delta * this.movespeed);
			}
		}
		else {
			if(this.keymap.space && this.camera.rest.z < 0) {
				this.camera.accel(new Vector(0, 0, this.jumpspeed), 1);
				
				if(this.jumpsound) {
					this.speaker.playSound(this.jumpsound);
				}
			}
		}
		
		if(this.keymap.w) {
			this.camera.moveForward(delta * this.movespeed);
		}
		if(this.keymap.s) {
			this.camera.moveBackward(delta * this.movespeed);
		}
		if(this.keymap.d) {
			this.camera.moveRightward(delta * this.movespeed);
		}
		if(this.keymap.a) {
			this.camera.moveLeftward(delta * this.movespeed);
		}
	}
}
