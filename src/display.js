export default class Display
{
	constructor(width, height)
	{
		let canvas = document.createElement("canvas");
		
		canvas.width = width;
		canvas.height = height;
		
		let gl = canvas.getContext("webgl");
		
		let self = this;
		
		requestAnimationFrame(function frame() {
			requestAnimationFrame(frame);
			self.onframe();
		});
		
		this.canvas = canvas;
		this.gl = gl;
		this.onframe = () => {};
	}
	
	appendToBody()
	{
		document.body.appendChild(this.canvas);
	}
	
	drawTriangles(count)
	{
		let gl = this.gl;
		
		gl.drawArrays(gl.TRIANGLES, 0, count);
	}
}
