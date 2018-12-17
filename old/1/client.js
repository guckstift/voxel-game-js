export class Client
{
	constructor(server, ws, socket, id)
	{
		this.server = server;
		this.ws = ws;
		this.socket = socket;
		this.id = id;
		this.addr = socket.remoteAddress;
		this.ws.on("message", this.onMessage.bind(this));
		this.ws.on("close", this.onClose.bind(this));
	}
	
	onMessage(data)
	{
		let u8 = new Uint8Array(data);
		let i32 = new Int32Array(u8.buffer, 0, 4);
		let cmd = i32[0];
		
		if(cmd === 1) {
			let x = i32[1];
			let y = i32[2];
			let z = i32[3];
			
			this.onGetChunk(x, y, z);
		}
		else if(cmd === 2) {
			let x = i32[1];
			let y = i32[2];
			let z = i32[3];
			let data = u8.subarray(16);
			
			this.onSetChunk(x, y, z, data);
		}
		else if(cmd === 3) {
			let x = i32[1];
			let y = i32[2];
			let z = i32[3];
			let t = u8[16];
			
			this.onSetBlock(x, y, z, t);
		}
	}
	
	onClose()
	{
		this.server.log("Client disconnected", this.addr);
	}
	
	onGetChunk(x, y, z)
	{
		this.server.log("Client", this.addr, "wants chunk", x, y, z);
		
		let chunk = this.server.world.touchChunk(x, y, z);

		if(chunk.loaded) {
			this.setChunk(x, y, z, chunk.data);
		}
		else {
			chunk.addOnLoadJob(() => this.setChunk(x, y, z, chunk.data));
		}
	}
	
	onSetChunk(x, y, z, data)
	{
		this.server.log("Client", this.addr, "stores chunk", x, y, z);
		
		let chunk = this.server.world.touchChunk(x, y, z);

		if(chunk.loaded) {
			chunk.setChunkData(data);
			chunk.storeChunk();
		}
		else {
			data = data.slice();
			chunk.addOnLoadJob(() => chunk.setChunkData(data));
		}
	}
	
	onSetBlock(x, y, z, t)
	{
		this.server.log("Client", this.addr, "sets block", x, y, z, "to", t);
		this.server.world.setBlock(x, y, z, t);
	}
	
	setChunk(x, y, z, data)
	{
		let u8 = new Uint8Array(16 + data.byteLength);
		let i32 = new Int32Array(u8.buffer);
		
		i32[0] = 2;
		i32[1] = x;
		i32[2] = y;
		i32[3] = z;
		u8.set(data, 16);
		this.ws.send(u8);
	}
}
