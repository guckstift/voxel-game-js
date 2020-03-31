export default class Shader
{
	constructor(display, vertSrc, fragSrc)
	{
		let gl = display.gl;
		let vert = gl.createShader(gl.VERTEX_SHADER);

		gl.shaderSource(vert, vertSrc);
		gl.compileShader(vert);

		console.log("compile vertex shader:", gl.getShaderInfoLog(vert));

		let frag = gl.createShader(gl.FRAGMENT_SHADER);

		gl.shaderSource(frag, fragSrc);
		gl.compileShader(frag);

		console.log("compile fragment shader:", gl.getShaderInfoLog(frag));

		let prog = gl.createProgram();

		gl.attachShader(prog, vert);
		gl.attachShader(prog, frag);
		gl.linkProgram(prog);

		console.log("link shader program:", gl.getProgramInfoLog(prog));
		
		this.gl = gl;
		this.prog = prog;
	}
	
	assignFloatAttrib(name, buf, size, stride, offset)
	{
		let gl = this.gl;
		let loca = gl.getAttribLocation(this.prog, name);

		gl.bindBuffer(gl.ARRAY_BUFFER, buf.buf);
		gl.enableVertexAttribArray(loca);
		gl.vertexAttribPointer(loca, size, gl.FLOAT, false, stride * 4, offset * 4);
	}
	
	assignVector(name, vec)
	{
		let gl = this.gl;
		let loca = gl.getUniformLocation(this.prog, name);
		
		gl.uniform3fv(loca, vec.data);
	}
	
	assignMatrix(name, mat)
	{
		let gl = this.gl;
		let loca = gl.getUniformLocation(this.prog, name);
		
		gl.uniformMatrix4fv(loca, false, mat.data);
	}
	
	assignMatrices(name, mats)
	{
		let gl = this.gl;
		
		mats.forEach((mat, i) => {
			let loca = gl.getUniformLocation(this.prog, name + "[" + i + "]");
			
			gl.uniformMatrix4fv(loca, false, mat.data);
		});
	}
	
	assignTexture(name, tex, unit)
	{
		let gl = this.gl;
		let loca = gl.getUniformLocation(this.prog, name);
		
		gl.activeTexture(gl.TEXTURE0 + unit);
		gl.bindTexture(gl.TEXTURE_2D, tex.tex);
		gl.uniform1i(loca, unit);
	}
	
	use()
	{
		this.gl.useProgram(this.prog);
	}
}
