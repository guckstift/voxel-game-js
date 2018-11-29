import * as vector from "./vector.js";

let sqrt  = Math.sqrt;
let floor = Math.floor;
let ceil  = Math.ceil;
let abs   = Math.abs;

let dir      = vector.create64();
let voxpos   = vector.create64();
let step     = vector.create64();
let waydelta = vector.create64();
let waynext  = vector.create64();

export function raycast(start, vec, getvox)
{
	let len      = sqrt(vec[0] ** 2 + vec[1] ** 2 + vec[2] ** 2);
	let way      = 0;
	let axis     = 0;
	let distnext = 0;
	
	if(len === 0) {
		return;
	}
	
	for(let k=0; k<3; k++) {
		dir[k]      = vec[k] / len;
		waydelta[k] = abs(1 / dir[k]);
		
		if(dir[k] > 0) {
			step[k]   = 1;
			voxpos[k] = ceil(start[k]) - 1;
			distnext  = ceil(start[k]) - start[k];
		}
		else {
			step[k]   = -1;
			voxpos[k] = floor(start[k]);
			distnext  = start[k] - floor(start[k]);
		}
		
		if(waydelta[k] === Infinity) {
			waynext[k] = Infinity;
		}
		else {
			waynext[k] = waydelta[k] * distnext;
		}
	}
	
	while(way <= len) {
		if(waynext[0] < waynext[1] && waynext[0] < waynext[2]) {
			axis = 0;
		}
		else if(waynext[1] < waynext[2]) {
			axis = 1;
		}
		else {
			axis = 2;
		}
		
		way            = waynext[axis];
		waynext[axis] += waydelta[axis];
		voxpos[axis]  += step[axis];
		
		if(way <= len && getvox(voxpos)) {
			return {
				axis,
				voxpos: [
					voxpos[0],
					voxpos[1],
					voxpos[2],
				],
				hitpos: [
					start[0] + way * dir[0],
					start[1] + way * dir[1],
					start[2] + way * dir[2],
				],
				normal: [
					axis === 0 ? -step[0] : 0,
					axis === 1 ? -step[1] : 0,
					axis === 2 ? -step[2] : 0,
				],
			};
		}
	}
}
