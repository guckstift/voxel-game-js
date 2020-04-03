import Vector from "./vector.js";
import Matrix from "./matrix.js";
import {radians} from "./math.js";

export default class Bone
{
	constructor(rootX, rootY, rootZ)
	{
		this.root = new Vector(rootX, rootY, rootZ);
		this.rx = 0;
		this.ry = 0;
		this.rz = 0;
		this.mat = new Matrix();
	}
	
	update()
	{
		this.mat.set();
		this.mat.translate(this.root.x, this.root.y, this.root.z);
		this.mat.rotateX(radians(this.rx));
		this.mat.rotateX(radians(this.ry));
		this.mat.rotateX(radians(this.rz));
		this.mat.translate(-this.root.x, -this.root.y, -this.root.z);
	}
}
