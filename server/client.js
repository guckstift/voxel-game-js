export default class Client
{
	constructor(server, id, socket)
	{
		this.server = server;
		this.id = id;
		this.socket = socket;
		this.map = server.map;
	}
	
	async run()
	{
		console.log(`client ${this.id}: joined`);
		
		this.server.clients.forEach(client => {
			if(client !== this) {
				this.send({
					msg: 3,
					id: client.id,
				});
				
				client.send({
					msg: 3,
					id: this.id,
				});
			}
		});
		
		for await(let event of this.socket.receive()) {
			if(typeof event === "string") {
				this.handleMessage(JSON.parse(event));
			}
		}
		
		console.log(`client ${this.id}: left`);
		
		this.server.clients.forEach(client => {
			if(client !== this) {
				client.send({
					msg: 4,
					id: this.id,
				});
			}
		});
	}
	
	send(msg, raw = false)
	{
		try {
			if(raw) {
				this.socket.send(msg);
			}
			else {
				this.socket.send(JSON.stringify(msg));
			}
		}
		catch(e) {
			if(!(e instanceof ConnectionReset)) {
				throw e;
			}
		}
	}
	
	async loadChunk(cx, cy)
	{
		let chunk = this.map.getChunk(cx, cy);
		
		if(chunk) {
			return chunk;
		}
		
		try {
			let data = await Deno.readFile("./save/chunk_" + cx + "_" + cy);
			
			return this.map.loadChunk(cx, cy, data);
		}
		catch(e) {
			return this.map.loadChunk(cx, cy);
		}
	}

	handleMessage(msg)
	{
		if(msg.msg === 0) {
			let x = msg.x;
			let y = msg.y;
			
			console.log(`client ${this.id}: getChunk ${x} ${y}`);
			
			this.loadChunk(x, y)
				.then(chunk => {
					let buf = new Uint8Array(3 * 8 + chunk.data.byteLength);
					let f64 = new Float64Array(buf.buffer);
					
					f64[0] = 1;
					f64[1] = x;
					f64[2] = y;
					buf.set(chunk.data, 3 * 8);
					
					this.send(buf, true);
				});
		}
		else if(msg.msg === 2) {
			let x = msg.x;
			let y = msg.y;
			let z = msg.z;
			let block = msg.block;
			
			console.log(`client ${this.id}: setBlock ${x} ${y} ${z} ${block}`);
			
			let chunk = this.map.setBlock(x, y, z, block);
			
			this.server.broadcast(this, {
				msg: 2,
				x, y, z,
				block,
			});
			
			Deno.writeFile("./save/chunk_" + chunk.cx + "_" + chunk.cy, chunk.data);
		}
		else if(msg.msg === 5) {
			let x = msg.x;
			let y = msg.y;
			let z = msg.z;
			let rx = msg.rx;
			let rz = msg.rz;
			
			this.server.broadcast(this, {
				msg: 6,
				id: this.id,
				x, y, z, rx, rz,
			});
		}
	}
}
