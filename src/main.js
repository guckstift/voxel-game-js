let canvas = document.createElement("canvas");

canvas.width = 800;
canvas.height = 600;
document.body.appendChild(canvas);

let gl = canvas.getContext("webgl");

gl.clearColor(0,0,0,0);
gl.clear(gl.COLOR_BUFFER_BIT);

let vert = gl.createShader(gl.VERTEX_SHADER);
let frag = gl.createShader(gl.FRAGMENT_SHADER);
let prog = gl.createProgram();

gl.shaderSource(vert, `
	attribute vec4 pos;
	
	void main()
	{
		gl_Position = vec4(0, 0, 0, 1);
		gl_PointSize = 64.0;
	}
`);

gl.shaderSource(frag, `
	precision highp float;
	
	void main()
	{
		gl_FragColor = vec4(0, 0, 0, 1);
	}
`);

gl.compileShader(vert);
gl.compileShader(frag);
gl.attachShader(prog, vert);
gl.attachShader(prog, frag);

gl.linkProgram(prog);

gl.useProgram(prog);

gl.drawArrays(gl.POINTS, 0, 1);
