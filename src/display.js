import {Shader} from "./shader.js";
import {Texture} from "./texture.js";

export class Display
{
	constructor()
	{
		let canvas = document.createElement("canvas");
		let gl = canvas.getContext("webgl", {alpha: false, antialias: false});

		gl.enable(gl.CULL_FACE);
		gl.enable(gl.DEPTH_TEST);
		
		this.canvas = canvas;
		this.gl = gl;
		this.frame = this.frame.bind(this);
		this.defaultTex = gl.createTexture();

		gl.bindTexture(gl.TEXTURE_2D, this.defaultTex);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		
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
	
	createStaticFloatBuffer(data)
	{
		let gl = this.gl;
		let buf = gl.createBuffer();
		
		gl.bindBuffer(gl.ARRAY_BUFFER, buf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
		
		return buf;
	}
	
	createTexture(url)
	{
		return new Texture(this, url);
	}
}
