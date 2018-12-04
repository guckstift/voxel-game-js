export class Img
{
	constructor(url, x = "0", y = "0", anchorx = 0, anchory = 0, scale = 1, framew = 0, frameh = 0)
	{
		this.framew = framew;
		this.frameh = frameh;
		this.elm = document.createElement("div");
		this.elm.style.overflow = "hidden";
		this.elm.style.position = "absolute";
		this.elm.style.left = x;
		this.elm.style.top = y;
		
		this.elm.style.transform = `
			scale(${scale})
			translateX(-${anchorx * 100}%)
			translateY(-${anchory * 100}%)
		`;
		
		if(framew > 0) {
			this.elm.style.width = framew + "px";
		}	
		
		if(frameh > 0) {
			this.elm.style.height = frameh + "px";
		}
			
		this.img = document.createElement("img");
		this.img.style.display = "block";
		this.img.src = url;
		
		this.elm.appendChild(this.img);
	}
	
	setFrame(x, y)
	{
		this.img.style.marginLeft = -x * this.framew + "px";
		this.img.style.marginTop = -y * this.frameh + "px";
	}
}
