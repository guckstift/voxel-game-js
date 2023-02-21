export default class Server
{
	constructor()
	{
		this.others = new Set();

		this.socket = new WebSocket(
			"ws://" + window.location.hostname + ":54321"
		);

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
					this.others.add(msg.id);
					this.onAddPlayer(msg.id);
				}
				else if(msg.msg === 4) {
					this.others.delete(msg.id);
					this.onRemovePlayer(msg.id);
				}
				else if(msg.msg === 6) {
					this.onSetPlayerPos(msg.id, msg.x, msg.y, msg.z, msg.rx, msg.rz);
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
		this.onAddPlayer = () => {};
		this.onRemovePlayer = () => {};
		this.onSetPlayerPos = () => {};
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

	setMyPos(x, y, z, rx, rz)
	{
		this.send({msg: 5, x, y, z, rx, rz});
	}
}
