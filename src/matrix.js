export default class Matrix
{
	constructor()
	{
		this.data = [
			1,0,0,0,
			0,1,0,0,
			0,0,1,0,
			0,0,0,1,
		];
	}
	
	set(
		m00 = 1, m01 = 0, m02 = 0, m03 = 0,
		m10 = 0, m11 = 1, m12 = 0, m13 = 0,
		m20 = 0, m21 = 0, m22 = 1, m23 = 0,
		m30 = 0, m31 = 0, m32 = 0, m33 = 1,
	) {
		let m = this.data;
		
		m[0]  = m00;
		m[1]  = m01;
		m[2]  = m02;
		m[3]  = m03;
		m[4]  = m10;
		m[5]  = m11;
		m[6]  = m12;
		m[7]  = m13;
		m[8]  = m20;
		m[9]  = m21;
		m[10] = m22;
		m[11] = m23;
		m[12] = m30;
		m[13] = m31;
		m[14] = m32;
		m[15] = m33;
	}
	
	perspective(fovy, aspect, near, far)
	{
		let fy = 1 / Math.tan(fovy / 2);
		let fx = fy / aspect;
		let nf = 1 / (near - far);
		let a  = (near + far) * nf;
		let b  = 2 * near * far * nf;
		
		this.set(
			fx, 0, 0, 0,
			 0,fy, 0, 0,
			 0, 0, a,-1,
			 0, 0, b, 0,
		);
	}
	
	translate(x, y, z)
	{
		let m = this.data;
		
		m[12] += x * m[0] + y * m[4] + z * m[8];
		m[13] += x * m[1] + y * m[5] + z * m[9];
		m[14] += x * m[2] + y * m[6] + z * m[10];
		m[15] += x * m[3] + y * m[7] + z * m[11];
	}
}
