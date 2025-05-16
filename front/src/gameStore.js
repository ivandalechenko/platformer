// ===== gameStore.js =====
import { makeAutoObservable } from 'mobx';
import pingService from './pingService';

class GameStore {
    username = '';
    frames = '[]';
    tiks = '[]';
    tickDelta = 0;
    renderDelay = 0;
    smoothedPing = 60;
    players = {};
    map = '[]';

    constructor() {
        // makeAutoObservable(this);
        makeAutoObservable(this, {}, { autoBind: true, deep: true, enforceActions: 'never' });
    }

    addFrame() {
        const now = Date.now();
        let framesArray = JSON.parse(this.frames)
        framesArray.push(now);
        this.frames = JSON.stringify(framesArray.filter(t => now - t <= 1000));
    }

    addTik() {
        const now = Date.now();
        let tiksArray = JSON.parse(this.tiks)
        tiksArray.push(now);
        this.tiks = JSON.stringify(tiksArray.filter(t => now - t <= 1000));
    }

    setUsername(name) {
        this.username = name;
    }

    snapshots = []; // массив снапшотов

    updateMap(data) {
        this.map = JSON.stringify(data.map)
        console.log(this.map);
    }

    addSnapshot(data) {
        console.log(`ADDED SNAPSHOT`);

        console.log(data);

        this.addTik();

        const serverTimestamp = data.timestamp;
        const newPing = pingService.ping || 60;
        this.smoothedPing = this.smoothedPing * 0.9 + newPing * 0.1;

        // если снапшоты пустые или пришедший снапшот новее последнего — добавляем
        const lastSnapshot = this.snapshots[this.snapshots.length - 1];
        if (!lastSnapshot || serverTimestamp > lastSnapshot.timestamp) {
            this.snapshots.push({
                timestamp: serverTimestamp,
                players: data.players,
            });

            if (this.snapshots.length > 20) {
                this.snapshots.shift();
            }

            if (this.snapshots.length >= 2) {
                const last = this.snapshots[this.snapshots.length - 1].timestamp;
                const prev = this.snapshots[this.snapshots.length - 2].timestamp;
                this.tickDelta = last - prev;
            }
        }
    }

    update(data, ts) {
        const prevSnapshot = JSON.parse(JSON.stringify(this.snapshots[this.snapshots.length - 1]))

        for (const player of data) {
            prevSnapshot.players[player[0]].x = +player[1]
            prevSnapshot.players[player[0]].y = +player[2]
        }

        const newSnapshot = {
            timestamp: ts,
            players: prevSnapshot.players,
        }

        this.addSnapshot(newSnapshot)
    }




    // getInterpolatedMap() {
    //     const frames = this.snapshots;
    //     if (!frames.length) return [];

    //     // берём map из самого свежего кадра
    //     return JSON.parse(frames[frames.length - 1].map) || []

    // }

    getInterpolatedPlayers() {
        const baseDelay = this.tickDelta || 40;
        const networkDelay = this.smoothedPing;

        this.renderDelay = Math.min(80, baseDelay * 1.25 + networkDelay / 2);
        const now = Date.now() - this.renderDelay;

        const frames = this.snapshots;
        if (frames.length < 2) {
            return {};
        }
        // if (frames.length < 2 || now < frames[0].timestamp) {
        //     return {};
        // }

        const i = frames.findIndex(f => f.timestamp > now);

        const lerp = (a, b, t) => a + (b - a) * t;

        // fallback + экстраполяция
        if ((i === -1 || i === 0) && frames.length >= 2) {
            const prev = frames[frames.length - 2];
            const next = frames[frames.length - 1];
            const dt = next.timestamp - prev.timestamp || 1;
            const alpha = Math.max(0, Math.min(1.2, (now - prev.timestamp) / dt));

            const result = {};
            for (const username in next.players) {
                const a = prev.players[username] || next.players[username];
                const b = next.players[username];

                result[username] = {
                    x: lerp(a.x, b.x, alpha),
                    y: lerp(a.y, b.y, alpha),
                    extrapolated: now > next.timestamp
                };
            }

            // console.log(result);
            return result;
        }

        // обычная интерполяция
        const prev = frames[i - 1];
        const next = frames[i];
        const dt = next.timestamp - prev.timestamp || 1;
        const alpha = Math.max(0, Math.min(1, (now - prev.timestamp) / dt));

        const result = {};
        for (const username in next.players) {
            const a = prev.players[username] || next.players[username];
            const b = next.players[username];

            result[username] = {
                x: lerp(a.x, b.x, alpha),
                y: lerp(a.y, b.y, alpha),
                extrapolated: false
            };
        }

        return result;
    }






    getLastPlayers() {
        const { snapshots } = this;
        return snapshots.length
            ? snapshots[snapshots.length - 1].players
            : {};
    }


}

export default new GameStore();
