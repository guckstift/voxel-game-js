export class ClientStore
{
	constructor()
	{
		this.isready = false;
		this.requestid = 0;
		this.requests = {};

		this.ready = new Promise(res => {
			this.socket = new WebSocket("ws://localhost:12345", "blockweb");
			this.socket.binaryType = "arraybuffer";

			this.socket.onopen = e => {
				res();
				this.isready = true;
			};

			this.socket.onerror = e => {
				console.log("WebSocket error", e);
			};

			this.socket.onmessage = e => {
				let requestid = new Int32Array(e.data)[0];
				let payload = new Uint8Array(e.data, 4);

				this.requests[requestid](payload);
			};
		});
	}

	loadChunk(x, y, z, cb, errcb)
	{
		if(this.isready) {
			let requestid = this.requestid++;

			this.requests[requestid] = cb;

			this.socket.send(
				new Int32Array([1, requestid, x, y, z]),
			);
		}
		else {
			this.ready.then(() => this.loadChunk(x, y, z, cb, errcb));
		}
	}

	storeChunk(chunk)
	{
		if(this.isready) {
			let requestid = this.requestid++;
			let dataOffs = 5 * 4;
			let buf8 = new Uint8Array(dataOffs + chunk.data.byteLength);
			let buf32 = new Int32Array(buf8.buffer, 0, dataOffs);

			buf32[0] = 2;
			buf32[1] = requestid;
			buf32[2] = chunk.x;
			buf32[3] = chunk.y;
			buf32[4] = chunk.z;
			buf8.set(chunk.data, dataOffs);

			// this.requests[requestid] = () => {});
			this.socket.send(buf8);

			// this.socket.send(
			// 	new Int32Array([2, requestid, chunk.x, chunk.y, chunk.z]),
			// );
			// this.socket.send(
			// 	chunk.data,
			// );
		}
		else {
			this.ready.then(() => this.storeChunk(chunk));
		}
			// let transaction = this.db.transaction(["chunks"], "readwrite");
			//
			// transaction.onerror = e => {
			// 	//console.log("transaction error", e);
			// };
			//
			// transaction.oncomplete = e => {
			// 	//console.log("transaction complete", e);
			// };
			//
			// let chunkStore = transaction.objectStore("chunks");
			// let data = chunk.data;
			//
			// let pos = [
			// 	chunk.x,
			// 	chunk.y,
			// 	chunk.z,
			// ];
			//
			// chunkStore.put({data, pos});
	}
}
