import Map from "../src/map.js";
import {contentType} from "https://deno.land/std@0.177.0/media_types/mod.ts";
import {extname} from "https://deno.land/std@0.177.0/path/mod.ts";
import {Client} from "./Client.js";

let map = new Map();
let clients = new Set();
let http_listener = Deno.listen({port: 12345});
let ws_listener = Deno.listen({port: 54321});

handle_http();
handle_ws();

async function handle_http()
{
    console.log("Game Link http://localhost:12345/");

    for await(let conn of http_listener) {
        handle_http_conn(conn);
    }
}

async function handle_http_conn(conn)
{
	let http_conn = Deno.serveHttp(conn);

	for await(let event of http_conn) {
        let request = event.request;
        let url = new URL(request.url);
        let path = "." + decodeURIComponent(url.pathname);

        if(path === "./") {
            path = "./index.html";
        }

        try {
            let file = await Deno.open(path);
            let stream = file.readable;
            let extension = extname(path);
            let content_type = contentType(extension);
            let headers = new Headers({"Content-Type": content_type});
            let response = new Response(stream, {headers});
            event.respondWith(response);
        }
        catch(error) {
            if(error instanceof Deno.errors.NotFound) {
                let response = new Response("Not Found", {status: 404});
                event.respondWith(response);
            }
        }
	}
}

async function handle_ws()
{
    for await(let conn of ws_listener) {
        handle_ws_conn(conn);
    }
}

async function handle_ws_conn(conn)
{
	let http_conn = Deno.serveHttp(conn);

	for await(let event of http_conn) {
        let request = event.request;
        try {
            let upgrade = Deno.upgradeWebSocket(request);
            let socket = upgrade.socket;
            let response = upgrade.response;
            await event.respondWith(response);
            return await handle_socket(socket);
        }
        catch(e) {}
	}
}

async function handle_socket(socket)
{
    let client = new Client(socket, map);

    clients.add(client);

    clients.forEach(other => {
        if(other !== client) {
            client.send_json({msg: 3, id: other.id});
            other.send_json({msg: 3, id: client.id});
        }
    });

    client.addEventListener("leave", e => {
        clients.delete(client);

        clients.forEach(other => {
            other.send_json({msg: 4, id: client.id});
        });
    });

    client.addEventListener("setblock", e => {
        clients.forEach(other => {
            if(other !== client) {
                other.send_json({msg: 2, ...e});
            }
        });
    });

    client.addEventListener("move", e => {
        clients.forEach(other => {
            if(other !== client) {
                other.send_json({msg: 6, id: client.id, ...e});
            }
        });
    });

    return await new Promise(res => {
        socket.addEventListener("close", res, true);
    });
}