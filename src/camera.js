import Vector from "./vector.js";
import Matrix from "./matrix.js";
import {radians} from "./math.js";

export default class Camera
{
	constructor(fovy, aspect, near, far, x, y, z, rx, rz)
	{
		this.fovy = fovy;
		this.aspect = aspect;
		this.near = near;
		this.far = far;
		this.pos = new Vector(x, y, z);
		this.rx = rx;
		this.rz = rz;
		this.proj = new Matrix();
		this.view = new Matrix();
		this.rightward = new Vector(1,0,0);
		this.forward = new Vector(0,1,0);
		this.upward = new Vector(0,0,1);
		this.lookat = new Vector(0,0,-1);
	}
	
	update()
	{
		this.proj.perspective(radians(this.fovy), this.aspect, this.near, this.far)
		this.view.set();
		this.view.rotateX(-radians(this.rx));
		this.view.rotateZ(-radians(this.rz));
		this.view.translate(-this.pos.x, -this.pos.y, -this.pos.z);
		this.rightward.set(1,0,0);
		this.rightward.rotateZ(radians(this.rz));
		this.forward.set(0,1,0);
		this.forward.rotateZ(radians(this.rz));
		this.lookat.set(0,0,-1);
		this.lookat.rotateX(radians(this.rx));
		this.lookat.rotateZ(radians(this.rz));
	}
	
	moveForward(delta)
	{
		this.pos.addScaled(this.forward, +delta);
	}
	
	moveBackward(delta)
	{
		this.pos.addScaled(this.forward, -delta);
	}
	
	moveRightward(delta)
	{
		this.pos.addScaled(this.rightward, +delta);
	}
	
	moveLeftward(delta)
	{
		this.pos.addScaled(this.rightward, -delta);
	}
	
	moveUpward(delta)
	{
		this.pos.addScaled(this.upward, +delta);
	}
	
	moveDownward(delta)
	{
		this.pos.addScaled(this.upward, -delta);
	}
}
