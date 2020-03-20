import Display from "./display.js";
import Shader from "./shader.js";
import Buffer from "./buffer.js";

let display = new Display(800, 600);

display.appendToBody();

let shader = new Shader(display, `
	void main()
	{
	}
`,`
	void main()
	{
	}
`);

let buf = new Buffer(display, new Float32Array([
	0,0,0, 1,0,0,
	1,0,0, 0,1,0,
	0,1,0, 0,0,1,
]));
