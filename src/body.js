import Vector from "./vector.js";

export default class Body
{
	constructor(map, x, y, z, rx, rz, boxmin, boxmax)
	{
		this.map = map;
		this.pos = new Vector(x, y, z);
		this.rx = rx;
		this.rz = rz;
		this.boxmin = new Vector(...boxmin);
		this.boxmax = new Vector(...boxmax);
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
		}
		
		this.pos.add(deltavec);
	}
}
