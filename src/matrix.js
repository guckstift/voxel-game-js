export function identity(out = new Float32Array(16))
{
	out.set([
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1,
	]);
	
	return out;
}

export function translation(x = 0, y = 0, z = 0, out = new Float32Array(16))
{
	out.set([
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		x, y, z, 1,
	]);
	
	return out;
}

export function scaling(x = 1, y = 1, z = 1, out = new Float32Array(16))
{
	out.set([
		x, 0, 0, 0,
		0, y, 0, 0,
		0, 0, z, 0,
		0, 0, 0, 1,
	]);
	
	return out;
}

export function rotationZ(a = 0, out = new Float32Array(16))
{
	let s = Math.sin(a);
	let c = Math.cos(a);
	
	out.set([
		 c, s, 0, 0,
		-s, c, 0, 0,
		 0, 0, 1, 0,
		 0, 0, 0, 1,
	]);
	
	return out;
}
