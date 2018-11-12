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
