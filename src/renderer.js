import * as matrix from "./matrix.js";

let vertSrc = `
	uniform mat4 proj;
	uniform mat4 view;
	uniform mat4 model;

	attribute vec4 pos;
	attribute vec2 texcoord;

	varying vec2 vTexcoord;

	void main()
	{
		gl_Position = proj * view * model * pos;

		vTexcoord = texcoord / 16.0;
	}
`;

let fragSrc = `
	precision highp float;

	uniform sampler2D tex;

	varying vec2 vTexcoord;

	void main()
	{
		gl_FragColor = texture2D(tex, vTexcoord);
	}
`;

export class Renderer
{
	constructor(display)
	{
		this.display = display;
		this.shader = display.createShader(vertSrc, fragSrc);
		this.atlas = display.createTexture("gfx/atlas.png");
		this.model = matrix.identity();
	}
	
	begin(camera)
	{
		this.shader.use();
		this.shader.uniformMatrix4fv("proj", camera.getProjection());
		this.shader.uniformMatrix4fv("view", camera.getView());
	}

	drawChunk(chunk)
	{
		this.drawTriangles(
			chunk.buf,  chunk.vertnum,
			chunk.x * 16, chunk.y * 16, chunk.z * 16,
			0,  this.atlas
		);
	}

	drawTriangles(buf, vertnum, x, y, z, a, tex)
	{
		let gl = this.display.gl;
		
		matrix.translation(x, y, z, this.model);
		matrix.rotateX(this.model, a, this.model);
		matrix.rotateY(this.model, a, this.model);
	
		this.shader.uniformMatrix4fv("model", this.model);
		this.shader.uniformTex("tex", tex, 0);
	
		this.shader.vertexAttrib("pos",      buf, 4, true, 6, 0);
		this.shader.vertexAttrib("texcoord", buf, 2, true, 6, 4);
	
		gl.drawArrays(gl.TRIANGLES, 0, vertnum);
	}
}
