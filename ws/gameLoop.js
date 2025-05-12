
// ===== gameLoop.js =====
const { connections } = require('./serverController');
const physics = require('./physics');
const { messageToAll } = require('./wsUtils');

const tps = 30;

function gameLoop() {
    setInterval(() => {
        for (const name in connections) {
            physics.applyControls(name, connections[name].buttons);
        }

        physics.updatePhysics(1000 / tps);

        const players = {};
        for (const name in connections) {
            const s = physics.getPlayerState(name);
            if (s) players[name] = s;
        }
        const map = physics.getMapState();

        messageToAll(connections, {
            type: 'update',
            data: { timestamp: Date.now(), players, map }
        });
    }, 1000 / tps);
}

module.exports = { gameLoop };
