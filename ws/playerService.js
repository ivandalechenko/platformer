const { gameState, connections } = require("./state");

const handlePlayerDisconnect = (username) => {
    delete connections[username];
    delete gameState.players[username];
}

module.exports = {
    handlePlayerDisconnect
};
