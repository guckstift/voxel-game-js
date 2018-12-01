import {Img} from "./img.js";

export class Gui
{
	constructor(display)
	{
		this.container = document.createElement("div");
		this.container.style.display = "block";
		this.container.style.position = "absolute";
		this.container.style.left = "0";
		this.container.style.top = "0";
		
		this.crosshairs = new Img("gfx/crosshairs.png", "50%", "50%", 0.5, 0.5);
		
		this.blockSelector = new Img("gfx/atlas.png", "32px", "32px", 0, 0, 2, 16, 16);
		this.blockSelector.setFrame(0,0);
		
		this.append(display.canvas);
		this.append(this.crosshairs.elm);
		this.append(this.blockSelector.elm);
	}
	
	append(elm)
	{
		this.container.appendChild(elm);
	}
	
	appendToBody()
	{
		document.body.appendChild(this.container);
	}
}
