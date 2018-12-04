import * as vector from "./vector.js";

export class Body
{
	constructor(
		world,
		boxmin = vector.create(-0.25, -0.25, -0.25),
		boxmax = vector.create( 0.25,  0.25,  0.25)
	) {
		this.world = world;
		this.boxmin = boxmin;
		this.boxmax = boxmax;
		
		this.pos  = vector.create64();
		this.vel  = vector.create();
		this.acc  = vector.create();
		this.rest = new Int8Array(3);
		
		this.deltavel  = vector.create();
		this.globoxmin = vector.create64();
		this.globoxmax = vector.create64();
	}
	
	accelerate(acc, delta)
	{
		vector.addScaled(this.vel, acc, delta, this.vel);
	}
	
	move(vel, delta)
	{
		vector.scale(vel, delta, this.deltavel);
		this.updateBox();
		this.rest[0] = 0;
		this.rest[1] = 0;
		this.rest[2] = 0;
		
		let hit = world.boxcast(this.globoxmin, this.globoxmax, this.deltavel);
		
		for(let i = 0; i < 3 && hit; i ++) {
			if(hit.step > 0) {
				this.pos[hit.axis] = hit.pos - this.boxmax[hit.axis];
			}
			else {
				this.pos[hit.axis] = hit.pos - this.boxmin[hit.axis];
			}
			
			this.rest[hit.axis]     = hit.step;
			this.deltavel[hit.axis] = 0;
			vel[hit.axis]           = 0;
			
			this.updateBox();
			
			hit = world.boxcast(this.globoxmin, this.globoxmax, this.deltavel);
		}
		
		vector.add(this.pos, this.deltavel, this.pos);
	}
	
	update(delta)
	{
		this.accelerate(this.acc, delta);
		this.move(this.vel, delta);
	}
	
	updateBox()
	{
		vector.add(this.pos, this.boxmin, this.globoxmin);
		vector.add(this.pos, this.boxmax, this.globoxmax);
	}
}
