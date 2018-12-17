import {Server} from "./server.js";

let server = new Server(process.argv[2] ? parseInt(process.argv[2]) : 12345);
