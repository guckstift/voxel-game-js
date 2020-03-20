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
}
