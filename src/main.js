import {Display} from "./display.js";
import {Gui} from "./gui.js";
import {Camera} from "./camera.js";
import {World} from "./world.js";
import {CHUNK_WIDTH} from "./chunk.js";
import {Input} from "./input.js";
import {Body} from "./body.js";
import {blocks} from "./blocks.js";
import {radians} from "./math.js";
import * as matrix from "./matrix.js";
import * as vector from "./vector.js";

function testWebSocket()
{
	let socket = new WebSocket("ws://localhost:1234", "blockweb");

	socket.binaryType = "arraybuffer";

	socket.onopen = e => {
		console.log("open");
		socket.send(new Int32Array([1, 0,-1,0]));
	};

	socket.onmessage = e => {
		console.log(e);
	};
}

const runspeed  = 4;
const jumpspeed = 7.5;
const gravity   = 20;

let display = new Display();
let gui = new Gui(display);
let camera = new Camera(display);
let world = new World(display, camera);
let body = new Body(world, [-0.25, 0, -0.25], [0.25, 1.75, 0.25]);
let input = new Input(gui.container);
let blockHit = null;
let gl = display.gl;
let selected = 1;

let axis = display.createStaticByteBuffer([
	0,0,0, 1,0,0,
	1,0,0, 1,0,0,
	0,0,0, 0,1,0,
	0,1,0, 0,1,0,
	0,0,0, 0,0,1,
	0,0,1, 0,0,1,
]);

let axisShader = display.createShader(`
	uniform mat4 proj;
	uniform mat4 view;
	attribute vec3 pos;
	attribute vec3 col;
	varying vec3 vCol;
	void main()
	{
		gl_Position = proj * view * vec4(pos, 1.0);
		vCol = col;
	}
`,`
	precision highp float;
	varying vec3 vCol;
	void main()
	{
		gl_FragColor = vec4(vCol, 1.0);
	}
`);

let p = -1 / 1024;

let selector = display.createStaticFloatBuffer([
	0,0,p, 1,0,p, 0,1,p,
	0,1,p, 1,0,p, 1,1,p,
]);

let selectorShader = display.createShader(`
	uniform mat4 proj;
	uniform mat4 viewmodel;
	attribute vec3 pos;
	varying vec2 vPos;
	void main()
	{
		gl_Position = proj * viewmodel * vec4(pos, 1.0);
		vPos = pos.xy;
	}
`,`
	precision highp float;
	varying vec2 vPos;
	void main()
	{
		gl_FragColor = vec4(1.0, 1.0, 1.0, 0.0);

		float gap = 1.0/32.0;

		if(vPos.x < gap || vPos.x > 1.0 - gap || vPos.y < gap || vPos.y > 1.0 - gap) {
			gl_FragColor.a = 0.5;
		}
		else {
			discard;
		}
	}
`);

let cuboid = display.createStaticFloatBuffer([
	...createCuboid(
		-4/16,+0/16,-2/16,  +0/16,+12/16,+2/16,
		 0/64,20/64, 4/64, 12/64,
		 4/64,20/64, 4/64, 12/64,
		 8/64,20/64, 4/64, 12/64,
		12/64,20/64, 4/64, 12/64,
		56/64, 8/64, 4/64,  4/64,
		56/64,12/64, 4/64,  4/64,
		3,
	), // left leg

	...createCuboid(
		+0/16,+0/16,-2/16,  +4/16,+12/16,+2/16,
		16/64,20/64, 4/64, 12/64,
		20/64,20/64, 4/64, 12/64,
		24/64,20/64, 4/64, 12/64,
		28/64,20/64, 4/64, 12/64,
		60/64, 8/64, 4/64,  4/64,
		60/64,12/64, 4/64,  4/64,
		4,
	), // right leg

	...createCuboid(
		-4/16,+12/16,-2/16, +4/16,+24/16,+2/16,
		 0/64, 8/64, 8/64, 12/64,
		 8/64, 8/64, 4/64, 12/64,
		12/64, 8/64, 8/64, 12/64,
		20/64, 8/64, 4/64, 12/64,
		48/64, 0/64, 8/64,  4/64,
		48/64, 4/64, 8/64,  4/64,
		0,
	), // upper body

	...createCuboid(
		-4/16,+24/16,-4/16, +4/16,+32/16,+4/16,
		0/64, 0/64, 8/64, 8/64,
		8/64, 0/64, 8/64, 8/64,
		16/64, 0/64, 8/64, 8/64,
		24/64, 0/64, 8/64, 8/64,
		32/64, 0/64, 8/64, 8/64,
		40/64, 0/64, 8/64, 8/64,
		5,
	), // head

	...createCuboid(
		-8/16,+12/16,-2/16, -4/16,+24/16,+2/16,
		24/64, 8/64, 4/64, 12/64,
		28/64, 8/64, 4/64, 12/64,
		32/64, 8/64, 4/64, 12/64,
		36/64, 8/64, 4/64, 12/64,
		56/64, 0/64, 4/64,  4/64,
		56/64, 4/64, 4/64,  4/64,
		1,
	), // left arm

	...createCuboid(
		+4/16,+12/16,-2/16, +8/16,+24/16,+2/16,
		40/64, 8/64, 4/64, 12/64,
		44/64, 8/64, 4/64, 12/64,
		48/64, 8/64, 4/64, 12/64,
		52/64, 8/64, 4/64, 12/64,
		60/64, 0/64, 4/64,  4/64,
		60/64, 4/64, 4/64,  4/64,
		2,
	), // right arm
]);

function createCuboid(
	x0, y0, z0, x1, y1, z1,
	u0, v0, w0, h0,
	u1, v1, w1, h1,
	u2, v2, w2, h2,
	u3, v3, w3, h3,
	u4, v4, w4, h4,
	u5, v5, w5, h5,
	bone,
) {
	return [
		x0,y0,z0, u0   ,v0+h0, bone,  x1,y0,z0, u0+w0,v0+h0, bone,  x0,y1,z0, u0   ,v0, bone,
		x0,y1,z0, u0   ,v0,    bone,  x1,y0,z0, u0+w0,v0+h0, bone,  x1,y1,z0, u0+w0,v0, bone,

		x1,y0,z0, u1   ,v1+h1, bone,  x1,y0,z1, u1+w1,v1+h1, bone,  x1,y1,z0, u1   ,v1, bone,
		x1,y1,z0, u1   ,v1,    bone,  x1,y0,z1, u1+w1,v1+h1, bone,  x1,y1,z1, u1+w1,v1, bone,

		x1,y0,z1, u2   ,v2+h2, bone,  x0,y0,z1, u2+w2,v2+h2, bone,  x1,y1,z1, u2   ,v2, bone,
		x1,y1,z1, u2   ,v2,    bone,  x0,y0,z1, u2+w2,v2+h2, bone,  x0,y1,z1, u2+w2,v2, bone,

		x0,y0,z1, u3   ,v3+h3, bone,  x0,y0,z0, u3+w3,v3+h3, bone,  x0,y1,z1, u3   ,v3, bone,
		x0,y1,z1, u3   ,v3,    bone,  x0,y0,z0, u3+w3,v3+h3, bone,  x0,y1,z0, u3+w3,v3, bone,

		x0,y1,z0, u4   ,v4+h4, bone,  x1,y1,z0, u4+w4,v4+h4, bone,  x0,y1,z1, u4   ,v4, bone,
		x0,y1,z1, u4   ,v4,    bone,  x1,y1,z0, u4+w4,v4+h4, bone,  x1,y1,z1, u4+w4,v4, bone,

		x0,y0,z1, u5   ,v5+h5, bone,  x1,y0,z1, u5+w5,v5+h5, bone,  x0,y0,z0, u5   ,v5, bone,
		x0,y0,z0, u5   ,v5,    bone,  x1,y0,z1, u5+w5,v5+h5, bone,  x1,y0,z0, u5+w5,v5, bone,
	];
}

let cubeShader = display.createShader(`
	uniform mat4 proj;
	uniform mat4 viewmodel;
	uniform mat4 bones[8];
	uniform vec3 roots[8];
	attribute vec3 pos;
	attribute vec2 texpos;
	attribute float bone;
	varying vec3 vCol;
	varying vec2 vTexpos;
	void main()
	{
		gl_Position = vec4(pos, 1.0);

		for(float i=0.0; i<8.0; i++) {
			if(i == bone - 1.0) {
				gl_Position.xyz -= roots[int(i)];
				gl_Position = bones[int(i)] * gl_Position;
				gl_Position.xyz += roots[int(i)];
			}
		}

		gl_Position = proj * viewmodel * gl_Position;
		vCol = pos;
		vTexpos = texpos;
	}
`,`
	precision highp float;
	uniform sampler2D tex;
	varying vec3 vCol;
	varying vec2 vTexpos;
	void main()
	{
		gl_FragColor = texture2D(tex, vTexpos);
	}
`);

let playertex = display.getTexture("gfx/player.png");

let fr = 0;

document.body.appendChild(gui.container);

world.touchChunk( 0, 0, 0);

body.pos.set([-0.5, 8, -2.5]);
body.acc[1] = -gravity;

gui.blockSelector.setFrame(blocks[selected].faces[0], 0);

display.onRender = () =>
{
	if(input.keymap.space && body.rest[1] === -1) {
		body.accelerate([0, jumpspeed, 0], 1);
	}
	if(input.keymap.w) {
		let vec = camera.getForward(runspeed);
		body.move(vec, 1 / 60);
	}
	if(input.keymap.a) {
		let vec = camera.getLeftward(runspeed);
		body.move(vec, 1 / 60);
	}
	if(input.keymap.s) {
		let vec = camera.getForward(-runspeed);
		body.move(vec, 1 / 60);
	}
	if(input.keymap.d) {
		let vec = camera.getLeftward(-runspeed);
		body.move(vec, 1 / 60);
	}

	body.update(1 / 60);
	camera.setPos(body.pos);
	camera.pos[1] += 1.5;
	//vector.add(camera.pos, camera.getDirVec(-2), camera.pos);

	blockHit = world.hitBlock(camera.getDirVec(), camera.pos);

	for(let x=-1; x<=+1; x++) {
		for(let y=-1; y<=+1; y++) {
			for(let z=-1; z<=+1; z++) {
				world.touchChunkAt(
					body.pos[0] + CHUNK_WIDTH * x,
					body.pos[1] + CHUNK_WIDTH * y,
					body.pos[2] + CHUNK_WIDTH * z,
				);
			}
		}
	}

	world.draw();

	if(blockHit) {
		let r = radians(90);
		let s = radians(180);
		let [x, y, z,  ax,ay,az] = [
			[0, 0, 0,  0, 0, 0],
			[1, 0, 0,  0, r, 0],
			[1, 0, 1,  0, s, 0],
			[0, 0, 1,  0,-r, 0],
			[0, 1, 0,  r, 0, 0],
			[0, 0, 1, -r, 0, 0],
		][blockHit.faceid];

		selectorShader.use();
		selectorShader.uniformMatrix4fv("proj", camera.getProjection());

		selectorShader.uniformMatrix4fv("viewmodel", camera.getViewModel(
			x + blockHit.blockpos[0],
			y + blockHit.blockpos[1],
			z + blockHit.blockpos[2],
			ax, ay, az,
		));

		selectorShader.vertexAttrib("pos", selector, 3);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	cubeShader.use();
	cubeShader.uniformTex("tex", playertex, 0);
	cubeShader.uniformMatrix4fv("proj", camera.getProjection());

	cubeShader.uniformMatrix4fv("bones", [
		...matrix.rotationX(radians(+ 30)),
		...matrix.rotationX(radians(- 30)),
		...matrix.rotationX(radians(+ 40)),
		...matrix.rotationX(radians(- 40)),
		...matrix.rotationX(radians(20)),
	]);
	cubeShader.uniform3fv("roots", [
		-0.375,1.375,0,
		+0.375,1.375,0,
		-0.125,0.75,0,
		+0.125,0.75,0,
		+0.0, 1.5,+0.0,
	]);

	fr += 1;

	cubeShader.vertexAttrib("pos", cuboid, 3, false, 6, 0);
	cubeShader.vertexAttrib("texpos", cuboid, 2, false, 6, 3);
	cubeShader.vertexAttrib("bone", cuboid, 1, false, 6, 5);

	cubeShader.uniformMatrix4fv(
		"viewmodel",
		camera.getViewModel(...body.pos, 0, Math.PI-camera.hangle,0)
	);

	//gl.drawArrays(gl.TRIANGLES, 0, 36 * 6);

	gl.disable(gl.DEPTH_TEST);
	gl.lineWidth(2);
	axisShader.use();
	axisShader.uniformMatrix4fv("proj", camera.getProjection());
	axisShader.uniformMatrix4fv("view", camera.getView());
	axisShader.vertexAttrib("pos",  axis, 3, true, 6, 0);
	axisShader.vertexAttrib("col",  axis, 3, true, 6, 3);
	gl.drawArrays(gl.LINES, 0, 6);
	gl.enable(gl.DEPTH_TEST);
};

input.onMove = e =>
{
	camera.turnHori(e.movementX / 100);
	camera.turnVert(-e.movementY / 100);
	window.blockHit = blockHit;
};

input.onClick = e =>
{
	if(blockHit) {
		if(e.button === 0) {
			world.setBlock(...blockHit.blockpos, 0);
		}
		else if(e.button === 2) {
			world.setBlock(
				blockHit.blockpos[0] + blockHit.normal[0],
				blockHit.blockpos[1] + blockHit.normal[1],
				blockHit.blockpos[2] + blockHit.normal[2],
				selected,
			);
		}
	}
};

input.onWheelUp = e => {
	selected = (selected - 1 + blocks.length) % blocks.length || blocks.length - 1;
	gui.blockSelector.setFrame(blocks[selected].faces[0], 0);
};

input.onWheelDown = e => {
	selected = (selected + 1) % blocks.length || 1;
	gui.blockSelector.setFrame(blocks[selected].faces[0], 0);
};

input.onResize = e =>
{
	display.resize(window.innerWidth, window.innerHeight);
};

input.onResize();

window.display = display;
window.camera = camera;
window.world = world;
window.input = input;
window.body = body;
