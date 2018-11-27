import * as vector3 from "./vector3.js";

let epsilon = 1 / 1024;

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
	
	accelerate(acc, delta)
	{
		vector3.addScaled(this.vel, acc, delta, this.vel);
	}
	
	move(vel, delta)
	{
		let vec = vector3.scale(vel, delta);
		let hit = world.raycast(this.pos, vec);
		
		while(hit) {
			this.pos[hit.axis] = hit.hitpos[hit.axis] + hit.normal[hit.axis] * epsilon;
			vec[hit.axis] = 0;
			vel[hit.axis] = 0;
			hit = world.raycast(this.pos, vec);
		}
		
		vector3.add(this.pos, vec, this.pos);
	}
	
	update(delta)
	{
		this.accelerate(this.acc, delta);
		this.move(this.vel, delta);
	}
}
