export default class Display
{
	constructor(width, height)
	{
		let canvas = document.createElement("canvas");
		
		canvas.width = width;
		canvas.height = height;
		
		let gl = canvas.getContext("webgl");
		
		this.canvas = canvas;
		this.gl = gl;
	}
	
	appendToBody()
	{
		document.body.appendChild(this.canvas);
	}
}
