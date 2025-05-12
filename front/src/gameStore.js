// ===== gameStore.js =====
import { makeAutoObservable } from 'mobx';

class GameStore {
    username = '';

    constructor() {
        makeAutoObservable(this);
    }

    setUsername(name) {
        this.username = name;
    }

    snapshots = []; // массив снапшотов

    update(data) {
        this.snapshots.push({
            timestamp: data.timestamp,
            players: data.players,
            map: JSON.stringify(data.map)
        });

        // оставляем только 10 последних
        if (this.snapshots.length > 10) {
            this.snapshots.shift();
        }
    }

    getInterpolatedMap() {
        const frames = this.snapshots;
        if (!frames.length) return [];

        // берём map из самого свежего кадра
        return JSON.parse(frames[frames.length - 1].map) || []

    }

    getInterpolatedPlayers() {
        const renderDelay = 100;
        const now = Date.now() - renderDelay;

        const frames = this.snapshots;
        if (frames.length < 2) return {};

        // находим пару: prev < now < next
        let i = 1;
        while (i < frames.length && frames[i].timestamp < now) {
            i++;
        }

        const prev = frames[i - 1];
        const next = frames[i] || prev;

        const dt = next.timestamp - prev.timestamp || 1;
        const alpha = Math.min(Math.max((now - prev.timestamp) / dt, 0), 1);

        const result = {};
        for (const username in next.players) {
            const a = prev.players[username] || next.players[username];
            const b = next.players[username];
            result[username] = {
                x: a.x + (b.x - a.x) * alpha,
                y: a.y + (b.y - a.y) * alpha
            };
        }

        // console.log('dt =', dt, 'alpha =', alpha.toFixed(2));
        return result;
    }


}

export default new GameStore();
