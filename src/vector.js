export default class Vector
{
	constructor(x = 0, y = 0, z = 0)
	{
		this.data = [x, y, z];
	}
	
	get x()
	{
		return this.data[0];
	}
	
	get y()
	{
		return this.data[1];
	}
	
	get z()
	{
		return this.data[2];
	}
	
	set(x = 0, y = 0, z = 0)
	{
		this.data[0] = x;
		this.data[1] = y;
		this.data[2] = z;
	}
	
	addScaled(other, scale)
	{
		this.data[0] += other.data[0] * scale;
		this.data[1] += other.data[1] * scale;
		this.data[2] += other.data[2] * scale;
	}

	rotateZ(a)
	{
		let v = this.data;
		let s = Math.sin(a);
		let c = Math.cos(a);
		let x = v[0];
		let y = v[1];
		v[0] = x * c - y * s;
		v[1] = x * s + y * c;
	}
}
