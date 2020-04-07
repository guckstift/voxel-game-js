export default class Debugger
{
	constructor(camera, map, controller, server)
	{
		let dom = document.createElement("div");
		
		dom.style.display = "none";
		dom.style.position = "absolute";
		dom.style.left = "16px";
		dom.style.top = "16px";
		dom.style.padding = "16px";
		dom.style.boxSizing = "border-box";
		dom.style.backgroundColor = "#0000ff80";
		dom.style.borderRadius = "8px";
		dom.style.color = "#fff";
		dom.style.fontFamily = "monospace";
		
		this.dom = dom;
		this.frames = 0;
		this.timeAccu = 0;
		this.last = 0;
		this.camera = camera;
		this.map = map;
		this.controller = controller;
		this.server = server;
		this.enabled = false;
		
		this.fpsMonitor = this.addMonitor("FPS");
		this.posMonitor = this.addMonitor("Position");
		this.chunksMonitor = this.addMonitor("Loaded chunks");
		this.chunkPosMonitor = this.addMonitor("Chunk position");
		this.chunkQuadsMonitor = this.addMonitor("Chunk quad count");
		this.othersMonitor = this.addMonitor("Other player IDs");
		
		window.addEventListener("keydown", e => {
			if(e.key === "F3") {
				e.preventDefault();
				this.toggle();
			}
		});
	}
	
	appendToBody()
	{
		document.body.appendChild(this.dom);
	}
	
	addMonitor(labelText)
	{
		let monitor = document.createElement("div");
		let label = document.createElement("span");
		let value = document.createElement("span");
		
		label.textContent = labelText + ": ";
		monitor.appendChild(label);
		monitor.appendChild(value);
		this.dom.appendChild(monitor);
		
		return value;
	}
	
	frame()
	{
		if(!this.enabled) {
			return;
		}
		
		let now = performance.now();
		
		this.last = this.last || now;
		this.frames ++;
		
		let delta = now - this.last;
		
		if(delta >= 1000) {
			let fps = this.frames * 1000 / delta;
			
			this.fpsMonitor.textContent = fps.toFixed(0);
			this.last = now;
			this.frames = 0;
		}
		
		this.posMonitor.textContent = `
			x = ${this.camera.pos.x.toFixed(2)}
			y = ${this.camera.pos.y.toFixed(2)}
			z = ${this.camera.pos.z.toFixed(2)}
		`;
		
		this.chunksMonitor.textContent = this.map.loadedChunks;
		
		let cx = Math.floor(this.camera.pos.x / 16);
		let cy = Math.floor(this.camera.pos.y / 16);
		
		this.chunkPosMonitor.textContent = `
			x = ${cx.toFixed(0)}
			y = ${cy.toFixed(0)}
		`;
		
		let chunk = this.map.getChunk(cx, cy);
		
		this.chunkQuadsMonitor.textContent = chunk ? chunk.count / 6 : "no chunk loaded";
		
		this.othersMonitor.textContent = Array.from(this.server.others).join(",");
	}
	
	enable()
	{
		this.enabled = true;
		this.dom.style.display = "block";
		this.controller.enableFly();
	}
	
	disable()
	{
		this.enabled = false;
		this.dom.style.display = "none";
		this.controller.disableFly();
	}
	
	toggle()
	{
		if(this.enabled) {
			this.disable();
		}
		else {
			this.enable();
		}
	}
}
