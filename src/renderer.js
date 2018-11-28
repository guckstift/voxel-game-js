import {VERT_SIZE, CHUNK_WIDTH} from "./chunk.js";
import {radians} from "./math.js";
import * as matrix from "./matrix.js";
import * as vector3 from "./vector3.js";

let vertSrc = `
	uniform mat4 proj;
	uniform mat4 view;
	uniform mat4 model;
	uniform vec3 sun;

	attribute vec3 pos;
	attribute vec2 texcoord;
	attribute float faceid;

	varying vec2 vTexcoord;
	varying float vCoef;

	void main()
	{
		gl_Position = proj * view * model * vec4(pos, 1.0);

		vTexcoord = texcoord / 16.0;
		
		vec3 normal =
			faceid == 0.0 ? vec3(0, 0, -1) :
			faceid == 1.0 ? vec3(+1, 0, 0) :
			faceid == 2.0 ? vec3(0, 0, +1) :
			faceid == 3.0 ? vec3(-1, 0, 0) :
			faceid == 4.0 ? vec3(0, +1, 0) :
			faceid == 5.0 ? vec3(0, -1, 0) :
			vec3(0,0,0);
		
		vCoef = 0.5 + max(0.0, dot(normal, -sun)) * 0.5;
	}
`;

let fragSrc = `
	precision highp float;

	uniform sampler2D tex;

	varying vec2 vTexcoord;
	varying float vCoef;

	void main()
	{
		gl_FragColor = texture2D(tex, vTexcoord);
		gl_FragColor.rgb *= vCoef;
	}
`;

let sun = vector3.create(0, -1, 0);
vector3.rotateX(sun, radians(-30), sun);
vector3.rotateY(sun, radians(-30), sun);

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
		this.shader.uniform3fv("sun", sun.subarray(0, 3));
	}
	
	drawWorld(world)
	{
		for(let z in world.chunks) {
			let slice = world.chunks[z];
			
			for(let y in slice) {
				let column = slice[y];
				
				for(let x in column) {
					let chunk = column[x];
					
					this.drawChunk(chunk);
				}
			}
		}
	}

	drawChunk(chunk)
	{
		if(chunk.vertnum > 0) {
			this.drawTriangles(
				chunk.buf,  chunk.vertnum,
				chunk.x * CHUNK_WIDTH, chunk.y * CHUNK_WIDTH, chunk.z * CHUNK_WIDTH,
				0,  this.atlas
			);
		}
	}

	drawTriangles(buf, vertnum, x, y, z, a, tex)
	{
		let gl = this.display.gl;
		
		matrix.translation(x, y, z, this.model);
		matrix.rotateX(this.model, a, this.model);
		matrix.rotateY(this.model, a, this.model);
	
		this.shader.uniformMatrix4fv("model", this.model);
		this.shader.uniformTex("tex", tex, 0);
	
		this.shader.vertexAttrib("pos",      buf, 3, true, VERT_SIZE, 0);
		this.shader.vertexAttrib("texcoord", buf, 2, true, VERT_SIZE, 3);
		this.shader.vertexAttrib("faceid",   buf, 1, true, VERT_SIZE, 5);
	
		gl.drawArrays(gl.TRIANGLES, 0, vertnum);
	}
}
