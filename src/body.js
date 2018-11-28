import * as vector3 from "./vector3.js";

export class Body
{
	constructor(
		world,
		boxmin = vector3.create(-0.25, -0.25, -0.25),
		boxmax = vector3.create( 0.25,  0.25,  0.25)
	) {
		this.world = world;
		this.boxmin = boxmin;
		this.boxmax = boxmax;
		
		this.pos  = vector3.create();
		this.vel  = vector3.create();
		this.acc  = vector3.create();
		this.rest = new Uint8Array(3);
		
		this.deltavel  = vector3.create();
		this.globoxmin = vector3.create();
		this.globoxmax = vector3.create();
	}
	
	accelerate(acc, delta)
	{
		vector3.addScaled(this.vel, acc, delta, this.vel);
	}
	
	move(vel, delta)
	{
		vector3.scale(vel, delta, this.deltavel);
		this.updateBox();
		this.rest[0] = 0;
		this.rest[1] = 0;
		this.rest[2] = 0;
		
		let hit = world.boxcast(this.globoxmin, this.globoxmax, this.deltavel);
		
		for(let i = 0; i < 3 && hit; i ++) {
			this.pos[hit.axis]  = hit.pos;
			this.rest[hit.axis] = 1;
			
			if(hit.step > 0) {
				this.pos[hit.axis] -= this.boxmax[hit.axis];
			}
			else {
				this.pos[hit.axis] -= this.boxmin[hit.axis];
			}
			
			this.deltavel[hit.axis] = 0;
			vel[hit.axis]           = 0;
			
			this.updateBox();
			
			hit = world.boxcast(this.globoxmin, this.globoxmax, this.deltavel);
		}
		
		vector3.add(this.pos, this.deltavel, this.pos);
	}
	
	update(delta)
	{
		this.accelerate(this.acc, delta);
		this.move(this.vel, delta);
	}
	
	updateBox()
	{
		vector3.add(this.pos, this.boxmin, this.globoxmin);
		vector3.add(this.pos, this.boxmax, this.globoxmax);
	}
}
