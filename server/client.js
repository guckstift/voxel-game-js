export class Client
{
	constructor(server, ws, socket, id)
	{
		this.server = server;
		this.ws = ws;
		this.socket = socket;
		this.id = id;
		this.addr = socket.remoteAddress;
		this.world = server.world;
		this.store = server.store;
		
		this.ws.binaryType = "arraybuffer";
		this.ws.on("message", this.onMessage.bind(this));
		this.ws.on("close", this.onClose.bind(this));
	}
	
	get name()
	{
		return "Client " + this.id + " (" + this.addr + ")";
	}
	
	onMessage(msg)
	{
		let dv = new DataView(msg);
		let cmd = dv.getUint32(0);
		
		if(cmd === 1) {
			let x = dv.getInt32(4);
			let y = dv.getInt32(8);
			let z = dv.getInt32(12);
			
			this.onGetChunk(x, y, z);
		}
		else if(cmd === 2) {
			let x = dv.getInt32(4);
			let y = dv.getInt32(8);
			let z = dv.getInt32(12);
			let data = new Uint8Array(msg, 16);
			
			this.onSetChunk(x, y, z, data);
		}
	}
	
	onClose()
	{
		this.server.tlog(this.name, "disconnected");
	}
	
	onGetChunk(x, y, z)
	{
		let chunk = this.world.getChunk(x, y, z);
		
		if(chunk.loaded) {
			this.server.tlog(this.name, "wants chunk", x, y, z);
			this.setChunk(x, y, z, chunk.data);
		}
		else {
			chunk.enqueue(() => this.onGetChunk(x, y, z));
		}
	}
	
	onSetChunk(x, y, z, data)
	{
		let chunk = this.world.getChunk(x, y, z);
		
		if(chunk.loaded) {
			this.server.tlog(this.name, "stores chunk", x, y, z);
			chunk.data.set(data);
			this.store.storeChunk(x, y, z, data);
		}
		else {
			data = data.slice();
			chunk.enqueue(() => this.onSetChunk(x, y, z, data));
		}
	}
	
	setChunk(x, y, z, data)
	{
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
}
