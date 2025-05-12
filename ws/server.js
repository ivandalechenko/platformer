const WebSocket = require('ws');
const url = require('url');
const { handleConnection } = require('./serverController');
const { gameLoop } = require('./gameLoop');

const startWebSocketServer = (PORT) => {

    const server = new WebSocket.Server({ port: PORT });

    server.on('connection', (ws, req) => {
        const query = url.parse(req.url, true).query;
        handleConnection(ws, query);
    });

    gameLoop()

    console.log(`WebSocket сервер запущен на порту ${PORT}`);

};

module.exports = { startWebSocketServer };