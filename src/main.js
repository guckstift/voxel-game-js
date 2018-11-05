let canvas = document.createElement("canvas");

canvas.width = 800;
canvas.height = 600;
document.body.appendChild(canvas);

let gl = canvas.getContext("webgl", {alpha: false, antialias: false});

gl.clearColor(0,0,0,0);
gl.clear(gl.COLOR_BUFFER_BIT);

let vert = gl.createShader(gl.VERTEX_SHADER);
let frag = gl.createShader(gl.FRAGMENT_SHADER);
let prog = gl.createProgram();

gl.shaderSource(vert, `
	attribute vec4 pos;
	
	varying vec4 color;
	
	void main()
	{
		gl_Position = pos;
		color = pos;
	}
`);

gl.shaderSource(frag, `
	precision highp float;
	
	varying vec4 color;
	
	void main()
	{
		gl_FragColor = color;
	}
`);

gl.compileShader(vert);
gl.compileShader(frag);
gl.attachShader(prog, vert);
gl.attachShader(prog, frag);

gl.linkProgram(prog);

gl.useProgram(prog);

let buf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buf);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
	0, 0, 0, 1,
	1, 0, 0, 1,
	0, 1, 0, 1,
	0, 1, 0, 1,
	1, 0, 0, 1,
	1, 1, 0, 1,
]), gl.STATIC_DRAW);

gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);

gl.drawArrays(gl.TRIANGLES, 0, 6);
