export default class Controller
{
	constructor()
	{
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
}
