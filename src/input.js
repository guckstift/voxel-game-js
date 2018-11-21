export class Input
{
	constructor(target)
	{
		this.keymap = {};
		this.panning = false;
		this.onMove = () => {};
		this.onClick = () => {};
		
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
			if(this.panning) {
				this.onClick();
			}
			else {
				target.requestPointerLock();
			}
		};
		
		document.onpointerlockchange = e => {
			if(document.pointerLockElement === target) {
				this.panning = true;
			}
			else {
				this.panning = false;
			}
		};

		target.onmousemove = e => {
			if(this.panning) {
				this.onMove(e);
			}
		};
	}
}
