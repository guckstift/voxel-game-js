import {Display} from "./display.js";

let display = new Display();
let gl = display.gl;

document.body.appendChild(display.canvas);

let shader = display.createShader(`
	/*
	uniform float aspect;
	uniform float angle;
	uniform vec3 offs;
	*/
	
	uniform mat4 mat;

	attribute vec3 pos;
	attribute vec2 texcoord;
	
	varying vec2 vTexcoord;
	
	void main()
	{
		/*
		gl_Position = vec4(pos + offs, 1.0);
		
		gl_Position.xz = vec2(
			dot(gl_Position.xz, vec2(cos(angle), -sin(angle))),
			dot(gl_Position.xz, vec2(sin(angle), cos(angle)))
		);
		
		gl_Position.x /= aspect;
		*/
		
		gl_Position = mat * vec4(pos, 1.0);
		
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

let tex1 = display.createTexture("gfx/grass.png");
let tex2 = display.createTexture("gfx/stone.png");

let mat = [
	1, 0, 0, 0,
	0, 1, 0, 0,
	0, 0, 1, 0,
	0, 0, 0, 1,
];

display.onRender = () => {
	drawQuad([0, 0, 0], tex1);
	drawQuad([-.5, -.5, .5], tex2);
}

function drawQuad(offs, tex)
{
	mat[0] = 1 / display.aspect;
	mat[12] = offs[0] / display.aspect;
	mat[13] = offs[1];
	mat[14] = offs[2];
	
	shader.use();
	
	/*
	shader.uniform1f("aspect", display.aspect);
	shader.uniform1f("angle", angle);
	shader.uniform3fv("offs", offs);
	*/
	
	shader.uniformMatrix4fv("mat", mat);
	shader.uniformTex("tex", tex, 0);
	
	shader.vertexAttrib("pos",      buf, 3, 4 * 5, 4 * 0);
	shader.vertexAttrib("texcoord", buf, 2, 4 * 5, 4 * 3);
	
	gl.drawArrays(gl.TRIANGLES, 0, 6);
}

window.display = display;
