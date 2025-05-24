// ===== physics.js =====
const Matter = require('matter-js');
// const mapData = require('./map.json');
const mapData = require('./mapMishaV1.json');
const { Engine, World, Bodies, Body, Events } = Matter;

const engine = Engine.create({
    positionIterations: 6,
    velocityIterations: 4
});
engine.gravity.y = 1;
const world = engine.world;


// настройки для стен и пола с метками
const blockTypes = {
    wall: { isStatic: true, restitution: 0, friction: 0, frictionStatic: 0, label: 'wall' },
    floor: { isStatic: true, restitution: 0, friction: 1, frictionStatic: 1, label: 'floor' },
    trampoline: { isStatic: true, restitution: 10, friction: 0, frictionStatic: 0, label: 'trampoline' },
    pike: { isStatic: true, restitution: 0, friction: 0, frictionStatic: 0, label: 'pike' },
}

let objects = []
let spawnPoint = { x: 100, y: 400 }

for (const mapObj of mapData) {
    if (mapObj.type === 'spawnPoint') {
        spawnPoint = { x: mapObj.x, y: mapObj.y }
        continue;
    }


    const opts = blockTypes[mapObj.type];
    if (!opts) continue;

    objects.push(Bodies.rectangle(
        mapObj.x,
        mapObj.y,
        mapObj.w,
        mapObj.h,
        {
            angle: mapObj.angle,
            ...blockTypes[mapObj.type]
        }
    ))
}



World.add(world, objects);

const playerCollisionGroup = -1;
const playerBodies = {};

function addPlayer(name, x = spawnPoint.x, y = spawnPoint.y) {
    console.log(`added ${name}`);

    const body = Bodies.rectangle(x, y, 20, 40, {
        collisionFilter: {
            group: playerCollisionGroup,
        },
        restitution: 0,
        friction: 0.01,
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

    const accel = 1;
    let vx = b.velocity.x;

    if (buttons.A) vx -= accel;
    if (buttons.D) vx += accel;

    // Ограничиваем скорость по оси X
    if (vx > 5) vx = 5;
    if (vx < -5) vx = -5;

    Body.setVelocity(b, { x: vx, y: b.velocity.y });
}


// прыжок только при контакте с полом (label 'floor')
const grounded = {};
Events.on(engine, 'collisionStart', event => {
    event.pairs.forEach(p => {
        const { bodyA, bodyB, collision } = p;
        Object.entries(playerBodies).forEach(([name, b]) => {
            if ((bodyA === b && ['floor', 'trampoline'].includes(bodyB.label)) || (bodyB === b && ['floor', 'trampoline'].includes(bodyA.label))) {
                grounded[name] = true;
            }

            if ((bodyA === b && bodyB.label === 'trampoline') || (bodyB === b && bodyA.label === 'trampoline')) {
                // let player
                // if (bodyB.label === 'trampoline') player = bodyA;
                // if (bodyA.label === 'trampoline') player = bodyB;
                // Body.setVelocity(player, {
                //     x: player.velocity.x * (1 + ((Math.random() - .5) / 1.5)),
                //     y: Math.max(player.velocity.y * -1.005, -10)   // подберите по вкусу
                // });

                const player = bodyA.label === 'player' ? bodyA : bodyB;

                const normal = collision.normal;

                const dot = player.velocity.x * normal.x + player.velocity.y * normal.y;
                let vx = player.velocity.x - 2 * dot * normal.x;
                let vy = player.velocity.y - 2 * dot * normal.y;

                const mag = Math.hypot(vx, vy);
                if (mag > 10) {
                    vx = (vx / mag) * 10;
                    vy = (vy / mag) * 10;
                }

                Body.setVelocity(player, { x: vx, y: vy });
            }

            if ((bodyA === b && bodyB.label === 'pike') || (bodyB === b && bodyA.label === 'pike')) {
                let player
                if (bodyB.label === 'pike') player = bodyA;
                if (bodyA.label === 'pike') player = bodyB;
                Body.setPosition(player, { x: spawnPoint.x, y: spawnPoint.y });
                Body.setVelocity(player, { x: 0, y: 0 });
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
    return b && { x: Math.round(b.position.x), y: Math.round(b.position.y) };
}

function getMapState() {
    const objs = objects.map(b => {
        const v = b.vertices;

        // считаем реальные ширину и высоту по вершинам
        const w = Math.hypot(v[1].x - v[0].x, v[1].y - v[0].y);
        const h = Math.hypot(v[2].x - v[1].x, v[2].y - v[1].y);

        // пересчёт центра в левый верхний угол с учётом поворота
        const angle = b.angle;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const dx = -(w / 2);
        const dy = -(h / 2);
        const offsetX = dx * cos - dy * sin;
        const offsetY = dx * sin + dy * cos;

        return {
            x: b.position.x + offsetX,
            y: b.position.y + offsetY,
            w,
            h,
            rotation: angle * (180 / Math.PI),
            type: b.label
        };
    });
    // console.log(objects);

    return objs
}

module.exports = { addPlayer, removePlayer, applyControls, jumpPlayer, updatePhysics, getPlayerState, getMapState };
