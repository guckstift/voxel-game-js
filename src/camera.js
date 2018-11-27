import * as matrix from "./matrix.js";
import * as vector from "./vector.js";
import * as vector3 from "./vector3.js";

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
		this.dirvec = vector.create();
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
	
	getLeftward(speed)
	{
		this.getForward(speed);
		this.forward.set([-this.forward[2], this.forward[1], this.forward[0]]);
		
		return this.forward;
	}
	
	getDirVec()
	{
		vector.create(0, 0, 1, 1, this.dirvec);
		vector.rotateX(this.dirvec, -this.vangle, this.dirvec);
		vector.rotateY(this.dirvec, -this.hangle, this.dirvec);
		
		return this.dirvec;
	}
	
	setPos(pos)
	{
		vector3.copy(pos, this.pos);
	}
	
	moveForward(speed)
	{
		vector.add(this.pos, this.getForward(speed), this.pos);
	}
	
	moveBackward(speed)
	{
		vector.sub(this.pos, this.getForward(speed), this.pos);
	}
	
	moveLeft(speed)
	{
		vector.add(this.pos, this.getLeftward(speed), this.pos);
	}
	
	moveRight(speed)
	{
		vector.add(this.pos, this.getLeftward(-speed), this.pos);
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
		
		if(this.vangle < -Math.PI / 2) {
			this.vangle = -Math.PI / 2;
		}
		else if(this.vangle > Math.PI / 2) {
			this.vangle = Math.PI / 2;
		}
	}
}
