export function create(x = 0, y = 0, z = 0, out = new Float32Array(3))
{
	out[0] = x;
	out[1] = y;
	out[2] = z;
	
	return out;
}

export function copy(src, out = new Float32Array(3))
{
	out[0] = src[0];
	out[1] = src[1];
	out[2] = src[2];
	
	return out;
}

export function transform(v, m, out = new Float32Array(3))
{
	let x = v[0], y = v[1], z = v[2];
	
	out.set([
		x * m[0] + y * m[4] + z * m[8]  + w * m[12],
		x * m[1] + y * m[5] + z * m[9]  + w * m[13],
		x * m[2] + y * m[6] + z * m[10] + w * m[14],
	]);
	
	return out;
}

export function squareLength(v)
{
	return v[0] ** 2 + v[1] ** 2 + v[2] ** 2;
}

export function length(v)
{
	return Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
}

export function squareDist(a, b)
{
	return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}

export function dist(a, b)
{
	return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

export function normalize(v, out = new Float32Array(3))
{
	return scale(v, 1 / length(v));
}

export function add(a, b, out = new Float32Array(3))
{
	out[0] = a[0] + b[0];
	out[1] = a[1] + b[1];
	out[2] = a[2] + b[2];
	
	return out;
}

export function sub(a, b, out = new Float32Array(3))
{
	out[0] = a[0] - b[0];
	out[1] = a[1] - b[1];
	out[2] = a[2] - b[2];
	
	return out;
}

export function mul(a, b, out = new Float32Array(3))
{
	out[0] = a[0] * b[0];
	out[1] = a[1] * b[1];
	out[2] = a[2] * b[2];
	
	return out;
}

export function div(a, b, out = new Float32Array(3))
{
	out[0] = a[0] / b[0];
	out[1] = a[1] / b[1];
	out[2] = a[2] / b[2];
	
	return out;
}

export function scale(v, s, out = new Float32Array(3))
{
	out[0] = v[0] * s;
	out[1] = v[1] * s;
	out[2] = v[2] * s;
	
	return out;
}

export function addScaled(a, b, s, out = new Float32Array(3))
{
	out[0] = a[0] + b[0] * s;
	out[1] = a[1] + b[1] * s;
	out[2] = a[2] + b[2] * s;
	
	return out;
}

export function rotateX(v, a, out = new Float32Array(3))
{
	let s = Math.sin(a);
	let c = Math.cos(a);
	
	return create(
		v[0],
		v[1] * c - v[2] * s,
		v[1] * s + v[2] * c,
		out,
	);
}

export function rotateY(v, a, out = new Float32Array(3))
{
	let s = Math.sin(a);
	let c = Math.cos(a);
	
	return create(
		v[0] * c - v[2] * s,
		v[1],
		v[0] * s + v[2] * c,
		out,
	);
}

export function rotateZ(v, a, out = new Float32Array(3))
{
	let s = Math.sin(a);
	let c = Math.cos(a);
	
	return create(
		v[0] * c - v[1] * s,
		v[0] * s + v[1] * c,
		v[2],
		out,
	);
}

export function rotate90degX(v, a, out = new Float32Array(3))
{
	return create(v[0], -v[2], v[1], out);
}

export function rotate90degY(v, a, out = new Float32Array(3))
{
	return create(-v[2], v[1], v[0], out);
}

export function rotate90degZ(v, a, out = new Float32Array(3))
{
	return create(-v[1], v[0], v[2], out);
}
