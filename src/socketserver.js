let noop = () => {};
let zeroKey = new Uint8Array(4);
let idctr = 0;

export class SocketServer
{
	constructor(port = 12345)
	{
		this.http = require("http");
		this.crypto = require("crypto");
		this.fs = require("fs");
		this.onNewClient = noop;

		this.server = this.http.createServer((req, res) => {
			if(
				req.headers.upgrade === "websocket" &&
				req.headers.connection === "Upgrade" &&
				req.headers["sec-websocket-version"] === "13"
			) {
				let clientKey = req.headers["sec-websocket-key"];
				let serverKey = this.createServerKey(clientKey);

				res.statusCode = 101;
				res.setHeader("Upgrade", "websocket");
				res.setHeader("Connection", "upgrade");
				res.setHeader("Sec-WebSocket-Accept", serverKey);
				res.setHeader("Sec-WebSocket-Protocol", "blockweb");
				res.end();

				let client = new Client(req.socket);

				this.onNewClient(client);
			}
			else if(req.method === "GET") {
				let url = req.url;
				let ext = url.split(".").pop();

				console.log(url);

				if(url === "/") {
					url = "/index.html";
				}

				this.fs.readFile(
					"." + url,
					(err, data) => {
						if(err) {
							res.statusCode = 404;
							res.end();
						}
						else {
							if(ext === "js") {
								res.setHeader("Content-Type", "application/javascript");
							}
							else if(ext === "html") {
								res.setHeader("Content-Type", "text/html");
							}
							else if(ext === "png") {
								res.setHeader("Content-Type", "image/png");
							}

							res.end(data);
						}
					}
				);
			}
		});

		this.server.listen(port);
	}

	createServerKey(clientKey)
	{
		return this.crypto
			.createHash("sha1")
			.update(clientKey + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
			.digest("base64");
	}
}

class Client
{
	constructor(socket)
	{
		this.id = idctr++;
		this.socket = socket;
		this.socket.on("data", e => this.onData(e));
		this.type = 0;
		this.msgparts = [];
		this.message = "";
		this.onMessage = () => {};
	}

	sendData(...bufs)
	{
		let length = bufs.reduce((len, buf) => len + buf.byteLength, 0);
		let frame = new Uint8Array(length + 10);
		let i = 0;

		// fin / rsv / opc = 1 / 0 / 2
		frame[i++] = 0b10000010;

		if(length > 2**16 - 1) {
			frame[i++] = 127;
			frame[i++] = length >> 56 & 0xff;
			frame[i++] = length >> 48 & 0xff;
			frame[i++] = length >> 40 & 0xff;
			frame[i++] = length >> 32 & 0xff;
			frame[i++] = length >> 24 & 0xff;
			frame[i++] = length >> 16 & 0xff;
			frame[i++] = length >>  8 & 0xff;
			frame[i++] = length >>  0 & 0xff;
		}
		else if(length > 125) {
			frame[i++] = 126;
			frame[i++] = length >> 8 & 0xff;
			frame[i++] = length >> 0 & 0xff;
		}
		else {
			frame[i++] = length;
		}

		bufs.forEach(buf => {
			frame.set(new Uint8Array(buf.buffer), i);
			i += buf.byteLength;
		});

		this.socket.write(frame);
	}

	onData(data)
	{
		let frames = this.parseData(data);

		frames.forEach(frame => {
			if(frame.opc === 1) {
				throw "Error: client texts me. I don't want that!";
			}
			else if(frame.opc === 2) {
				this.type = frame.opc;
				this.msgparts = [frame.dec];
			}
			else if(frame.opc === 0) {
				this.msgparts.push(frame.dec);
			}

			if(this.type === 2 && (frame.opc === 0 || frame.opc === 2)) {
				if(frame.fin) {
					this.message = this.msgparts.reduce((left, right) => left.concat(right));
					this.msgparts = [];
					this.onMessage(this.message);
				}
			}
		});
	}

	parseData(buf)
	{
		let frames = [];

		while(buf.length > 0) {
			let frame = this.parseFrame(buf);

			frames.push(frame);
			buf = buf.subarray(frame.consumed);
		}

		return frames;
	}

	parseFrame(buf)
	{
		let consumed = 0;
		let key = zeroKey;
		let fin = (buf[0] & 0b10000000) >> 7;
		let rsv = (buf[0] &  0b1110000) >> 4;
		let opc = (buf[0] &     0b1111) >> 0;
		let msk = (buf[1] & 0b10000000) >> 7;
		let len = (buf[1] &  0b1111111) >> 0;

		if(len === 126) {
			len =  buf[2] << 8;
			len += buf[3];
			buf = buf.subarray(4);
			consumed += 4;
		}
		else if(len === 127) {
			len =  buf[2] << 56;
			len += buf[3] << 48;
			len += buf[4] << 40;
			len += buf[5] << 32;
			len += buf[6] << 24;
			len += buf[7] << 16;
			len += buf[8] << 8;
			len += buf[9];
			buf = buf.subarray(10);
			consumed += 10;
		}
		else {
			buf = buf.subarray(2);
			consumed += 2;
		}

		let dec = new Uint8Array(len);

		if(msk > 0) {
			key = buf.subarray(0, 4);
			buf = buf.subarray(4);
			consumed += 4;
		}

		for(let i=0; i < len; i++) {
			dec[i] = buf[i] ^ key[i % 4];
			consumed += 1;
		}

		// console.log("frame", fin, rsv, opc, msk, len, key, dec);

		return {fin, rsv, opc, msk, len, key, dec, consumed};
	}
}
