export class Shader
{
	constructor(display, vertSrc, fragSrc)
	{
		let gl = display.gl;
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
		
		this.gl = gl;
		this.prog = prog;
		this.vars = {};
	}
	
	use()
	{
		this.gl.useProgram(this.prog);
	}
	
	getAttrib(name)
	{
		if(!this.vars[name]) {
			this.vars[name] = this.gl.getAttribLocation(this.prog, name);
		}
		
		return this.vars[name];
	}
	
	getUniform(name)
	{
		if(!this.vars[name]) {
			this.vars[name] = this.gl.getUniformLocation(this.prog, name);
		}
		
		return this.vars[name];
	}
	
	vertexAttrib(name, buffer, size, isbyte = false, stride = 0, offset = 0)
	{
		let gl = this.gl;
		let gltype = isbyte ? gl.UNSIGNED_BYTE : gl.FLOAT;
		let datasize = isbyte ? 1 : 4;
		
		gl.enableVertexAttribArray(this.vars[name]);
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		
		gl.vertexAttribPointer(
			this.getAttrib(name), size, gltype, false, datasize * stride, datasize * offset
		);
	}
	
	uniform1f(name, value)
	{
		this.gl.uniform1f(this.getUniform(name), value);
	}
	
	uniform1i(name, value)
	{
		this.gl.uniform1i(this.getUniform(name), value);
	}
	
	uniform3fv(name, value)
	{
		this.gl.uniform3fv(this.getUniform(name), value);
	}
	
	uniformMatrix4fv(name, value)
	{
		this.gl.uniformMatrix4fv(this.getUniform(name), false, value);
	}
	
	uniformTex(name, tex, unit)
	{
		let gl = this.gl;
	
		gl.activeTexture(gl.TEXTURE0 + unit);
		gl.bindTexture(gl.TEXTURE_2D, tex.tex);
		gl.uniform1i(this.getUniform(name), unit);
	}
}
