const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const app = express();
app.use(cors());
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:3000',
  'https://sync-party.vercel.app',
  'https://sync.dinukasandeepa.com',
  process.env.FRONTEND_URL
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

const rooms = new Map();
const roomUsers = new Map(); // Track users in each room

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    rooms: rooms.size,
    connections: io.engine.clientsCount
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'SyncParty Socket.IO Server',
    version: '1.0.0'
  });
});

io.on('connection', (socket) => {

  socket.on('join-room', (roomId, username, userInfo = {}) => {
    socket.join(roomId);
    socket.username = username;
    socket.userInfo = userInfo;
    socket.currentRoom = roomId;

    const roomSockets = io.sockets.adapter.rooms.get(roomId);
    const roomSize = roomSockets ? roomSockets.size : 0;

    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        isPlaying: false,
        currentTime: 0,
        subtitleVisible: false,
        subtitleOffset: 0,
        fontSize: 16,
        youtubeUrl: null
      });
    }

    // Initialize room users if not exists
    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, new Map());
    }

    // Add user to room users
    const userData = {
      visibleId: socket.id,
      oderId: userInfo.oderId || socket.id,
      username: username || `User ${socket.id.substring(0, 8)}`,
      imageUrl: userInfo.imageUrl || null,
      joinedAt: Date.now()
    };
    roomUsers.get(roomId).set(socket.id, userData);

    // Send room state to the joining user
    socket.emit('room-state', rooms.get(roomId));

    // Send current user list to the joining user
    const userList = Array.from(roomUsers.get(roomId).values());
    socket.emit('room-users', userList);

    // Notify others about the new user and send updated user list
    socket.to(roomId).emit('user-joined', { oderId: socket.id, oderId: userInfo.oderId, username, imageUrl: userInfo.imageUrl });
    socket.to(roomId).emit('room-users', userList);
  });

  socket.on('youtube-url-change', ({ roomId, youtubeUrl }) => {
    if (rooms.has(roomId)) {
      const roomState = rooms.get(roomId);
      roomState.youtubeUrl = youtubeUrl;
    }
    socket.to(roomId).emit('youtube-url-change', { youtubeUrl, username: socket.username });
  });

  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);

    if (roomUsers.has(roomId)) {
      const userData = roomUsers.get(roomId).get(socket.id);
      roomUsers.get(roomId).delete(socket.id);

      // Notify others
      socket.to(roomId).emit('user-left', { oderId: socket.id, oderId: userData?.oderId, username: socket.username });

      // Send updated user list
      if (roomUsers.get(roomId).size === 0) {
        roomUsers.delete(roomId);
        rooms.delete(roomId);
      } else {
        const userList = Array.from(roomUsers.get(roomId).values());
        socket.to(roomId).emit('room-users', userList);
      }
    }

    socket.currentRoom = null;
  });

  socket.on('play-video', ({ roomId, currentTime }) => {

    if (rooms.has(roomId)) {
      const roomState = rooms.get(roomId);
      roomState.isPlaying = true;
      roomState.currentTime = currentTime;
    }
    socket.to(roomId).emit('play-video', { currentTime, username: socket.username });
  });
  socket.on('pause-video', ({ roomId, currentTime }) => {

    if (rooms.has(roomId)) {
      const roomState = rooms.get(roomId);
      roomState.isPlaying = false;
      roomState.currentTime = currentTime;
    }
    socket.to(roomId).emit('pause-video', { currentTime, username: socket.username });
  });
  socket.on('seek-video', ({ roomId, currentTime }) => {

    if (rooms.has(roomId)) {
      const roomState = rooms.get(roomId);
      roomState.currentTime = currentTime;
    }
    socket.to(roomId).emit('seek-video', { currentTime, username: socket.username });
  });
  socket.on('subtitle-loaded', ({ roomId, fileName, fileSize }) => {

    socket.to(roomId).emit('subtitle-loaded', {
      userId: socket.id,
      fileName,
      fileSize
    });
  });
  socket.on('subtitle-toggle', ({ roomId, visible }) => {

    if (rooms.has(roomId)) {
      const roomState = rooms.get(roomId);
      roomState.subtitleVisible = visible;
    }
    socket.to(roomId).emit('subtitle-toggle', { visible });
  });
  socket.on('subtitle-offset', ({ roomId, offset }) => {

    if (rooms.has(roomId)) {
      const roomState = rooms.get(roomId);
      roomState.subtitleOffset = offset;
    }
    socket.to(roomId).emit('subtitle-offset', { offset });
  });
  socket.on('font-size-change', ({ roomId, fontSize }) => {

    if (rooms.has(roomId)) {
      const roomState = rooms.get(roomId);
      roomState.fontSize = fontSize;
    }
    socket.to(roomId).emit('font-size-change', { fontSize });
  });
  socket.on('disconnect', () => {
    // Remove user from room and notify others
    if (socket.currentRoom && roomUsers.has(socket.currentRoom)) {
      const roomId = socket.currentRoom;
      const userData = roomUsers.get(roomId).get(socket.id);
      roomUsers.get(roomId).delete(socket.id);

      // Clean up empty rooms
      if (roomUsers.get(roomId).size === 0) {
        roomUsers.delete(roomId);
        rooms.delete(roomId);
      } else {
        // Notify remaining users
        const userList = Array.from(roomUsers.get(roomId).values());
        socket.to(roomId).emit('user-left', { oderId: socket.id, oderId: userData?.oderId, username: socket.username });
        socket.to(roomId).emit('room-users', userList);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
