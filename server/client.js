import {getLocalPos, getChunkPos} from "../src/world.js";

let noop = () => {};

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
		else if(cmd === 3) {
			let x = dv.getInt32(4);
			let y = dv.getInt32(8);
			let z = dv.getInt32(12);
			let id = dv.getUint8(16);
			
			this.onSetBlockId(x, y, z, id);
		}
	}
	
	onClose()
	{
		this.server.tlog(this.name, "disconnected");
		this.server.removeClient(this);
	}
	
	onGetChunk(x, y, z)
	{
		let chunk = this.world.getChunk(x, y, z);
		
		if(chunk.loaded) {
			this.setChunk(x, y, z, chunk.data);
		}
		else {
			chunk.enqueue(() => this.onGetChunk(x, y, z));
		}
	}
	
	onSetChunk(x, y, z, data)
	{
		let chunk = this.world.getChunkAt(x, y, z);
		
		if(chunk.loaded) {
			this.server.tlog(this.name, "stores chunk", x, y, z);
			chunk.data.set(data);
			this.store.storeChunk(x, y, z, data);
			
			this.server.clients.forEach(client => {
				if(client !== this) {
					client.setChunk(x, y, z, data);
				}
			});
		}
		else {
			data = data.slice();
			chunk.enqueue(() => this.onSetChunk(x, y, z, data));
		}
	}
	
	onSetBlockId(x, y, z, id)
	{
		let chunk = this.world.getChunk(x, y, z);
		
		if(chunk.loaded) {
			this.server.tlog(this.name, "stores block", x, y, z, id);
			this.world.setBlockId(x, y, z, id);
			
			this.store.storeBlockId(x, y, z, id, noop, () => {
				this.store.storeChunk(...getChunkPos(x, y, z), chunk.data);
			});
			
			this.server.clients.forEach(client => {
				if(client !== this) {
					client.setBlockId(x, y, z, id);
				}
			});
		}
		else {
			chunk.enqueue(() => this.onSetBlockId(x, y, z, id));
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
	
	setBlockId(x, y, z, id)
	{
		let buf = new ArrayBuffer(17);
		let dv = new DataView(buf);
		
		dv.setInt32(0,  3);
		dv.setInt32(4,  x);
		dv.setInt32(8,  y);
		dv.setInt32(12, z);
		dv.setUint8(16, id);
		
		this.ws.send(buf);
	}
}
