import Matrix from "./matrix.js";
import {radians} from "./math.js";

export default class Camera
{
	constructor(fovy, aspect, near, far, x, y, z, rx, rz)
	{
		this.fovy = fovy;
		this.aspect = aspect;
		this.near = near;
		this.far = far;
		this.x = x;
		this.y = y;
		this.z = z;
		this.rx = rx;
		this.rz = rz;
		this.proj = new Matrix();
		this.view = new Matrix();
	}
	
	update()
	{
		this.proj.perspective(radians(this.fovy), this.aspect, this.near, this.far)
		this.view.set();
		this.view.rotateX(-radians(this.rx));
		this.view.rotateZ(-radians(this.rz));
		this.view.translate(-this.x, -this.y, -this.z);
	}
}
