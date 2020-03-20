import Display from "./display.js";
import Shader from "./shader.js";
import Buffer from "./buffer.js";
import Camera from "./camera.js";
import Controller from "./controller.js";
import Texture from "./texture.js";

let display = new Display();

display.appendToBody();

let shader = new Shader(display, `
	uniform mat4 proj;
	uniform mat4 view;
	attribute vec3 pos;
	attribute vec2 uv;
	varying mediump vec2 vUv;
	
	void main()
	{
		gl_Position = proj * view * vec4(pos, 1);
		vUv = uv;
	}
`,`
	uniform sampler2D tex;
	varying mediump vec2 vUv;
	
	void main()
	{
		gl_FragColor = texture2D(tex, vUv);
	}
`);

let buf = new Buffer(display, new Float32Array([
	0,0,0, 0/16,1/16,
	1,0,0, 1/16,1/16,
	0,1,0, 0/16,0/16,
	0,1,0, 0/16,0/16,
	1,0,0, 1/16,1/16,
	1,1,0, 1/16,0/16,
]));

let camera = new Camera(90, 800/600, 0.1, 1000, 1,-1,1, 90,0);
let controller = new Controller(camera, display);
let texture = new Texture(display, "gfx/blocks.png");

display.onframe = () =>
{
	controller.update(1/60);
	
	camera.aspect = display.getAspect();
	camera.update();
	
	shader.assignFloatAttrib("pos", buf, 3, 5, 0);
	shader.assignFloatAttrib("uv",  buf, 2, 5, 3);
	shader.use();
	shader.assignMatrix("proj", camera.proj);
	shader.assignMatrix("view", camera.view);
	shader.assignTexture("tex", texture, 0);
	display.drawTriangles(6);
};
