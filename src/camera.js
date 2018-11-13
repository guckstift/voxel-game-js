import * as matrix from "./matrix.js";

export class Camera
{
	constructor(display)
	{
		this.display = display;
		this.pos = [0, 0, 0];
		this.proj = matrix.identity();
		this.view = matrix.identity();
	}
	
	getProjection()
	{
		matrix.perspective(90 * Math.PI / 180, this.display.aspect, 0.1, 100, this.proj);
		
		return this.proj;
	}
	
	getView()
	{
		matrix.translation(-this.pos[0], -this.pos[1], -this.pos[2], this.view);
		
		return this.view;
	}
	
	moveForward(speed)
	{
		this.pos[2] += speed;
	}
	
	moveBackward(speed)
	{
		this.pos[2] -= speed;
	}
	
	moveLeft(speed)
	{
		this.pos[0] -= speed;
	}
	
	moveRight(speed)
	{
		this.pos[0] += speed;
	}
}
