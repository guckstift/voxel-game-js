import {Field} from "../src/field.js";
import {smoothMix3d} from "../src/math.js";

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

export function noise1d(x, s)
{
	x *= 15485863; // mult with 1000000. prime
	x *= s || 1;
	x ^= x >> 2;   // xor with r-shift with 1. prime
	x ^= x << 5;   // xor with l-shift with 3. prime
	x ^= x >> 11;  // xor with r-shift with 5. prime
	x ^= x << 17;  // xor with l-shift with 7. prime
	x ^= x >> 23;  // xor with r-shift with 9. prime
	x ^= x << 31;  // xor with l-shift with 11. prime
	
	return (x + 0x80000000) / 0xFFffFFff;
}

export function noise2d(x, y, s)
{
	x *= 15485863;  // mult with 1000000. prime
	y *= 285058399; // mult with 15485863. prime
	x += y;
	x *= s || 1;
	x ^= x >> 2;   // xor with r-shift with 1. prime
	x ^= x << 5;   // xor with l-shift with 3. prime
	x ^= x >> 11;  // xor with r-shift with 5. prime
	x ^= x << 17;  // xor with l-shift with 7. prime
	x ^= x >> 23;  // xor with r-shift with 9. prime
	x ^= x << 31;  // xor with l-shift with 11. prime
	
	return (x + 0x80000000) / 0xFFffFFff;
}

export function noise3d(x, y, z, s)
{
	x *= 15485863;   // mult with 1000000. prime
	y *= 285058399;  // mult with 15485863. prime
	z *= 6124192049; // mult with 285058399. prime
	x += y + z;
	x *= s || 1;
	x ^= x >> 2;   // xor with r-shift with 1. prime
	x ^= x << 5;   // xor with l-shift with 3. prime
	x ^= x >> 11;  // xor with r-shift with 5. prime
	x ^= x << 17;  // xor with l-shift with 7. prime
	x ^= x >> 23;  // xor with r-shift with 9. prime
	x ^= x << 31;  // xor with l-shift with 11. prime
	
	return (x + 0x80000000) / 0xFFffFFff;
}
