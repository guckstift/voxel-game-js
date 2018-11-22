import * as vector3 from "./vector3.js";

export class Body
{
	constructor(world)
	{
		this.world = world;
		this.pos = vector3.create();
		this.vel = vector3.create();
		this.acc = vector3.create();
		this.dir = vector3.create();
		this.speed = 0;
	}
	
	update(delta)
	{
		vector3.addScaled(this.vel, this.acc, delta, this.vel);
		
		this.speed = vector3.length(this.vel);
		
		vector3.scale(this.vel, 1 / this.speed, this.dir);
		
		let hit = this.world.hitBlock(this.dir, this.pos, this.speed * delta);
		
		if(hit) {
			this.vel[hit.axis] = (hit.isec[hit.axis] - this.pos[hit.axis]) / delta;
			
			this.speed = vector3.length(this.vel);
			
			vector3.scale(this.vel, 1 / this.speed, this.dir);
		}
		
		vector3.addScaled(this.pos, this.vel, delta, this.pos);
	}
}
