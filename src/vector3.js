export function create(x = 0, y = 0, z = 0, out = new Float32Array(3))
{
	out[0] = x;
	out[1] = y;
	out[2] = z;
	
	return out;
}

export function squareDist(a, b)
{
	return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}
