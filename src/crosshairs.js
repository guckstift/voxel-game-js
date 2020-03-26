export default class Crosshairs
{
	constructor()
	{
		let dom = document.createElement("img");
		
		dom.src = "gfx/crosshairs.png";
		dom.style.display = "block";
		dom.style.position = "absolute";
		dom.style.left = "50%";
		dom.style.top = "50%";
		dom.style.transform = "translate(-50%,-50%)";
		
		this.dom = dom;
	}
	
	appendToBody()
	{
		document.body.appendChild(this.dom);
	}
}
