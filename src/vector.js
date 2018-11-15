export function create(x = 0, y = 0, z = 0, w = 1, out = new Float32Array(4))
{
	out[0] = x;
	out[1] = y;
	out[2] = z;
	out[3] = w;
	
	return out;
}

export function transform(v, m, out = new Float32Array(4))
{
	let x = v[0], y = v[1], z = v[2], w = v[3];
	
	out.set([
		x * m[0] + y * m[4] + z * m[8]  + w * m[12],
		x * m[1] + y * m[5] + z * m[9]  + w * m[13],
		x * m[2] + y * m[6] + z * m[10] + w * m[14],
		x * m[3] + y * m[7] + z * m[11] + w * m[15],
	]);
	
	return out;
}

export function round(v, out = new Float32Array(4))
{
	out[0] = Math.round(v[0]);
	out[1] = Math.round(v[1]);
	out[2] = Math.round(v[2]);
	out[3] = Math.round(v[3]);
	
	return out;
}

export function add(a, b, out = new Float32Array(4))
{
	out[0] = a[0] + b[0];
	out[1] = a[1] + b[1];
	out[2] = a[2] + b[2];
	out[3] = a[3] + b[3];
	
	return out;
}

export function sub(a, b, out = new Float32Array(4))
{
	out[0] = a[0] - b[0];
	out[1] = a[1] - b[1];
	out[2] = a[2] - b[2];
	out[3] = a[3] - b[3];
	
	return out;
}

export function multiply(a, b, out = new Float32Array(4))
{
	out[0] = a[0] * b[0];
	out[1] = a[1] * b[1];
	out[2] = a[2] * b[2];
	out[3] = a[3] * b[3];
	
	return out;
}

export function rotateX(v, a, out = new Float32Array(4))
{
	let s = Math.sin(a);
	let c = Math.cos(a);
	
	return create(
		v[0],
		v[1] * c - v[2] * s,
		v[1] * s + v[2] * c,
		v[3],
		out,
	);
}

export function rotateY(v, a, out = new Float32Array(4))
{
	let s = Math.sin(a);
	let c = Math.cos(a);
	
	return create(
		v[0] * c - v[2] * s,
		v[1],
		v[0] * s + v[2] * c,
		v[3],
		out,
	);
}

export function rotateZ(v, a, out = new Float32Array(4))
{
	let s = Math.sin(a);
	let c = Math.cos(a);
	
	return create(
		v[0] * c - v[1] * s,
		v[0] * s + v[1] * c,
		v[2],
		v[3],
		out,
	);
}
