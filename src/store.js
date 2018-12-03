export class Store
{
	constructor()
	{
		this.ready = new Promise(res => {
			let request = window.indexedDB.open("blockweb");
		
			request.onerror = e => {
				console.log("request error", e);
			};

			request.onupgradeneeded = e => {
				console.log("request upgrade", e);
				e.target.result.createObjectStore("chunks", {keyPath: "pos"});
			};

			request.onsuccess = e => {
				console.log("request success", e);
				this.db = e.target.result;
				res();
			};
		});
	}
	
	loadChunk(x, y, z, cb, errcb)
	{
		if(this.db) {
			let transaction = this.db.transaction(["chunks"]);
			let objectStore = transaction.objectStore("chunks");
			let request     = objectStore.get([x, y, z]);
			
			request.onerror = e => {
				console.log("request chunk error", e);
				errcb();
			};
			
			request.onsuccess = e => {
				console.log("request chunk success", e);
				if(request.result) {
					cb(request.result);
				}
				else {
					errcb();
				}
			};
		}
		else {
			this.ready.then(() => this.loadChunk(x, y, z, cb, errcb));
		}
	}
	
	storeChunk(chunk)
	{
		if(this.db) {
			let transaction = this.db.transaction(["chunks"], "readwrite");
		
			transaction.onerror = e => {
				console.log("transaction error", e);
			};
		
			transaction.oncomplete = e => {
				console.log("transaction complete", e);
			};
		
			let chunkStore = transaction.objectStore("chunks");
			let data = chunk.data;
			
			let pos = [
				chunk.x,
				chunk.y,
				chunk.z,
			];
		
			chunkStore.put({data, pos});
		}
	}
}
