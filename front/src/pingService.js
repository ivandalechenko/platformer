import { makeAutoObservable } from "mobx";

class PingService {
    ping = 100;
    socket = null;

    constructor() {
        makeAutoObservable(this);
    }

    init(socket) {
        console.log('try to init');

        if (!socket) return
        this.socket = socket;
        console.log('init');

        socket.addEventListener("message", (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === "pong" && this._lastPingSentAt) {
                    const now = Date.now();
                    this.ping = now - this._lastPingSentAt;
                }
            } catch (e) { }
        });

        setInterval(() => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this._lastPingSentAt = Date.now();
                this.socket.send(JSON.stringify({ type: "ping" }));
            }
        }, 2000);
    }
}

const pingService = new PingService();
export default pingService;
