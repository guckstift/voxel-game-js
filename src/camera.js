import Vector from "./vector.js";
import Matrix from "./matrix.js";
import {radians} from "./math.js";
import Body from "./body.js";

export default class Camera extends Body
{
	constructor(map, fovy, aspect, near, far, x, y, z, rx, rz)
	{
		super(map, x, y, z, rx, rz, [-0.25, -0.25, -1.75], [+0.25, +0.25, +0.25]);
		
		this.fovy = fovy;
		this.aspect = aspect;
		this.near = near;
		this.far = far;
		this.proj = new Matrix();
		this.view = new Matrix();
		this.model = new Matrix();
		this.rightward = new Vector(1,0,0);
		this.forward = new Vector(0,1,0);
		this.upward = new Vector(0,0,1);
		this.lookat = new Vector(0,1,0);
	}
	
	update(delta)
	{
		super.update(delta);
		
		this.proj.perspective(radians(this.fovy), this.aspect, this.near, this.far)
		this.view.set();
		this.view.rotateX(-radians(this.rx + 90));
		this.view.rotateZ(-radians(this.rz));
		this.view.translate(-this.pos.x, -this.pos.y, -this.pos.z);
		this.model.set();
		this.model.translate(this.pos.x, this.pos.y, this.pos.z);
		this.rightward.set(1,0,0);
		this.rightward.rotateZ(radians(this.rz));
		this.forward.set(0,1,0);
		this.forward.rotateZ(radians(this.rz));
		this.lookat.set(0,1,0);
		this.lookat.rotateX(radians(this.rx));
		this.lookat.rotateZ(radians(this.rz));
	}
	
	moveForward(delta)
	{
		this.move(this.forward, +delta);
	}
	
	moveBackward(delta)
	{
		this.move(this.forward, -delta);
	}
	
	moveRightward(delta)
	{
		this.move(this.rightward, +delta);
	}
	
	moveLeftward(delta)
	{
		this.move(this.rightward, -delta);
	}
	
	moveUpward(delta)
	{
		this.move(this.upward, +delta);
	}
	
	moveDownward(delta)
	{
		this.move(this.upward, -delta);
	}
}
