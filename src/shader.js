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
	
	assignMatrix(name, mat)
	{
		let gl = this.gl;
		let loca = gl.getUniformLocation(this.prog, name);
		
		gl.uniformMatrix4fv(loca, false, mat.data);
	}
	
	use()
	{
		this.gl.useProgram(this.prog);
	}
}
