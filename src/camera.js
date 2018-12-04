import * as matrix from "./matrix.js";
import * as vector from "./vector.js";
import {radians} from "./math.js";

export class Camera
{
	constructor(display)
	{
		this.display = display;
		this.pos = vector.create64();
		this.hangle = 0;
		this.vangle = 0;
		this.proj = matrix.identity();
		this.view = matrix.identity();
		this.viewmodel = matrix.identity();
		this.rota = matrix.identity();
		this.forward = vector.create();
		this.dirvec = vector.create();
	}
	
	getProjection()
	{
		matrix.perspective(radians(90), this.display.aspect, 0.1, 100, this.proj);
		
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
	
	getViewModel(modelx, modely, modelz, ax = 0, ay = 0, az = 0)
	{
		matrix.identity(this.rota);
		matrix.rotateX(this.rota, this.vangle, this.rota);
		matrix.rotateY(this.rota, this.hangle, this.rota);
		
		matrix.translate(
			this.rota,
			modelx - this.pos[0],
			modely - this.pos[1],
			modelz - this.pos[2],
			this.viewmodel
		);
		
		matrix.rotateX(this.viewmodel, ax, this.viewmodel);
		matrix.rotateY(this.viewmodel, ay, this.viewmodel);
		matrix.rotateZ(this.viewmodel, az, this.viewmodel);
		
		return this.viewmodel;
	}
	
	getForward(speed)
	{
		matrix.identity(this.rota);
		matrix.rotateY(this.rota, -this.hangle, this.rota);
		vector.create(0, 0, speed, this.forward);
		vector.transform(this.forward, this.rota, this.forward);
		
		return this.forward;
	}
	
	getLeftward(speed)
	{
		this.getForward(speed);
		this.forward.set([-this.forward[2], this.forward[1], this.forward[0]]);
		
		return this.forward;
	}
	
	getDirVec(scale = 1)
	{
		vector.create(0, 0, 1, this.dirvec);
		vector.rotateX(this.dirvec, -this.vangle, this.dirvec);
		vector.rotateY(this.dirvec, -this.hangle, this.dirvec);
		vector.scale(this.dirvec, scale, this.dirvec);
		
		return this.dirvec;
	}
	
	setPos(pos)
	{
		vector.copy(pos, this.pos);
	}
	
	moveForward(speed)
	{
		vector.add(this.pos, this.getForward(speed), this.pos);
	}
	
	moveBackward(speed)
	{
		vector.add(this.pos, this.getForward(-speed), this.pos);
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
		
		if(this.vangle < radians(-90)) {
			this.vangle = radians(-90);
		}
		else if(this.vangle > radians(90)) {
			this.vangle = radians(90);
		}
	}
}
