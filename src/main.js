import Display from "./display.js";
import Shader from "./shader.js";
import Buffer from "./buffer.js";
import Camera from "./camera.js";
import Controller from "./controller.js";

let display = new Display();

display.appendToBody();

let shader = new Shader(display, `
	uniform mat4 proj;
	uniform mat4 view;
	attribute vec3 pos;
	attribute vec3 col;
	varying mediump vec3 vCol;
	
	void main()
	{
		gl_Position = proj * view * vec4(pos, 1);
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

let camera = new Camera(90, 800/600, 0.1, 1000, 1,-1,1, 90,0);
let controller = new Controller(camera);

display.onframe = () =>
{
	controller.update(1/60);
	
	camera.aspect = display.getAspect();
	camera.update();

	shader.assignFloatAttrib("pos", buf, 3, 6, 0);
	shader.assignFloatAttrib("col", buf, 3, 6, 3);
	shader.use();
	shader.assignMatrix("proj", camera.proj);
	shader.assignMatrix("view", camera.view);
	display.drawTriangles(3);
};
