// ===== gameStore.js =====
import { makeAutoObservable } from 'mobx';
import pingService from './pingService';

class GameStore {
    username = '';
    frames = '[]';
    tiks = '[]';

    constructor() {
        makeAutoObservable(this);
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

    update(data) {
        this.addTik();
        this.snapshots.push({
            timestamp: data.timestamp,
            players: data.players,
            map: JSON.stringify(data.map)
        });

        if (this.snapshots.length > 10) {
            this.snapshots.shift();
        }

        // обновляем средний интервал
        if (this.snapshots.length >= 2) {
            const last = this.snapshots[this.snapshots.length - 1].timestamp;
            const prev = this.snapshots[this.snapshots.length - 2].timestamp;
            this.lastInterval = last - prev;
        }
    }


    getInterpolatedMap() {
        const frames = this.snapshots;
        if (!frames.length) return [];

        // берём map из самого свежего кадра
        return JSON.parse(frames[frames.length - 1].map) || []

    }


    getInterpolatedPlayers() {
        const baseDelay = this.lastInterval || 40;
        const networkDelay = pingService.ping || 60; // можно зафиксировать

        // ограничиваем, чтобы не ушло слишком далеко в прошлое
        const renderDelay = Math.min(100, baseDelay * 1.5 + networkDelay / 2);

        const now = Date.now() - renderDelay;

        const frames = this.snapshots;
        if (frames.length < 2) return {};

        let i = frames.findIndex(f => f.timestamp > now);
        if (i === -1 || i === 0) return frames[frames.length - 1].players;

        const prev = frames[i - 1];
        const next = frames[i];
        const dt = next.timestamp - prev.timestamp || 1;
        const alpha = Math.max(0, Math.min(1, (now - prev.timestamp) / dt));


        const result = {};
        for (const username in next.players) {
            const a = prev.players[username] || next.players[username];
            const b = next.players[username];

            result[username] = {
                x: a.x + (b.x - a.x) * alpha,
                y: a.y + (b.y - a.y) * alpha
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
