let next_id = 0;

export class Client extends EventTarget
{
    constructor(socket, map)
    {
        super();

        this.socket = socket;
        this.map = map;
        this.id = create_id();

        socket.addEventListener("message", e => {
            let message = JSON.parse(e.data);
            this.handle_message(message);
        });

        socket.addEventListener("close", e => {
            this.dispatchEvent(custom_event("leave"));
        });
    }

    async handle_message(message)
    {
        let msg = message.msg;

        if(msg === 0) {
            let chunk = await this.get_chunk(message.x, message.y);
            let buf = new Uint8Array(3 * 8 + chunk.data.byteLength);
            let f64 = new Float64Array(buf.buffer);

            f64[0] = 1;
            f64[1] = message.x;
            f64[2] = message.y;
            buf.set(chunk.data, 3 * 8);
            this.socket.send(buf);
        }
        else if(msg === 2) {
            let x = message.x;
            let y = message.y;
            let z = message.z;
            let block = message.block;
            let chunk = this.map.setBlock(x, y, z, block);
            this.dispatchEvent(custom_event("setblock", {x,y,z,block}));

            Deno.writeFile(
                "./save/chunk_" + chunk.cx + "_" + chunk.cy,
                chunk.data
            );
        }
        else if(msg === 5) {
            let x = message.x;
            let y = message.y;
            let z = message.z;
            let rx = message.rx;
            let rz = message.rz;
            this.dispatchEvent(custom_event("move", {x,y,z,rx,rz}));
        }
    }

    async get_chunk(cx, cy)
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

    send_json(msg)
    {
        this.socket.send(JSON.stringify(msg));
    }
}

function create_id()
{
    return next_id ++;
}

function custom_event(name, data)
{
    let e = new CustomEvent(name);
    Object.assign(e, data);
    return e;
}