import {Display} from "./display.js";

let display = new Display();
let gl = display.gl;

document.body.appendChild(display.canvas);

let shader = display.createShader(`
	attribute vec4 pos;
	
	varying vec4 color;
	
	void main()
	{
		gl_Position = pos;
		color = pos;
	}
`,`
	precision highp float;
	
	varying vec4 color;
	
	void main()
	{
		gl_FragColor = color;
	}
`);

let buf = display.createStaticBuffer(new Float32Array([
	0, 0, 0, 1,
	1, 0, 0, 1,
	0, 1, 0, 1,
	0, 1, 0, 1,
	1, 0, 0, 1,
	1, 1, 0, 1,
]));

gl.useProgram(shader);

gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);

gl.drawArrays(gl.TRIANGLES, 0, 6);
