import * as matrix from "./matrix.js";
import * as vector from "./vector.js";

export class Camera
{
	constructor(display)
	{
		this.display = display;
		this.pos = vector.create();
		this.hangle = 0;
		this.vangle = 0;
		this.proj = matrix.identity();
		this.view = matrix.identity();
		this.rota = matrix.identity();
		this.forward = vector.create();
	}
	
	getProjection()
	{
		matrix.perspective(90 * Math.PI / 180, this.display.aspect, 0.1, 100, this.proj);
		
		return this.proj;
	}
	
	getView()
	{
		matrix.identity(this.rota);
		matrix.rotateX(this.rota, this.vangle, this.rota);
		matrix.rotateY(this.rota, this.hangle, this.rota);
		matrix.translate(this.rota, -this.pos[0], -this.pos[1], -this.pos[2], this.view);
		
		return this.view;
	}
	
	getForward(speed)
	{
		matrix.identity(this.rota);
		matrix.rotateY(this.rota, -this.hangle, this.rota);
		vector.create(0, 0, speed, 1, this.forward);
		vector.transform(this.forward, this.rota, this.forward);
		
		return this.forward;
	}
	
	moveForward(speed)
	{
		let forward = this.getForward(speed);
		
		vector.add(this.pos, forward, this.pos);
	}
	
	moveBackward(speed)
	{
		let forward = this.getForward(speed);
		
		vector.sub(this.pos, forward, this.pos);
	}
	
	moveLeft(speed)
	{
		let forward = this.getForward(speed);
		
		forward.set([-forward[2], forward[1], forward[0]]);
		vector.add(this.pos, forward, this.pos);
	}
	
	moveRight(speed)
	{
		let forward = this.getForward(-speed);
		
		forward.set([-forward[2], forward[1], forward[0]]);
		vector.add(this.pos, forward, this.pos);
	}
	
	moveUp(speed)
	{
		camera.pos[1] += speed;
	}
	
	moveDown(speed)
	{
		camera.pos[1] -= speed;
	}
	
	turnHori(angle)
	{
		this.hangle += angle;
	}
	
	turnVert(angle)
	{
		this.vangle += angle;
	}
}
