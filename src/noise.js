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
