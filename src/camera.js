import Matrix from "./matrix.js";

export default class Camera
{
	constructor(fovy, aspect, near, far, x, y, z)
	{
		this.fovy = fovy;
		this.aspect = aspect;
		this.near = near;
		this.far = far;
		this.x = x;
		this.y = y;
		this.z = z;
		this.proj = new Matrix();
		this.view = new Matrix();
	}
	
	update()
	{
		this.proj.perspective(this.fovy * Math.PI / 180, this.aspect, this.near, this.far)
		this.view.set();
		this.view.translate(-this.x, -this.y, -this.z);
	}
}
