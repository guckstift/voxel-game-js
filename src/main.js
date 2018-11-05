import {Display} from "./display.js";

let display = new Display();
let gl = display.gl;

document.body.appendChild(display.canvas);

let shader = display.createShader(`
	uniform float aspect;
	uniform float angle;

	attribute vec4 pos;
	
	varying vec2 texcoord;
	
	void main()
	{
		gl_Position = pos;
		
		gl_Position.xy = vec2(
			dot(gl_Position.xy, vec2(cos(angle), -sin(angle))),
			dot(gl_Position.xy, vec2(sin(angle), cos(angle)))
		);
		
		gl_Position.x /= aspect;
		
		texcoord = vec2(pos.x, 1.0 - pos.y);
	}
`,`
	precision highp float;
	
	uniform sampler2D tex;
	
	varying vec2 texcoord;
	
	void main()
	{
		gl_FragColor = texture2D(tex, texcoord);
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

let angle = 0.0;

let tex = display.createTexture("gfx/grass.png");

display.onRender = () => {
	shader.use();
	shader.uniform1f("aspect", display.aspect);
	shader.uniform1f("angle", angle);
	shader.uniformTex("tex", tex, 0);

	gl.enableVertexAttribArray(0);
	gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);

	gl.drawArrays(gl.TRIANGLES, 0, 6);
	
	angle += 0.01;
}

window.display = display;
