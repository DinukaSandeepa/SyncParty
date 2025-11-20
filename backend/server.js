const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());



const server = http.createServer(app);

// Configure allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://sync-party.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean); // Remove undefined values

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Check if the origin is in the allowed list or matches Vercel preview deployments
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

// Store room states
const rooms = new Map();

// Health check endpoint
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
  console.log(`User connected: ${socket.id}`);

  // Join a room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);

    // Get room info
    const roomSockets = io.sockets.adapter.rooms.get(roomId);
    const roomSize = roomSockets ? roomSockets.size : 0;

    console.log(`User ${socket.id} joined room: ${roomId} (${roomSize} users in room)`);

    // Initialize room state if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        isPlaying: false,
        currentTime: 0,
        subtitleVisible: false,
        subtitleOffset: 0,
        fontSize: 16
      });
      console.log(`Created new room state for: ${roomId}`);
    }

    // Send current room state to the newly joined user
    socket.emit('room-state', rooms.get(roomId));

    // Notify others in the room
    socket.to(roomId).emit('user-joined', { userId: socket.id });
  });

  // Play video
  socket.on('play-video', ({ roomId, currentTime }) => {
    console.log(`Play video in room ${roomId} at ${currentTime}s`);

    if (rooms.has(roomId)) {
      const roomState = rooms.get(roomId);
      roomState.isPlaying = true;
      roomState.currentTime = currentTime;
    }

    // Broadcast to all other users in the room
    socket.to(roomId).emit('play-video', { currentTime });
  });

  // Pause video
  socket.on('pause-video', ({ roomId, currentTime }) => {
    console.log(`Pause video in room ${roomId} at ${currentTime}s`);

    if (rooms.has(roomId)) {
      const roomState = rooms.get(roomId);
      roomState.isPlaying = false;
      roomState.currentTime = currentTime;
    }

    // Broadcast to all other users in the room
    socket.to(roomId).emit('pause-video', { currentTime });
  });

  // Seek video
  socket.on('seek-video', ({ roomId, currentTime }) => {
    console.log(`Seek video in room ${roomId} to ${currentTime}s`);

    if (rooms.has(roomId)) {
      const roomState = rooms.get(roomId);
      roomState.currentTime = currentTime;
    }

    // Broadcast to all other users in the room
    socket.to(roomId).emit('seek-video', { currentTime });
  });

  // Subtitle loaded
  socket.on('subtitle-loaded', ({ roomId, fileName, fileSize }) => {
    console.log(`Subtitle loaded in room ${roomId}: ${fileName} (${fileSize} bytes)`);

    // Notify others in the room
    socket.to(roomId).emit('subtitle-loaded', {
      userId: socket.id,
      fileName,
      fileSize
    });
  });

  // Toggle subtitle visibility
  socket.on('subtitle-toggle', ({ roomId, visible }) => {
    console.log(`Subtitle toggle in room ${roomId}: ${visible}`);

    if (rooms.has(roomId)) {
      const roomState = rooms.get(roomId);
      roomState.subtitleVisible = visible;
    }

    // Broadcast to all other users in the room
    socket.to(roomId).emit('subtitle-toggle', { visible });
  });

  // Subtitle offset adjustment
  socket.on('subtitle-offset', ({ roomId, offset }) => {
    console.log(`Subtitle offset in room ${roomId}: ${offset}s`);

    if (rooms.has(roomId)) {
      const roomState = rooms.get(roomId);
      roomState.subtitleOffset = offset;
    }

    // Broadcast to all other users in the room
    socket.to(roomId).emit('subtitle-offset', { offset });
  });

  // Font size adjustment
  socket.on('font-size-change', ({ roomId, fontSize }) => {
    console.log(`Font size change in room ${roomId}: ${fontSize}px`);

    if (rooms.has(roomId)) {
      const roomState = rooms.get(roomId);
      roomState.fontSize = fontSize;
    }

    // Broadcast to all other users in the room
    socket.to(roomId).emit('font-size-change', { fontSize });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
