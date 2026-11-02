import { useState, useEffect, useCallback } from 'react';
import { socket } from '../socket';

let closeTimer = null;

export function useSocket(token) {
  const [connected, setConnected] = useState(socket.connected);
  const [online, setOnline] = useState([]);
  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((text, type = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  useEffect(() => {
    if (!token) return;

    clearTimeout(closeTimer);
    if (socket.connected && socket.auth?.token !== token) socket.disconnect();
    socket.auth = { token };

    const onConnect = () => setConnected(true);
    const onDisconnect = (reason) => {
      setConnected(false);
      setOnline([]);
      if (reason !== 'io client disconnect') {
        pushToast(`Соединение потеряно (${reason}). Переподключение...`, 'error');
      }
    };
    const onConnectError = (err) => {
      setConnected(false);
      pushToast(`Ошибка подключения: ${err.message}`, 'error');
    };
    const onReconnect = () => pushToast('Соединение восстановлено', 'connect');
    const onPresence = (list) => setOnline(list);
    const onNotification = (n) => pushToast(n.text, n.type);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('presence:list', onPresence);
    socket.on('notification', onNotification);
    socket.io.on('reconnect', onReconnect);

    if (socket.connected) {
      setConnected(true);
      socket.emit('presence:get', setOnline);
    } else {
      socket.connect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('presence:list', onPresence);
      socket.off('notification', onNotification);
      socket.io.off('reconnect', onReconnect);
      setConnected(false);
      setOnline([]);
      closeTimer = setTimeout(() => socket.disconnect(), 200);
    };
  }, [token, pushToast]);

  return { socket, connected, online, toasts, pushToast };
}