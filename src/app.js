const { createServer } = require("http");
const express = require("express");
const WebSocket = require("ws");
const bodyParser = require("body-parser");

const { port = 80, quiet = false } = require("minimist")(process.argv.slice(2));

const clients = new Set();

const server = createServer();

const api = express();
const wss = new WebSocket.Server({server});

api.use(bodyParser.json());

server.on("request", api);
server.listen(port);

wss.on("connection", socket => {
	clients.add(socket);

	socket.on("close", () => {
		clients.delete(socket);
	});
});

api.post("/notification", (req, res) => {
	console.log("POST /notification", req.body);

	notifyClients(req.body);

	res.end();
});

function notifyClients(body) {
	if(!quiet)
		console.log("Notifying %s client(s)", clients.size);

	for(let client of clients)
		client.send(JSON.stringify(body));
}

function exitOnSignal(signal) {
	process.on(signal, function() {
		console.log("Shutting down.. (%s)", signal);
		
		process.exit(0);
	});
}

exitOnSignal("SIGTERM");
exitOnSignal("SIGINT");
