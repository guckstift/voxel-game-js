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
				this.socket.send(JSON.stringify({
					msg: 3,
					id: client.id,
				}));
				
				client.socket.send(JSON.stringify({
					msg: 3,
					id: this.id,
				}));
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
				client.socket.send(JSON.stringify({
					msg: 4,
					id: this.id,
				}));
			}
		});
	}

	handleMessage(msg)
	{
		if(msg.msg === 0) {
			let x = msg.x;
			let y = msg.y;
			
			console.log(`client ${this.id}: getChunk ${x} ${y}`);
			
			let chunk = this.map.loadChunk(x, y);
			let buf = new Uint8Array(3 * 8 + chunk.data.byteLength);
			let f64 = new Float64Array(buf.buffer);
			
			f64[0] = 1;
			f64[1] = x;
			f64[2] = y;
			buf.set(chunk.data, 3 * 8);
			
			this.socket.send(buf);
		}
		else if(msg.msg === 2) {
			let x = msg.x;
			let y = msg.y;
			let z = msg.z;
			let block = msg.block;
			
			console.log(`client ${this.id}: setBlock ${x} ${y} ${z} ${block}`);
			
			this.map.setBlock(x, y, z, block);
			
			this.server.broadcast(this, {
				msg: 2,
				x, y, z,
				block,
			});
		}
	}
}
