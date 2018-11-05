import {Display} from "./display.js";

let display = new Display();
let gl = display.gl;

document.body.appendChild(display.canvas);

let shader = display.createShader(`
	uniform float aspect;
	uniform float angle;
	uniform vec3 offs;

	attribute vec3 pos;
	attribute vec2 texcoord;
	
	varying vec2 vTexcoord;
	
	void main()
	{
		gl_Position = vec4(pos + offs, 1.0);
		
		gl_Position.xz = vec2(
			dot(gl_Position.xz, vec2(cos(angle), -sin(angle))),
			dot(gl_Position.xz, vec2(sin(angle), cos(angle)))
		);
		
		gl_Position.x /= aspect;
		
		vTexcoord = texcoord;
	}
`,`
	precision highp float;
	
	uniform sampler2D tex;
	
	varying vec2 vTexcoord;
	
	void main()
	{
		gl_FragColor = texture2D(tex, vTexcoord);
	}
`);

let buf = display.createStaticBuffer(new Float32Array([
	0, 0, 0,  0, 1,
	1, 0, 0,  1, 1,
	0, 1, 0,  0, 0,
	0, 1, 0,  0, 0,
	1, 0, 0,  1, 1,
	1, 1, 0,  1, 0,
]));

let angle = 0.0;

let tex = display.createTexture("gfx/grass.png");

display.onRender = () => {
	drawQuad([0, 0, 0]);
	drawQuad([-.5, -.5, .5]);
}

function drawQuad(offs)
{
	shader.use();
	
	shader.uniform1f("aspect", display.aspect);
	shader.uniform1f("angle", angle);
	shader.uniform3fv("offs", offs);
	shader.uniformTex("tex", tex, 0);
	
	shader.vertexAttrib("pos",      buf, 3, 4 * 5, 4 * 0);
	shader.vertexAttrib("texcoord", buf, 2, 4 * 5, 4 * 3);
	
	gl.drawArrays(gl.TRIANGLES, 0, 6);
}

window.display = display;
