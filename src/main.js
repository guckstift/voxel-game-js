import {Display} from "./display.js";
import {Camera} from "./camera.js";
import * as matrix from "./matrix.js";
import * as vector from "./vector.js";

let display = new Display();
let camera = new Camera(display);
let gl = display.gl;

document.body.appendChild(display.canvas);

let shader = display.createShader(`
	uniform mat4 proj;
	uniform mat4 view;
	uniform mat4 model;

	attribute vec4 pos;
	attribute vec2 texcoord;
	
	varying vec2 vTexcoord;
	
	void main()
	{
		gl_Position = proj * view * model * pos;
		
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

let front = new Float32Array([
	0, 0, 0, 1,  0, 1,
	1, 0, 0, 1,  1, 1,
	0, 1, 0, 1,  0, 0,
	0, 1, 0, 1,  0, 0,
	1, 0, 0, 1,  1, 1,
	1, 1, 0, 1,  1, 0,
]);

let blocks = [
	null, // air
	createCube([2, 2, 2, 2, 0, 1]), // grass
	createCube([3, 3, 3, 3, 3, 3]), // stone
];

let chunk = new Uint8Array(16 ** 3);

for(let i=0; i<16**3; i++) {
	chunk[i] = Math.floor(Math.random() * 3);
}

let mesh = new Float32Array(16 ** 3 * 6 * 2 * 3 * 6);

for(let z=0; z<16; z++) {
	for(let y=0; y<16; y++) {
		for(let x=0; x<16; x++) {
			let i = x + y * 16 + z * 16 * 16;
			let t = chunk[i];
			let block = blocks[t];
			
			if(block) {
				let target = mesh.subarray(i * 6 * 2 * 3 * 6);
				
				target.set(block);
				
				for(let k=0; k < 6 * 2 * 3; k++) {
					let vertex = target.subarray(k * 6);
					
					vertex[0] += x;
					vertex[1] += y;
					vertex[2] += z;
				}
			}
		}
	}
}

let meshbuf = display.createStaticFloatBuffer(mesh);

let angle = 0.0;

let atlas = display.createTexture("gfx/atlas.png");
let tex1 = display.createTexture("gfx/grass.png");
let tex2 = display.createTexture("gfx/stone.png");

let model = matrix.identity();
let speed = 0.1;
let keymap = {};
let panning = false;

display.onRender = () => {
	if(keymap.a) {
		camera.moveLeft(speed);
	}
	if(keymap.d) {
		camera.moveRight(speed);
	}
	if(keymap.s) {
		camera.moveBackward(speed);
	}
	if(keymap.w) {
		camera.moveForward(speed);
	}
	if(keymap.Shift) {
		camera.moveUp(speed);
	}
	if(keymap[" "]) {
		camera.moveDown(speed);
	}
	
	shader.use();
	
	shader.uniformMatrix4fv("proj", camera.getProjection());
	shader.uniformMatrix4fv("view", camera.getView());
	
	drawTriangles(meshbuf,  16 ** 3 * 6 * 2 * 3,  0,0,3,  0,  atlas);
}

document.onkeydown = e => {
	keymap[e.key] = true;
};

document.onkeyup = e => {
	keymap[e.key] = false;
};

display.canvas.onmousedown = e => {
	display.canvas.requestPointerLock();
	panning = true;
};

display.canvas.onmouseup = e => {
	document.exitPointerLock();
	panning = false;
};

display.canvas.onmousemove = e => {
	if(panning) {
		camera.turnHori(e.movementX / 100);
		camera.turnVert(-e.movementY / 100);
	}
};

function drawTriangles(buf, vertnum, x, y, z, a, tex)
{
	matrix.translation(x, y, z, model);
	matrix.rotateX(model, a, model);
	matrix.rotateY(model, a, model);
	
	shader.uniformMatrix4fv("model", model);
	shader.uniformTex("tex", tex, 0);
	
	shader.vertexAttrib("pos",      buf, 4, 6, 0);
	shader.vertexAttrib("texcoord", buf, 2, 6, 4);
	
	gl.drawArrays(gl.TRIANGLES, 0, vertnum);
}

function createCube(slots, out = new Float32Array(6 * 6 * 6))
{
	let r = Math.PI / 2;
	let s = Math.PI;
	
	createQuad(0, 0, 0,  0, 0, 0,  slots[0], out.subarray(6 * 6 * 0)); // front
	createQuad(1, 0, 0,  0, r, 0,  slots[1], out.subarray(6 * 6 * 1)); // right
	createQuad(1, 0, 1,  0, s, 0,  slots[2], out.subarray(6 * 6 * 2)); // back
	createQuad(0, 0, 1,  0,-r, 0,  slots[3], out.subarray(6 * 6 * 3)); // left
	createQuad(0, 1, 0,  r, 0, 0,  slots[4], out.subarray(6 * 6 * 4)); // top
	createQuad(0, 0, 1, -r, 0, 0,  slots[5], out.subarray(6 * 6 * 5)); // bottom
	
	return out;
}

function createQuad(x, y, z, ax, ay, az, slot, out = new Float32Array(6 * 6))
{
	let m = matrix.identity();
	let sx = slot % 16;
	let sy = Math.floor(slot / 16);
	
	matrix.translate(m, x, y, z, m);
	matrix.rotateX(m, ax, m);
	matrix.rotateY(m, ay, m);
	matrix.rotateZ(m, az, m);
	
	for(let i=0; i<6; i++) {
		let o = i * 6;
		let v = out.subarray(o);
		let t = v.subarray(4);
		
		v.set(front.subarray(o, o + 6));
		vector.transform(v, m, v);
		vector.round(v, v);
		t[0] = (sx + t[0]) / 16;
		t[1] = (sy + t[1]) / 16;
	}
	
	return out;
}

window.display = display;
window.camera = camera;
