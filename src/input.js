const noop = () => {};

export class Input
{
	constructor(target)
	{
		this.keymap = {};
		this.panning = false;
		this.onMove = noop;
		this.onClick = noop;
		this.onResize = noop;
		this.onKeyDown = noop;
		this.onKeyUp = noop;
		
		window.onresize = e => {
			this.onResize();
		};
		
		document.onkeydown = e => {
			let key = e.key.toLowerCase();
			
			if(key === " ") {
				key = "space";
			}
			
			if(!this.keymap[key]) {
				this.keymap[key] = true;
				this.onKeyDown(key);
			}
		};

		document.onkeyup = e => {
			let key = e.key.toLowerCase();
			
			if(key === " ") {
				key = "space";
			}
			
			this.keymap[key] = false;
			this.onKeyUp(key);
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
