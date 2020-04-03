import Body from "./body.js";
import Bone from "./bone.js";

export default class Mob extends Body
{
	constructor(map, x, y, z, rx, rz, boxmin, boxmax, model)
	{
		super(map, x, y, z, rx, rz, boxmin, boxmax);
		
		this.model = model;
		this.bones = model.roots.map(root => new Bone(...root));
	}
	
	update(delta)
	{
		super.update(delta);
		
		this.model.update();
		this.bones.forEach(b => b.update());
	}
	
	draw(camera, sun)
	{
		this.model.draw(camera, sun, this.mat, this.bones.map(b => b.mat));
	}
}
