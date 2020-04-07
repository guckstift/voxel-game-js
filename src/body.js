import Vector from "./vector.js";
import Matrix from "./matrix.js";
import {radians} from "./math.js";

export default class Body
{
	constructor(map, x, y, z, rx, rz, boxmin, boxmax)
	{
		this.map = map;
		this.pos = new Vector(x, y, z);
		this.vel = new Vector();
		this.acc = new Vector();
		this.rest = new Vector();
		this.rx = rx;
		this.rz = rz;
		this.boxmin = new Vector(...boxmin);
		this.boxmax = new Vector(...boxmax);
		this.mat = new Matrix();
	}
	
	move(vec, delta)
	{
		let deltavec = vec.clone();
		
		deltavec.scale(delta);
		
		let boxmin = this.pos.clone();
		
		boxmin.add(this.boxmin);
		
		let boxmax = this.pos.clone();
		
		boxmax.add(this.boxmax);
		
		for(let i=0; i<3; i++) {
			let hit = this.map.boxmarch(boxmin.data, boxmax.data, deltavec.data);
			
			if(!hit) {
				break;
			}
			
			deltavec.data[hit.axis] = hit.offs;
			this.rest.data[hit.axis] = hit.step;
		}
		
		this.pos.add(deltavec);
		
		if(deltavec.x !== 0) {
			this.rest.data[0] = 0;
		}
		
		if(deltavec.y !== 0) {
			this.rest.data[1] = 0;
		}
		
		if(deltavec.z !== 0) {
			this.rest.data[2] = 0;
		}
	}
	
	accel(acc, delta)
	{
		this.vel.addScaled(acc, delta);
	}
	
	update(delta)
	{
		this.accel(this.acc, delta);
		this.move(this.vel, delta);
		
		if(this.rest.x !== 0) {
			this.vel.data[0] = 0;
		}
		
		if(this.rest.y !== 0) {
			this.vel.data[1] = 0;
		}
		
		if(this.rest.z !== 0) {
			this.vel.data[2] = 0;
		}
		
		this.mat.set();
		this.mat.translate(this.pos.x, this.pos.y, this.pos.z);
		this.mat.rotateZ(radians(this.rz));
		this.mat.rotateX(radians(this.rx));
	}
}
