export default class Display
{
	constructor(width, height)
	{
		let canvas = document.createElement("canvas");
		
		canvas.width = width;
		canvas.height = height;
		
		this.canvas = canvas;
	}
	
	appendToBody()
	{
		document.body.appendChild(this.canvas);
	}
}
