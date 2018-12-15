import {Field} from "./field.js";
import {noise3d} from "./noise.js";
import {smoothMix3d} from "./math.js";

export class NoiseField
{
	constructor(seed = 0, amp = 1, scale = 1)
	{
		this.seed = seed;
		this.amp = amp;
		this.invscale = 1 / scale;
		this.samples = new Field((x, y, z) => this.amp * noise3d(x, y, z, this.seed));
	}
	
	sample(x, y, z)
	{
		x *= this.invscale;
		y *= this.invscale;
		z *= this.invscale;
		
		let ix  = Math.floor(x);
		let iy  = Math.floor(y);
		let iz  = Math.floor(z);
		let aaa = this.samples.get(ix,     iy,     iz);
		let baa = this.samples.get(ix + 1, iy,     iz);
		let aba = this.samples.get(ix,     iy + 1, iz);
		let bba = this.samples.get(ix + 1, iy + 1, iz);
		let aab = this.samples.get(ix,     iy,     iz + 1);
		let bab = this.samples.get(ix + 1, iy,     iz + 1);
		let abb = this.samples.get(ix,     iy + 1, iz + 1);
		let bbb = this.samples.get(ix + 1, iy + 1, iz + 1);
		
		return smoothMix3d(aaa, baa, aba, bba, aab, bab, abb, bbb, x - ix, y - iy, z - iz);
	}
}
