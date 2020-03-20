import Display from "./display.js";
import Shader from "./shader.js";
import Buffer from "./buffer.js";
import Camera from "./camera.js";

let display = new Display(800, 600);

display.appendToBody();

let shader = new Shader(display, `
	attribute vec3 pos;
	attribute vec3 col;
	varying mediump vec3 vCol;
	
	void main()
	{
		gl_Position = vec4(pos, 1);
		vCol = col;
	}
`,`
	varying mediump vec3 vCol;
	
	void main()
	{
		gl_FragColor = vec4(vCol, 1);
	}
`);

let buf = new Buffer(display, new Float32Array([
	0,0,0, 1,0,0,
	1,0,0, 0,1,0,
	0,1,0, 0,0,1,
]));

let camera = new Camera();

shader.assignFloatAttrib("pos", buf, 3, 6, 0);
shader.assignFloatAttrib("col", buf, 3, 6, 3);
shader.use();
display.drawTriangles(3);
