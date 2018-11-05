export class Display
{
	constructor()
	{
		let canvas = document.createElement("canvas");
		let gl = canvas.getContext("webgl", {alpha: false, antialias: false});

		gl.clearColor(0,0,0,0);
		
		this.canvas = canvas;
		this.gl = gl;
		
		this.resize(800, 600);
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
		let gl = this.gl;
		let vert = gl.createShader(gl.VERTEX_SHADER);
		let frag = gl.createShader(gl.FRAGMENT_SHADER);
		let prog = gl.createProgram();

		gl.shaderSource(vert, vertSrc);
		gl.shaderSource(frag, fragSrc);

		gl.compileShader(vert);
		gl.compileShader(frag);
		gl.attachShader(prog, vert);
		gl.attachShader(prog, frag);

		gl.linkProgram(prog);
		
		if(gl.getShaderParameter(vert, gl.COMPILE_STATUS) === false) {
			throw "error compile vertex shader: " + gl.getShaderInfoLog(vert);
		}
		
		if(gl.getShaderParameter(frag, gl.COMPILE_STATUS) === false) {
			throw "error compile fragment shader: " + gl.getShaderInfoLog(frag);
		}
		
		if(gl.getProgramParameter(prog, gl.LINK_STATUS) === false) {
			throw "error link program: " + gl.getProgramInfoLog(prog);
		}
		
		return prog;
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
