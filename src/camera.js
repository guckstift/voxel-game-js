import Matrix from "./matrix.js";

export default class Camera
{
	constructor()
	{
		this.proj = new Matrix();
		this.view = new Matrix();
	}
}
