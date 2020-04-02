import Vector from "./vector.js";
import Matrix from "./matrix.js";
import {radians} from "./math.js";

export default class Camera
{
	constructor(map, fovy, aspect, near, far, x, y, z, rx, rz)
	{
		this.map = map;
		this.fovy = fovy;
		this.aspect = aspect;
		this.near = near;
		this.far = far;
		this.pos = new Vector(x, y, z);
		this.rx = rx;
		this.rz = rz;
		this.proj = new Matrix();
		this.view = new Matrix();
		this.model = new Matrix();
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
		this.model.set();
		this.model.translate(this.pos.x, this.pos.y, this.pos.z);
		this.rightward.set(1,0,0);
		this.rightward.rotateZ(radians(this.rz));
		this.forward.set(0,1,0);
		this.forward.rotateZ(radians(this.rz));
		this.lookat.set(0,0,-1);
		this.lookat.rotateX(radians(this.rx));
		this.lookat.rotateZ(radians(this.rz));
	}
	
	move(vec, delta)
	{
		let deltavec = vec.clone();
		
		deltavec.scale(delta);
		
		let boxmin = this.pos.clone();
		
		boxmin.add(new Vector(-0.25, -0.25, -0.25));
		
		let boxmax = this.pos.clone();
		
		boxmax.add(new Vector(+0.25, +0.25, +0.25));
		
		for(let i=0; i<3; i++) {
			let hit = this.map.boxmarch(boxmin.data, boxmax.data, deltavec.data);
			
			if(!hit) {
				break;
			}
			
			deltavec.data[hit.axis] = hit.offs;
		}
		
		this.pos.add(deltavec);
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
