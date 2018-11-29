import * as vector from "./vector.js";

let sqrt  = Math.sqrt;
let floor = Math.floor;
let ceil  = Math.ceil;
let abs   = Math.abs;

let dir      = vector.create64();
let lead     = vector.create64();
let voxpos   = vector.create64();
let leadvox  = vector.create64();
let trailvox = vector.create64();
let step     = vector.create64();
let waydelta = vector.create64();
let waynext  = vector.create64();

export function boxcast(boxmin, boxmax, vec, getvox)
{
	let len      = sqrt(vec[0] ** 2 + vec[1] ** 2 + vec[2] ** 2);
	let way      = 0;
	let axis     = 0;
	let distnext = 0;
	let trail    = 0;
	
	if(len === 0) {
		return;
	}
	
	for(let k = 0; k < 3; k ++) {
		dir[k]      = vec[k] / len;
		waydelta[k] = abs(1 / dir[k]);
		
		if(dir[k] > 0) {
			step[k]     = 1;
			lead[k]     = boxmax[k];
			trail       = boxmin[k];
			leadvox[k]  = ceil(lead[k]) - 1;
			trailvox[k] = floor(trail);
			distnext    = ceil(lead[k]) - lead[k];
		}
		else {
			step[k]     = -1;
			lead[k]     = boxmin[k];
			trail       = boxmax[k];
			leadvox[k]  = floor(lead[k]);
			trailvox[k] = ceil(trail) - 1;
			distnext    = lead[k] - floor(lead[k]);
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
		
		way             = waynext[axis];
		waynext[axis]  += waydelta[axis];
		leadvox[axis]  += step[axis];
		trailvox[axis] += step[axis];
		
		if(way <= len) {
			let stepx = step[0];
			let stepy = step[1];
			let stepz = step[2];
			let xs = axis === 0 ? leadvox[0] : trailvox[0];
			let ys = axis === 1 ? leadvox[1] : trailvox[1];
			let zs = axis === 2 ? leadvox[2] : trailvox[2];
			let xe = leadvox[0] + stepx;
			let ye = leadvox[1] + stepy;
			let ze = leadvox[2] + stepz;

			for(let x = xs; x !== xe; x += stepx) {
				for(let y = ys; y !== ye; y += stepy) {
					for(let z = zs; z !== ze; z += stepz) {
						voxpos[0] = x;
						voxpos[1] = y;
						voxpos[2] = z;
						
						if(getvox(voxpos)) {
							return {
								axis: axis,
								step: step[axis],
								pos:  lead[axis] + way * dir[axis],
							};
						}
					}
				}
			}
		}
	}
}
