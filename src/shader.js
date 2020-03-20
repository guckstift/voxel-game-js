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
	}
}
