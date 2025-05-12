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

module.exports = { messageToAll };
