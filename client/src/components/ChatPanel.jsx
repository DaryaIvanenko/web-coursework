import React, { useState, useEffect, useRef } from 'react';

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

export default function ChatPanel({ socket, connected, user, online, chat, onOpen, onClose, onGeneral }) {
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [joining, setJoining] = useState(false);

  const endRef = useRef(null);

  useEffect(() => {
    if (!chat.open || !connected) return;
    const room = chat.room;

    setMessages([]);
    setMembers([]);
    setError('');
    setJoining(true);

    const onMessage = (m) => {
      if (m.room !== room) return;
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
    };
    const onMembers = (p) => {
      if (p.room === room) setMembers(p.users);
    };
    socket.on('chat:message', onMessage);
    socket.on('room:members', onMembers);

    socket.timeout(5000).emit('room:join', room, (err, res) => {
      setJoining(false);
      if (err) return setError('Сервер не ответил');
      if (!res.ok) return setError(res.error);
      setMessages((prev) => {
        const ids = new Set(res.messages.map((m) => m.id));
        return [...res.messages, ...prev.filter((m) => !ids.has(m.id))];
      });
    });

    return () => {
      socket.off('chat:message', onMessage);
      socket.off('room:members', onMembers);
      if (socket.connected) socket.emit('room:leave', room);
    };
  }, [socket, connected, chat.open, chat.room]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chat.open]);

  const handleSend = (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || sending || !connected) return;

    setSending(true);
    setError('');
    socket.timeout(5000).emit('chat:message', { room: chat.room, text: value }, (err, res) => {
      setSending(false);
      if (err) return setError('Сервер не ответил, попробуйте ещё раз');
      if (!res.ok) return setError(res.error);
      setText('');
    });
  };

  const dot = (
    <span
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: connected ? '#28a745' : '#dc3545',
        marginRight: 6,
      }}
    />
  );

  if (!chat.open) {
    return (
      <button
        onClick={onOpen}
        style={{
          position: 'fixed',
          right: 20,
          bottom: 20,
          padding: '12px 18px',
          background: '#6c63ff',
          color: '#fff',
          border: 'none',
          borderRadius: 24,
          cursor: 'pointer',
          fontSize: 15,
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          zIndex: 9000,
        }}
      >
        {dot}💬 Чат · онлайн: {online.length}
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        right: 20,
        bottom: 20,
        width: 340,
        height: 480,
        background: '#fff',
        border: '1px solid #ddd',
        borderRadius: 10,
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9000,
        fontFamily: 'Arial, sans-serif',
        color: '#333',
        textAlign: 'left',
      }}
    >
      <div style={{ background: '#6c63ff', color: '#fff', padding: '10px 12px', borderRadius: '10px 10px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 'bold', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {dot}{chat.title}
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}>
          ✕
        </button>
      </div>

      {chat.room !== 'general' && (
        <button onClick={onGeneral} style={{ border: 'none', borderBottom: '1px solid #eee', background: '#f8f9fa', padding: '6px', cursor: 'pointer', fontSize: 13 }}>
          ← В общий чат
        </button>
      )}

      <div style={{ fontSize: 12, color: '#666', padding: '6px 12px', borderBottom: '1px solid #eee' }}>
        <div>В комнате: {members.length ? members.join(', ') : '—'}</div>
        <div>Онлайн: {online.length ? online.map((u) => u.email).join(', ') : '—'}</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, background: '#fafafa' }}>
        {joining && <p style={{ color: '#888', fontSize: 13 }}>Загрузка истории...</p>}
        {!joining && messages.length === 0 && !error && (
          <p style={{ color: '#888', fontSize: 13 }}>Сообщений пока нет</p>
        )}
        {messages.map((m) => {
          const mine = m.userId === user.id;
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
              <div
                style={{
                  maxWidth: '80%',
                  padding: '6px 10px',
                  borderRadius: 8,
                  background: mine ? '#6c63ff' : '#e9ecef',
                  color: mine ? '#fff' : '#333',
                  fontSize: 14,
                  wordBreak: 'break-word',
                }}
              >
                {!mine && <div style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 2 }}>{m.userEmail}</div>}
                <div>{m.text}</div>
                <div style={{ fontSize: 10, opacity: 0.7, textAlign: 'right', marginTop: 2 }}>{formatTime(m.createdAt)}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {error && <div style={{ fontSize: 12, color: '#dc3545', padding: '0 12px 4px' }}>{error}</div>}
      {!connected && (
        <div style={{ fontSize: 12, color: '#dc3545', padding: '0 12px 4px' }}>
          Нет соединения с сервером. Переподключение...
        </div>
      )}

      <form onSubmit={handleSend} style={{ display: 'flex', gap: 6, padding: 10, borderTop: '1px solid #eee' }}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={!connected || joining}
          maxLength={500}
          placeholder="Введите сообщение..."
          style={{ flex: 1, padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
        />
        <button
          type="submit"
          disabled={!connected || joining || sending || !text.trim()}
          style={{ padding: '8px 12px', background: '#28a745', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          {sending ? '...' : '➤'}
        </button>
      </form>
    </div>
  );
}
