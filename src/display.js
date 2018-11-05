import {Shader} from "./shader.js";

export class Display
{
	constructor()
	{
		let canvas = document.createElement("canvas");
		let gl = canvas.getContext("webgl", {alpha: false, antialias: false});

		gl.clearColor(0,0,0,0);
		
		this.canvas = canvas;
		this.gl = gl;
		this.frame = this.frame.bind(this);
		this.resize(800, 600);
		
		requestAnimationFrame(this.frame);
	}
	
	get aspect()
	{
		return this.canvas.width / this.canvas.height;
	}
	
	frame()
	{
		if(this.onRender) {
			this.onRender();
		}
		
		requestAnimationFrame(this.frame);
	}
	
	resize(w, h)
	{
		let gl = this.gl;
		
		this.canvas.width = w;
		this.canvas.height = h;
		
		gl.viewport(0, 0, w, h);
	}
	
	createShader(vertSrc, fragSrc)
	{
		return new Shader(this, vertSrc, fragSrc);
	}
	
	createStaticBuffer(data)
	{
		let gl = this.gl;
		let buf = gl.createBuffer();
		
		gl.bindBuffer(gl.ARRAY_BUFFER, buf);
		gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
		
		return buf;
	}
}
