
// ===== gameLoop.js =====
const { connections } = require('./serverController');
const physics = require('./physics');
const { messageToAll } = require('./wsUtils');

let tiks = []

const addTik = () => {
    const now = Date.now();
    tiks.push(now);
    tiks = tiks.filter(t => now - t <= 1000);
}

function gameLoop() {
    const tps = 30;
    const tickInterval = 1000 / tps;
    let lastTick = Date.now();

    function loop() {
        const now = Date.now();
        const delta = now - lastTick;

        if (delta >= tickInterval) {
            lastTick = now;

            addTik();
            // console.log(`tiks: ${tiks.length}`, 'tick', now, 'Δ', delta);

            for (const name in connections) {
                physics.applyControls(name, connections[name].buttons);
            }

            physics.updatePhysics(tickInterval);

            const players = {};
            for (const name in connections) {
                const s = physics.getPlayerState(name);
                if (s) players[name] = s;
            }

            const map = physics.getMapState();

            messageToAll(connections, {
                type: 'update',
                data: { timestamp: now, players, map }
            });
        }

        setImmediate(loop);
    }

    loop();
}

module.exports = { gameLoop };
