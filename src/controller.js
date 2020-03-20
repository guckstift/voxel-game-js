export default class Controller
{
	constructor(camera)
	{
		this.camera = camera;
		this.keymap = {};
		
		window.addEventListener("keydown", e => this.keydown(e));
		window.addEventListener("keyup", e => this.keyup(e));
	}
	
	getKey(e)
	{
		let key = e.key.toLowerCase();
		
		if(key === " ") {
			key = "space";
		}
		
		return key;
	}
	
	keydown(e)
	{
		let key = this.getKey(e);
		
		this.keymap[key] = true;
	}
	
	keyup(e)
	{
		let key = this.getKey(e);
		
		this.keymap[key] = false;
	}
	
	update(delta)
	{
		if(this.keymap.w) {
			this.camera.moveForward(delta);
		}
		if(this.keymap.s) {
			this.camera.moveBackward(delta);
		}
	}
}
