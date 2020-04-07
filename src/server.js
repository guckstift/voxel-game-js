export default class Server
{
	constructor()
	{
		this.others = new Set();
		this.socket = new WebSocket("ws://" + window.location.host);
		
		this.socket.onopen = e => {
			this.isopen = true;
			this.queue.forEach(fn => fn());
			this.queue = [];
		};
		
		this.socket.onmessage = e => {
			if(typeof e.data === "string") {
				let msg = JSON.parse(e.data);
				
				if(msg.msg === 2) {
					this.onSetBlock(msg.x, msg.y, msg.z, msg.block);
				}
				else if(msg.msg === 3) {
					this.onAddPlayer(msg.id);
				}
				else if(msg.msg === 4) {
					this.onRemovePlayer(msg.id);
				}
			}
			else {
				e.data.arrayBuffer().then(buf => {
					let f64 = new Float64Array(buf);
					let msg = f64[0];
					
					if(msg === 1) {
						this.onSetChunk(f64[1], f64[2], new Uint8Array(buf, 3 * 8));
					}
				});
			}
		};
		
		this.isopen = false;
		this.queue = [];
		this.onSetChunk = () => {};
		this.onSetBlock = () => {};
	}
	
	send(msg)
	{
		if(this.isopen) {
			this.socket.send(JSON.stringify(msg));
		}
		else {
			this.queue.push(() => this.send(msg));
		}
	}
	
	getChunk(x, y)
	{
		this.send({msg: 0, x, y});
	}
	
	setBlock(x, y, z, block)
	{
		this.send({msg: 2, x, y, z, block});
	}
	
	onAddPlayer(id)
	{
		this.others.add(id);
	}
	
	onRemovePlayer(id)
	{
		this.others.delete(id);
	}
}
