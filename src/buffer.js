export default class Buffer
{
	constructor(display, data = null)
	{
		let gl = display.gl;
		let buf = gl.createBuffer();
		
		if(data) {
			gl.bindBuffer(gl.ARRAY_BUFFER, buf);
			gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
		}
		
		this.buf = buf;
		this.gl = gl;
	}
	
	update(data)
	{
		let gl = this.gl;
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
		gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
	}
}
