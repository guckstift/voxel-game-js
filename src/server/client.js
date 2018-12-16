let idctr = 0;
let intsize = Int32Array.BYTES_PER_ELEMENT;

export class Client
{
	constructor(server, ws, socket)
	{
		this.id = idctr++;
		this.server = server;
		this.ws = ws;
		this.socket = socket;
		this.addr = socket.remoteAddress;
		this.ws.on("message", this.onMessage.bind(this));
		this.ws.on("close", this.onClose.bind(this));
	}
	
	onMessage(data)
	{
		let values = new Int32Array(new Uint8Array(data).buffer);
		let cmd = values[0];
		let reqid = values[1];
		
		if(cmd === 1) {
			this.onGetChunk(reqid, values[2], values[3], values[4]);
		}
		else if(cmd === 2) {
			let chunkData = new Uint8Array(data).subarray(intsize * 5);
			
			this.onStoreChunk(reqid, values[2], values[3], values[4], chunkData);
		}
	}
	
	onClose()
	{
		this.server.log("Client disconnected", this.addr);
	}
	
	onGetChunk(reqid, x, y, z)
	{
		let chunk = this.server.world.touchChunk(x, y, z);

		if(chunk.loading) {
			chunk.onLoaded = () => this.sendChunk(reqid, chunk.data);
		}
		else {
			this.sendChunk(reqid, chunk.data);
		}
	}
	
	sendChunk(reqid, data)
	{
		let bytes = new Uint8Array(intsize + data.byteLength);
		let values = new Int32Array(bytes.buffer);
		
		values[0] = reqid;
		bytes.set(data, intsize);
		this.ws.send(bytes);
	}
	
	onStoreChunk(reqid, x, y, z, data)
	{
		this.server.log("Client", this.addr, "stores chunk", x, y, z);
		this.server.world.touchChunk(x, y, z).setChunkData(data);
	}
}
