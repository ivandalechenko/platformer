const { connections } = require('./serverController');
const physics = require('./physics');
const { sendUpdate } = require('./wsUtils');

let tiks = []

const addTik = () => {
    const now = Date.now();
    tiks.push(now);
    tiks = tiks.filter(t => now - t <= 1000);
}

let ticker = true

function gameLoop() {
    const tps = 40;
    const tickInterval = 1000 / tps;
    let lastTick = Date.now();

    function loop() {
        const now = Date.now();
        const delta = now - lastTick;

        if (delta >= tickInterval) {
            lastTick = now;

            addTik();

            for (const name in connections) {
                physics.applyControls(name, connections[name].buttons);
            }

            const physicsStart = performance.now();
            physics.updatePhysics(tickInterval);
            const physicsEnd = performance.now();
            const physicsDuration = physicsEnd - physicsStart;

            const players = {};
            let playersCount = 0
            for (const name in connections) {
                const s = physics.getPlayerState(name);
                if (s) {
                    players[name] = s;
                    playersCount += 1
                }
            }

            const map = physics.getMapState();

            const sendStart = performance.now();
            if (!ticker) sendUpdate(connections, {
                data: { timestamp: now, players, map }
            });
            ticker = !ticker
            const sendEnd = performance.now();
            const sendDuration = sendEnd - sendStart;


            // console.log(`players: ${playersCount} kef: ${(+sendDuration.toFixed(2) / +physicsDuration.toFixed(2)).toFixed(2)} physics: ${physicsDuration.toFixed(2)}ms, send: ${sendDuration.toFixed(2)}ms`);
        }

        setImmediate(loop);
    }

    loop();
}

module.exports = { gameLoop };