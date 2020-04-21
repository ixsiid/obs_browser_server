const port = 10180;

const express = require('express');
const app = express();
const http = require('http');
const WebSocketServer = require('ws').Server;

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

_v = text => console.error(text);

const functions = {
	regist: (connection, id) => {
		if (!('index' in connection)) connection.index = connection.id;
		connection.id = id;
	},
};

const connections = [];
let id = 0;
wss.on('connection', ws => {
	const connection = { id: id++, socket: ws };
	connections.push(connection);
	ws.on('close', () => {
		_v(`Close connection ${connection.id}`);
		connections.splice(connections.findIndex(x => x == connection), 1);
	});
	ws.on('message', message => {
		_v(`Message from ${connection.id}`);
		_v(message);
		try {
			message = JSON.parse(message);
			functions[message.function](connection, message.query);
		} catch (e) {
			_v('failed');
		}
	});
});


app.use(express.json());
app.post('/v1/post/*', (req, res) => {
	_v('post');
	const target = req.url.match(/\/post\/(.*?)$/)[1];
	connections.filter(x => target == x.id).forEach(x => x.socket.send(JSON.stringify(req.body)));
	_v('posted');
	res.json({ success: true });
});

app.get('/v1/list', (req, res) => {
	console.log('list');
	res.json(connections);
});


app.use('/v1/get/*', express.static('get.html'));
app.use('/public', express.static('public'));

app.all('*', (req, res) => {
	console.log(req.url);
	res.status(500).send({ success: false });
});


server.listen(port, () => console.log(`start to listen by port ${port}`));

