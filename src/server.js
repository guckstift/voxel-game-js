let http = require("http");
let crypto = require("crypto");
let clients = [];

let server = http.createServer((req, res) => {
	if(
		req.headers.upgrade === "websocket" &&
		req.headers.connection === "Upgrade" &&
		req.headers["sec-websocket-version"] === "13"
	) {
		let clientKey = req.headers["sec-websocket-key"];
		let serverKey = createServerKey(clientKey);

		res.statusCode = 101;
		res.setHeader("Upgrade", "websocket");
		res.setHeader("Connection", "upgrade");
		res.setHeader("Sec-WebSocket-Accept", serverKey);
		res.setHeader("Sec-WebSocket-Protocol", "blockweb");
		res.end();

		let client = new Client(req.socket);

		client.onMessage = txt => {
			console.log(txt);
			client.sendData([42]);
		};

		clients.push(client);
	}
});

server.listen(1234);

function createServerKey(clientKey)
{
	return crypto
		.createHash("sha1")
		.update(clientKey + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
		.digest("base64");
}

function binToStr(buf)
{
	res = "";

	buf.forEach(i => {
		res += String.fromCharCode(i)
	});

	return res;
}

class Client
{
	constructor(socket)
	{
		this.socket = socket;
		this.socket.on("data", e => this.onData(e));
		this.type = 0;
		this.msgparts = [];
		this.message = "";
		this.onMessage = () => {};
	}

	sendData(buf)
	{
		let frame = [];
		let length = buf.length;

		frame.push(0b10000010);

		if(length > 125) {
			throw "Error: message to send is to large";
		}

		frame.push(length);

		buf.forEach(byte => frame.push(byte));

		this.socket.write(new Uint8Array(frame));
	}

	onData(e)
	{
		let frame = this.parseFrame(e);

		if(frame.opc === 1) {
			throw "Error: client texts me. I don't want that!";
		}
		if(frame.opc === 2) {
			this.type = frame.opc;
			this.msgparts = [frame.dec];
		}
		else if(frame.opc === 0) {
			this.msgparts.push(frame.dec);
		}

		if(this.type === 2) {
			if(frame.fin) {
				this.message = this.msgparts.reduce((left, right) => left.concat(right));
				this.onMessage(this.message);
			}
		}
	}

	parseFrame(e)
	{
		let key = new Uint8Array(4);
		let buf = new Uint8Array(e);
		let fin = (buf[0] & 0b10000000) >> 7;
		let rsv = (buf[0] &  0b1110000) >> 4;
		let opc = (buf[0] &     0b1111) >> 0;
		let msk = (buf[1] & 0b10000000) >> 7;
		let len = (buf[1] &  0b1111111) >> 0;

		if(len === 126) {
			len =  buf[2] << 8;
			len += buf[3];
			buf = buf.subarray(4);
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
		}
		else {
			buf = buf.subarray(2);
		}

		let dec = new Uint8Array(len);

		if(msk > 0) {
			key = buf.subarray(0, 4);
			buf = buf.subarray(4);
		}

		for(let i=0; i < len; i++) {
			dec[i] = buf[i] ^ key[i % 4];
		}

		console.log("fin", fin);
		console.log("rsv", rsv);
		console.log("opc", opc);
		console.log("msk", msk);
		console.log("len", len);
		console.log("key", key);
		console.log("dec", dec);
		console.log("---");

		return {fin, rsv, opc, msk, len, key, dec};
	}
}
