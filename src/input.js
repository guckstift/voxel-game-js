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
		this.onWheelUp = noop;
		this.onWheelDown = noop;
		
		window.onresize = e => {
			this.onResize();
		};
		
		document.onpointerlockchange = e => {
			if(document.pointerLockElement === target) {
				this.panning = true;
			}
			else {
				this.panning = false;
			}
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

		document.onwheel = e => {
			if(this.panning) {
				if(e.deltaY < 0) {
					this.onWheelUp();
				}
				else if(e.deltaY > 0) {
					this.onWheelDown();
				}
			}
		};
		
		target.onmousedown = e => {
			if(this.panning) {
				this.onClick(e);
			}
			else {
				target.requestPointerLock();
			}
		};

		target.onmousemove = e => {
			if(this.panning) {
				this.onMove(e);
			}
		};
	}
}
