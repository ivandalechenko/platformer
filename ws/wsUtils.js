let prevSnapshot = {};


const sendUpdate = (connections, message) => {
    const currentPlayers = message.data.players;
    const changes = [];

    for (const name in currentPlayers) {
        const curr = currentPlayers[name];
        const prev = prevSnapshot[name];

        if (!prev || curr.x !== prev.x || curr.y !== prev.y) {
            changes.push([name, curr.x, curr.y]); // абсолютные координаты
        }
    }

    for (const name in prevSnapshot) {
        if (!currentPlayers[name]) {
            changes.push([name, null]); // удалён
        }
    }

    if (changes.length > 0) {
        messageToAll(connections, {
            type: 'update',
            timestamp: message.data.timestamp,
            data: changes
        });
    }

    prevSnapshot = currentPlayers;
};


const messageToAll = (connections, message) => {
    for (const username in connections) {
        const ws = connections[username].ws;
        // console.log(username);

        if (ws.readyState === 1) {
            // console.log('send');
            ws.send(JSON.stringify(message));
        }
    }
};

const messageToUser = (ws, message) => {
    if (ws.readyState === 1) {
        // console.log('send');
        ws.send(JSON.stringify(message));
    }
};

module.exports = { messageToAll, sendUpdate, messageToUser };
