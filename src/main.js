import Display from "./display.js";
import Shader from "./shader.js";

let display = new Display(800, 600);

display.appendToBody();

let shader = new Shader(display, `
	void main()
	{
	}
`,`
	void main()
	{
	}
`);
