export class ServerStore
{
	constructor()
	{
		this.fs = require("fs");
	}

	loadChunk(x, y, z, cb, errcb)
	{
		this.fs.readFile(
			`./chunks/${x}_${y}_${z}`,
			(err, data) => {
				if(err) {
					errcb();
				}
				else {
					cb(new Uint8Array(data));
				}
			},
		);
	}

	storeChunk(chunk)
	{
		this.fs.writeFile(
			`./chunks/${chunk.x}_${chunk.y}_${chunk.z}`,
			chunk.data,
			err => {
				if(err) {
					console.log("fs write err", err);
				}
			},
		);
	}
}
