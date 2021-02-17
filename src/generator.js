export default class Generator
{
	rand2d(x, y)
	{
		x *= 15485863;   // mult with 1000000. prime
		y *= 285058399;  // mult with 15485863. prime
		x += y;          // add x and y together
		x *= 3141592653; // scramble with 10 first digits of PI
		x ^= x >>> 2;    // xor with r-shift with 1. prime
		x ^= x << 5;     // xor with l-shift with 3. prime
		x ^= x >>> 11;   // xor with r-shift with 5. prime
		x ^= x << 17;    // xor with l-shift with 7. prime
		x ^= x >>> 23;   // xor with r-shift with 9. prime
		x ^= x << 31;    // xor with l-shift with 11. prime
		
		return (x >>> 0) / 0xFFffFFff;
	}

	smooth(x, a, b)
	{
		return a + (3 * x ** 2 - 2 * x ** 3) * (b - a);
	}

	sample2d(x, y)
	{
		let ax = Math.floor(x);
		let ay = Math.floor(y);
		let bx = Math.ceil(x);
		let by = Math.ceil(y);
		let aa = this.rand2d(ax, ay);
		let ab = this.rand2d(ax, by);
		let ba = this.rand2d(bx, ay);
		let bb = this.rand2d(bx, by);
		let fx = x - ax;
		let fy = y - ay;
		
		return this.smooth(fy,
			this.smooth(fx, aa, ba),
			this.smooth(fx, ab, bb),
		);
	}

	getBlock(x, y, z)
	{
		let height = Math.floor(16 * this.sample2d(x / 16, y / 16));
		
		if(z < height / 3 * 2) {
			return 3;
		}
		else if(height <= 8 && z <= height) {
			return 5;
		}
		else if(z < height) {
			return 2;
		}
		else if(z === height) {
			return 1;
		}
		else if(z < 8) {
			return 4;
		}
		else {
			return 0;
		}
	}
}
