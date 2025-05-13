import { useEffect, useRef } from "react";
import pingService from "./pingService";

const WEBSOCKET_URL = ((import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8080')).toString()

const useWebSocketWithReconnect = (
    username,
    maxReconnectAttempts = 10,
    reconnectInterval = 3000,
    onMessage,
) => {
    const socketRef = useRef(null);
    const reconnectAttempts = useRef(0);

    const connect = () => {
        socketRef.current = new WebSocket(`${WEBSOCKET_URL}?username=${username}`);

        socketRef.current.onopen = () => {
            console.log("WebSocket connected");
            reconnectAttempts.current = 0; // Сбрасываем попытки реконнекта
            // if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            //     const message = { type: 'join', game: gameStore.currentGameId, user: userStore.tgId };
            //     socketRef.current.send(JSON.stringify(message));
            // }
            pingService.init(socketRef.current)
        };

        socketRef.current.onmessage = (event) => {
            if (onMessage) {
                onMessage(event); // Вызываем переданный обработчик
            }
        };
        socketRef.current.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        socketRef.current.onclose = () => {
            console.warn("WebSocket closed");

            // Если не превышено максимальное количество попыток, пробуем подключиться снова
            if (reconnectAttempts.current < maxReconnectAttempts) {
                reconnectAttempts.current += 1;
                console.log(`Reconnecting... Attempt ${reconnectAttempts.current}`);
                setTimeout(connect, reconnectInterval);
            } else {
                console.error("Max reconnect attempts reached");
            }
        };
    };

    useEffect(() => {
        if (username) {
            connect();

            return () => {
                if (socketRef.current) {
                    socketRef.current.onclose = null; // Отключаем автоматический реконнект при размонтировании
                    socketRef.current.close();
                }
            };
        }
    }, [username, maxReconnectAttempts, reconnectInterval]);

    return socketRef;
};

export default useWebSocketWithReconnect;
