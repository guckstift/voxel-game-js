export class Input
{
	constructor(target)
	{
		this.keymap = {};
		this.panning = false;
		this.onMove = () => {};
		
		document.onkeydown = e => {
			let key = e.key.toLowerCase();
			
			if(key === " ") {
				key = "space";
			}
			
			this.keymap[key] = true;
		};

		document.onkeyup = e => {
			let key = e.key.toLowerCase();
			
			if(key === " ") {
				key = "space";
			}
			
			this.keymap[key] = false;
		};

		target.onmousedown = e => {
			target.requestPointerLock();
			this.panning = true;
		};

		target.onmouseup = e => {
			document.exitPointerLock();
			this.panning = false;
		};

		target.onmousemove = e => {
			this.onMove(e);
		};
	}
}
