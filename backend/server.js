const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Store room states
const rooms = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join a room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
    
    // Initialize room state if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        isPlaying: false,
        currentTime: 0,
        subtitleVisible: false,
        subtitleOffset: 0,
        fontSize: 16
      });
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
