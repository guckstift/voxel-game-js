let noop = () => {};

export class Server
{
	constructor()
	{
		this.onSetChunk = noop;
		this.connected = false;
		this.queue = [];
		
		this.ws = new WebSocket("ws://" + window.location.host, "blockweb");
		this.ws.binaryType = "arraybuffer";
		this.ws.onopen = this.onOpen.bind(this);
		this.ws.onclose = this.onClose.bind(this);
		this.ws.onerror = this.onError.bind(this);
		this.ws.onmessage = this.onMessage.bind(this);
	}
	
	onOpen(e)
	{
		console.log("WebSocket opened", e);
		
		this.connected = true;
		this.processQueue();
	}
	
	onClose(e)
	{
		console.log("WebSocket closed", e);
	}
	
	onError(e)
	{
		console.log("WebSocket error", e);
	}
	
	onMessage(e)
	{
		let dv = new DataView(e.data);
		let u8 = new Uint8Array(e.data);
		let cmd = dv.getInt32(0);
		
		if(cmd === 2) {
			let x = dv.getInt32(4);
			let y = dv.getInt32(8);
			let z = dv.getInt32(12);
			let data = u8.subarray(16);
			
			this.onSetChunk(x, y, z, data);
		}
	}
	
	enqueue(cb)
	{
		this.queue.push(cb);
	}
	
	processQueue()
	{
		while(this.queue.length > 0) {
			this.queue.shift()();
		}
	}
	
	getChunk(x, y, z)
	{
		if(this.connected) {
			console.log("server getchunk", x, y, z);
			
			let buf = new ArrayBuffer(16);
			let dv = new DataView(buf);
			
			dv.setInt32(0,  1);
			dv.setInt32(4,  x);
			dv.setInt32(8,  y);
			dv.setInt32(12, z);
			
			this.ws.send(buf);
		}
		else {
			this.enqueue(() => this.getChunk(x, y, z));
		}
	}
	
	setChunk(x, y, z, data)
	{
		if(this.connected) {
			let buf = new ArrayBuffer(16 + data.byteLength);
			let dv = new DataView(buf);
			let u8 = new Uint8Array(buf);
			
			dv.setInt32(0,  2);
			dv.setInt32(4,  x);
			dv.setInt32(8,  y);
			dv.setInt32(12, z);
			u8.set(data, 16);
			
			this.ws.send(buf);
		}
		else {
			data = data.slice();
			this.enqueue(() => this.setChunk(x, y, z, data));
		}
	}
}
