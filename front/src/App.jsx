import { useEffect, useRef, useState } from "react";
import useWebSocketWithReconnect from "./Socket";
import Scene from "./Scene";
import pingService from './pingService';

import gameStore from "./gameStore";

export default () => {

  const [username, setusername] = useState('');
  const pressedKeys = useRef({}); // храним состояние нажатий

  useEffect(() => {
    let un = localStorage.getItem('username')
    if (!un) {
      un = `user${Math.round(Math.random() * 1000)}`
    }
    gameStore.username = un
    setusername(un)
  }, [])

  const socketRef = useWebSocketWithReconnect(
    username,
    10,
    1000,
    (event) => {
      try {
        const messageData = JSON.parse(event.data);

        if (messageData.type === 'update') {
          gameStore.update(messageData.data)
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

  const sendMessage = (type, value) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const message = { type, value };
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not open or does not exist.');
    }
  };


  useEffect(() => {

    // pingService.init(socketRef.current ? socketRef.current : '');

    const keys = ['Space', 'KeyA', 'KeyD'];

    const handleKeyDown = (e) => {
      const code = e.code;
      if (keys.includes(code) && !pressedKeys.current[code]) {
        pressedKeys.current[code] = true;
        sendMessage('button', { button: code, status: true });
      }
    };

    const handleKeyUp = (e) => {
      const code = e.code;
      if (keys.includes(code)) {
        pressedKeys.current[code] = false;
        sendMessage('button', { button: code, status: false });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [socketRef]);

  return (
    <div className='App'>
      <Scene />
    </div>
  )
}
