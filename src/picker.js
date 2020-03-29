import Shader from "./shader.js";
import Buffer from "./buffer.js";
import Matrix from "./matrix.js";
import {radians} from "./math.js";

let vert = `
	uniform mat4 proj;
	uniform mat4 view;
	uniform mat4 model;
	attribute vec3 pos;
	varying mediump vec3 vPos;
	
	void main()
	{
		gl_Position = proj * view * model * vec4(pos, 1);
		vPos = pos;
	}
`;

let frag = `
	varying mediump vec3 vPos;
	
	void main()
	{
		if(vPos.x < 0.0625 || vPos.x > 0.9375 || vPos.y < 0.0625 || vPos.y > 0.9375) {
			gl_FragColor = vec4(1, 1, 1, 0.5);
		}
		else {
			gl_FragColor = vec4(0);
		}
	}
`;

export default class Picker
{
	constructor(display, map)
	{
		this.display = display;
		this.map = map;
		this.shader = new Shader(display, vert, frag);
		this.buffer = new Buffer(display, new Float32Array([0,0,0, 1,0,0, 0,1,0, 0,1,0, 1,0,0, 1,1,0]));
		this.model = new Matrix();
		this.hasHit = false;
		this.hitVox = null;
	}
	
	pick(pos, vec, len)
	{
		let scaledVec = vec.clone();
		
		scaledVec.scale(len);
		
		let hit = this.map.raymarch(pos.data, scaledVec.data);
		
		if(hit) {
			this.hasHit = true;
			this.hitVox = hit.voxpos;
			this.model.set();
			this.model.translate(...hit.voxpos);
			
			if(hit.axis === 0) {
				if(hit.step[0] < 0) {
					this.model.translate(1,0,0);
				}
				
				this.model.rotateY(radians(90));
			}
			else if(hit.axis === 1) {
				if(hit.step[1] < 0) {
					this.model.translate(0,1,0);
				}
				
				this.model.rotateX(radians(90));
			}
			else {
				if(hit.step[2] < 0) {
					this.model.translate(0,0,1);
				}
			}
		}
		else {
			this.hasHit = false;
		}
	}
	
	draw(camera)
	{
		if(this.hasHit) {
			let shader = this.shader;
			let gl = this.display.gl;
			
			shader.assignFloatAttrib("pos", this.buffer, 3, 3, 0);
			shader.use();
			shader.assignMatrix("proj", camera.proj);
			shader.assignMatrix("view", camera.view);
			shader.assignMatrix("model", this.model);
			
			gl.disable(gl.DEPTH_TEST);
			gl.disable(gl.CULL_FACE);
			
			this.display.drawTriangles(6);
			
			gl.enable(gl.DEPTH_TEST);
			gl.enable(gl.CULL_FACE);
		}
	}
}
