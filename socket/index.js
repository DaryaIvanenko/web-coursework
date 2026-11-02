const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');
const { Report, Message } = require('../models');

const GENERAL_ROOM = 'general';
const REPORT_ROOM = /^report:(\d+)$/;
const HISTORY_LIMIT = 50;
const MAX_TEXT_LENGTH = 500;

const isAdminUser = (user) => String(user.role).toLowerCase() === 'admin';

const canJoinRoom = async (user, room) => {
  if (room === GENERAL_ROOM) return true;
  const match = REPORT_ROOM.exec(room);
  if (!match) return false;
  const report = await Report.findByPk(Number(match[1]));
  if (!report) return false;
  return isAdminUser(user) || report.userId === user.id;
};

const initSocket = (httpServer) => {
  const origins = [
    /^http:\/\/(localhost|127\.0\.0\.1):\d+$/,
    process.env.CLIENT_URL
  ].filter(Boolean);

  const io = new Server(httpServer, { cors: { origin: origins } });
  const online = new Map();

  const onlineUsers = () => {
    const unique = new Map();
    for (const u of online.values()) unique.set(u.id, u);
    return [...unique.values()];
  };

  const emitRoomMembers = async (room) => {
    const sockets = await io.in(room).fetchSockets();
    const unique = new Map();
    for (const s of sockets) unique.set(s.data.user.id, s.data.user.email);
    io.to(room).emit('room:members', {
      room,
      users: [...unique.values()]
    });
  };

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Токен не передан'));
    try {
      socket.user = jwt.verify(token, JWT_SECRET);
      socket.data.user = { id: socket.user.id, email: socket.user.email };
      next();
    } catch (err) {
      next(new Error('Недействительный токен'));
    }
  });

  io.on('connection', (socket) => {
    const { id, email } = socket.user;
    console.log(`🔌 Подключился: ${email} (${socket.id})`);

    online.set(socket.id, { id, email });
    socket.broadcast.emit('notification', {
      type: 'connect',
      text: `${email} подключился`,
      at: Date.now()
    });
    io.emit('presence:list', onlineUsers());

    socket.on('presence:get', (ack) => {
      if (typeof ack === 'function') ack(onlineUsers());
    });

    socket.on('room:join', async (room, ack) => {
      const reply = typeof ack === 'function' ? ack : () => {};
      try {
        if (typeof room !== 'string' || !(await canJoinRoom(socket.user, room))) {
          return reply({ ok: false, error: 'Нет доступа к комнате' });
        }
        socket.join(room);
        const rows = await Message.findAll({
          where: { room },
          order: [['createdAt', 'DESC']],
          limit: HISTORY_LIMIT
        });
        reply({ ok: true, messages: rows.reverse().map((m) => m.toJSON()) });
        await emitRoomMembers(room);
      } catch (error) {
        console.error('❌ room:join:', error);
        reply({ ok: false, error: 'Ошибка сервера' });
      }
    });

    socket.on('room:leave', async (room) => {
      if (typeof room !== 'string' || !socket.rooms.has(room)) return;
      socket.leave(room);
      await emitRoomMembers(room);
    });

    socket.on('chat:message', async (payload, ack) => {
      const reply = typeof ack === 'function' ? ack : () => {};
      try {
        const room = payload?.room;
        const text = String(payload?.text ?? '').trim();

        if (typeof room !== 'string' || !socket.rooms.has(room)) {
          return reply({ ok: false, error: 'Сначала войдите в комнату' });
        }
        if (!text) return reply({ ok: false, error: 'Пустое сообщение' });
        if (text.length > MAX_TEXT_LENGTH) {
          return reply({ ok: false, error: `Максимум ${MAX_TEXT_LENGTH} символов` });
        }

        const saved = await Message.create({ room, text, userId: id, userEmail: email });
        const message = saved.toJSON();
        io.to(room).emit('chat:message', message);
        reply({ ok: true, message });
      } catch (error) {
        console.error('❌ chat:message:', error);
        reply({ ok: false, error: 'Не удалось отправить сообщение' });
      }
    });

    socket.on('disconnecting', () => {
      socket.data.leftRooms = [...socket.rooms].filter(
        (room) => room === GENERAL_ROOM || REPORT_ROOM.test(room)
      );
    });

    socket.on('disconnect', async (reason) => {
      console.log(`🔌 Отключился: ${email} (${reason})`);
      online.delete(socket.id);
      io.emit('notification', {
        type: 'disconnect',
        text: `${email} отключился`,
        at: Date.now()
      });
      io.emit('presence:list', onlineUsers());
      for (const room of socket.data.leftRooms || []) {
        await emitRoomMembers(room);
      }
    });
  });

  return io;
};

module.exports = { initSocket };