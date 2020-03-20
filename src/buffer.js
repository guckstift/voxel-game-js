export default class Buffer
{
	constructor(display, data)
	{
		let gl = display.gl;
		let buf = gl.createBuffer();
		
		gl.bindBuffer(gl.ARRAY_BUFFER, buf);
		gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
	}
}
