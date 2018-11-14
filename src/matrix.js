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

export function rotationX(a = 0, out = new Float32Array(16))
{
	let s = Math.sin(a);
	let c = Math.cos(a);
	
	out.set([
		 1, 0, 0, 0,
		 0, c, s, 0,
		 0,-s, c, 0,
		 0, 0, 0, 1,
	]);
	
	return out;
}

export function rotationY(a = 0, out = new Float32Array(16))
{
	let s = Math.sin(a);
	let c = Math.cos(a);
	
	out.set([
		 c, 0, s, 0,
		 0, 1, 0, 0,
		-s, 0, c, 0,
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

export function perspective(fovy, aspect, near, far, out = new Float32Array(16))
{
	let fy = 1 / Math.tan(fovy / 2);
	let fx = fy / aspect;
	let nf = 1 / (near - far);
	let a  = -(near + far) * nf;
	let b  = 2 * far * near * nf;
	
	out.set([
		fx, 0,  0, 0,
		0,  fy, 0, 0,
		0,  0,  a, 1,
		0,  0,  b, 0,
	]);
	
	return out;
}

export function multiply(a, b, out = new Float32Array(16))
{
	let a00 = a[0],  a01 = a[1],  a02 = a[2],  a03 = a[3];
	let a10 = a[4],  a11 = a[5],  a12 = a[6],  a13 = a[7];
	let a20 = a[8],  a21 = a[9],  a22 = a[10], a23 = a[11];
	let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
	
	let b0, b1, b2, b3;

	b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
	
	out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
	out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
	out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
	out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

	b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
	
	out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
	out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
	out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
	out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

	b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
	
	out[8]  = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
	out[9]  = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
	out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
	out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

	b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
	
	out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
	out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
	out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
	out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
	
	return out;
}

export function translate(m, x = 0, y = 0, z = 0, out = new Float32Array(16))
{
	let a00 = m[0], a01 = m[1], a02 = m[2],  a03 = m[3];
	let a10 = m[4], a11 = m[5], a12 = m[6],  a13 = m[7];
	let a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
	
	out[0]  = a00;
	out[1]  = a01;
	out[2]  = a02;
	out[3]  = a03;
	out[4]  = a10;
	out[5]  = a11;
	out[6]  = a12;
	out[7]  = a13;
	out[8]  = a20;
	out[9]  = a21;
	out[10] = a22;
	out[11] = a23;
	out[12] = x * a00 + y * a10 + z * a20 + m[12];
	out[13] = x * a01 + y * a11 + z * a21 + m[13];
	out[14] = x * a02 + y * a12 + z * a22 + m[14];
	out[15] = x * a03 + y * a13 + z * a23 + m[15];
	
	return out;
}

export function scale(m, x = 1, y = 1, z = 1, out = new Float32Array(16))
{
	out[0]  = x * m[0];
	out[1]  = x * m[1];
	out[2]  = x * m[2];
	out[3]  = x * m[3];
	out[4]  = y * m[4];
	out[5]  = y * m[5];
	out[6]  = y * m[6];
	out[7]  = y * m[7];
	out[8]  = z * m[8];
	out[9]  = z * m[9];
	out[10] = z * m[10];
	out[11] = z * m[11];
	out[12] = m[12];
	out[13] = m[13];
	out[14] = m[14];
	out[15] = m[15];
	
	return out;
}

export function rotateX(m, a, out = new Float32Array(16))
{
	let s = Math.sin(a);
	let c = Math.cos(a);
	
	let a10 = m[4], a11 = m[5], a12 = m[6],  a13 = m[7];
	let a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
	
	out[0]  =  m[0];
	out[1]  =  m[1];
	out[2]  =  m[2];
	out[3]  =  m[3];
	out[4]  =  c * a10 + s * a20;
	out[5]  =  c * a11 + s * a21;
	out[6]  =  c * a12 + s * a22;
	out[7]  =  c * a13 + s * a23;
	out[8]  = -s * a10 + c * a20;
	out[9]  = -s * a11 + c * a21;
	out[10] = -s * a12 + c * a22;
	out[11] = -s * a13 + c * a23;
	out[12] =  m[12];
	out[13] =  m[13];
	out[14] =  m[14];
	out[15] =  m[15];
	
	return out;
}

export function rotateY(m, a = 0, out = new Float32Array(16))
{
	let s = Math.sin(a);
	let c = Math.cos(a);
	
	let a00 = m[0], a01 = m[1], a02 = m[2],  a03 = m[3];
	let a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
	
	out[0]  =  c * a00 + s * a20;
	out[1]  =  c * a01 + s * a21;
	out[2]  =  c * a02 + s * a22;
	out[3]  =  c * a03 + s * a23;
	out[4]  =  m[4];
	out[5]  =  m[5];
	out[6]  =  m[6];
	out[7]  =  m[7];
	out[8]  = -s * a00 + c * a20;
	out[9]  = -s * a01 + c * a21;
	out[10] = -s * a02 + c * a22;
	out[11] = -s * a03 + c * a23;
	out[12] =  m[12];
	out[13] =  m[13];
	out[14] =  m[14];
	out[15] =  m[15];
	
	return out;
}

export function rotateZ(m, a = 0, out = new Float32Array(16))
{
	let s = Math.sin(a);
	let c = Math.cos(a);
	
	let a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3];
	let a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7];
	
	out[0]  =  c * a00 + s * a10;
	out[1]  =  c * a01 + s * a11;
	out[2]  =  c * a02 + s * a12;
	out[3]  =  c * a03 + s * a13;
	out[4]  = -s * a00 + c * a10;
	out[5]  = -s * a01 + c * a11;
	out[6]  = -s * a02 + c * a12;
	out[7]  = -s * a03 + c * a13;
	out[8]  =  m[8];
	out[9]  =  m[9];
	out[10] =  m[10];
	out[11] =  m[11];
	out[12] =  m[12];
	out[13] =  m[13];
	out[14] =  m[14];
	out[15] =  m[15];
	
	return out;
}
