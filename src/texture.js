export class Texture
{
	constructor(display, url)
	{
		let gl = display.gl;
		let img = document.createElement("img");

		img.src = url;
		img.onload = () => {
			let tex = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
			this.tex = tex;
		};
		
		this.tex = display.defaultTex;
	}
}
