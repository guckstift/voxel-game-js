export class Input
{
	constructor(target)
	{
		this.keymap = {};
		this.panning = false;
		this.onMove = () => {};
		
		document.onkeydown = e => {
			this.keymap[e.key] = true;
		};

		document.onkeyup = e => {
			this.keymap[e.key] = false;
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
