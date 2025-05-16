
// ===== serverController.js =====
const { addPlayer, removePlayer, applyControls, jumpPlayer, getPlayerState, getMapState } = require('./physics');
const { handlePlayerDisconnect } = require('./playerService');
const { messageToAll, messageToUser } = require('./wsUtils');

const connections = {};
const codeMap = { KeyA: 'A', KeyD: 'D' };

function handleConnection(ws, query) {
    const name = query.username;
    if (!name) { ws.close(1008, 'username required'); return; }

    connections[name] = { ws, buttons: { A: false, D: false } };
    addPlayer(name);

    // Инициализационные данные
    const players = {};
    for (const name in connections) {
        const s = getPlayerState(name);
        if (s) players[name] = s;
    }
    const map = getMapState();
    const now = Date.now();
    messageToUser(ws, {
        type: 'initData',
        data: { timestamp: now, players, map }
    });


    ws.on('message', msg => {
        const { type, value } = JSON.parse(msg);
        if (type === 'button') {
            if (value.button === 'Space' && value.status) {
                jumpPlayer(name);
            }
            const k = codeMap[value.button];
            if (k != null) connections[name].buttons[k] = value.status;
        }

        if (type === 'ping') {
            ws.send(JSON.stringify({ type: "pong" }));
        }

    });

    ws.on('close', () => {
        removePlayer(name);
        handlePlayerDisconnect(name);
        delete connections[name];
    });
}

module.exports = { handleConnection, connections };
