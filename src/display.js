export default class Display
{
	constructor()
	{
		let canvas = document.createElement("canvas");
		
		canvas.style.position = "absolute";
		canvas.style.left = "0";
		canvas.style.top = "0";
		canvas.style.width = "100%";
		canvas.style.height = "100%";
		
		let gl = canvas.getContext("webgl", {alpha: false, antialias: false});
		
		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);
		gl.enable(gl.BLEND);
		
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		
		let self = this;
		
		requestAnimationFrame(function frame() {
			requestAnimationFrame(frame);
			self.adjustCanvasSize();
			self.onframe();
		});
		
		this.canvas = canvas;
		this.gl = gl;
		this.onframe = () => {};
		this.cache = {};
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
	
	adjustCanvasSize()
	{
		let gl = this.gl;
		let canvas = this.canvas;
		let w = canvas.clientWidth;
		let h = canvas.clientHeight;
		
		if(w !== canvas.width || h !== canvas.height) {
			canvas.width = w;
			canvas.height = h;
			gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
		}
	}
	
	getAspect()
	{
		let canvas = this.canvas;
		
		return canvas.clientWidth / canvas.clientHeight;
	}
	
	getCached(id, factory)
	{
		if(!this.cache[id]) {
			this.cache[id] = factory();
		}
		
		return this.cache[id];
	}
}
