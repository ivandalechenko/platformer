// ===== physics.js =====
const Matter = require('matter-js');
const { Engine, World, Bodies, Body, Events } = Matter;

const engine = Engine.create({
    positionIterations: 6,
    velocityIterations: 4
});
engine.gravity.y = 1;
const world = engine.world;


// настройки для стен и пола с метками
const wallOpts = { isStatic: true, restitution: 0, friction: 0, frictionStatic: 0, label: 'wall' };
const floorOpts = { isStatic: true, restitution: 0, friction: 1, frictionStatic: 1, label: 'floor' };
const worldWidth = 10000
const worldHeight = 1000

const trampolineOpts = { isStatic: true, restitution: 10, friction: 0, frictionStatic: 0, label: 'trampoline' };
const pikeOpts = { isStatic: true, restitution: 0, friction: 0, frictionStatic: 0, label: 'pike' };

const objects = [
    Bodies.rectangle(0 + worldWidth / 2 - 100, 0, worldWidth, 50, floorOpts), // пол
    Bodies.rectangle(worldWidth / 2 + worldWidth / 2 - 100, -worldHeight / 2, 50, worldHeight, wallOpts),  // левая стена
    Bodies.rectangle(-worldWidth / 2 + worldWidth / 2 - 100, -worldHeight / 2, 50, worldHeight, wallOpts),  // левая стена

    Bodies.rectangle(400, 20, 200, 100, trampolineOpts),
    Bodies.rectangle(650, -50, 250, 50, pikeOpts),
];


const spawnPoint = { x: 200, y: -100 }


World.add(world, objects);

const playerCollisionGroup = -1;
const playerBodies = {};

function addPlayer(name, x = spawnPoint.x, y = spawnPoint.y) {
    const body = Bodies.rectangle(x, y, 20, 20, {
        collisionFilter: {
            group: playerCollisionGroup,
        },
        restitution: 0,
        friction: 0.1,
        frictionStatic: 0,
        frictionAir: 0,
        mass: 1,
        label: 'player'
    });
    Body.setInertia(body, Infinity);
    playerBodies[name] = body;
    World.add(world, body);
}

function removePlayer(name) {
    const b = playerBodies[name];
    if (b) {
        World.remove(world, b);
        delete playerBodies[name];
    }
}

function applyControls(name, buttons) {
    const b = playerBodies[name];
    if (!b) return;
    if (buttons.A) Body.setVelocity(b, { x: -5, y: b.velocity.y });
    else if (buttons.D) Body.setVelocity(b, { x: 5, y: b.velocity.y });
}

// прыжок только при контакте с полом (label 'floor')
const grounded = {};
Events.on(engine, 'collisionStart', event => {
    event.pairs.forEach(p => {
        const { bodyA, bodyB } = p;
        Object.entries(playerBodies).forEach(([name, b]) => {
            if ((bodyA === b && ['floor', 'trampoline'].includes(bodyB.label)) || (bodyB === b && ['floor', 'trampoline'].includes(bodyA.label))) {
                grounded[name] = true;
            }

            if ((bodyA === b && bodyB.label === 'trampoline') || (bodyB === b && bodyA.label === 'trampoline')) {
                let player
                if (bodyB.label === 'trampoline') player = bodyA;
                if (bodyA.label === 'trampoline') player = bodyB;
                Body.setVelocity(player, {
                    x: player.velocity.x * (1 + ((Math.random() - .5) / 1.5)),
                    y: Math.max(player.velocity.y * -1.005, -10)   // подберите по вкусу
                });
            }

            if ((bodyA === b && bodyB.label === 'pike') || (bodyB === b && bodyA.label === 'pike')) {
                let player
                if (bodyB.label === 'pike') player = bodyA;
                if (bodyA.label === 'pike') player = bodyB;
                Body.setPosition(player, { x: spawnPoint.x, y: spawnPoint.y });
            }
        });
    });
});

Events.on(engine, 'collisionEnd', event => {
    event.pairs.forEach(p => {
        const { bodyA, bodyB } = p;
        Object.entries(playerBodies).forEach(([name, b]) => {
            if ((bodyA === b && bodyB.label === 'floor') || (bodyB === b && bodyA.label === 'floor')) {
                grounded[name] = false;
            }
        });
    });
});

function jumpPlayer(name) {
    const b = playerBodies[name];
    if (b && grounded[name]) {
        Body.setVelocity(b, { x: b.velocity.x, y: -8 });
        grounded[name] = false;
    }
}

function updatePhysics(delta) {
    Engine.update(engine, delta);
}

function getPlayerState(name) {
    const b = playerBodies[name];
    return b && { x: b.position.x, y: b.position.y, vx: b.velocity.x, vy: b.velocity.y };
}

function getMapState() {
    return objects.map(b => ({
        x: b.position.x,
        y: b.position.y,
        width: b.bounds.max.x - b.bounds.min.x,
        height: b.bounds.max.y - b.bounds.min.y,
        angle: b.angle,
        type: b.label
    }));
}

module.exports = { addPlayer, removePlayer, applyControls, jumpPlayer, updatePhysics, getPlayerState, getMapState };
