'use client';

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export default function Home() {
  // State management
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState('');
  const [isInRoom, setIsInRoom] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [subtitleFile, setSubtitleFile] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [subtitleOffset, setSubtitleOffset] = useState(0);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const [statusLog, setStatusLog] = useState([]);
  const [showControls, setShowControls] = useState(true);
  
  // Refs
  const videoRef = useRef(null);
  const trackRef = useRef(null);
  const isReceivingUpdate = useRef(false);

  // Add status message to log
  const addStatus = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setStatusLog(prev => [...prev.slice(-9), `[${timestamp}] ${message}`]);
  };

  // Initialize socket connection
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    const newSocket = io(socketUrl);
    
    newSocket.on('connect', () => {
      addStatus('Connected to server');
    });

    newSocket.on('disconnect', () => {
      addStatus('Disconnected from server');
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Room state received when joining
    socket.on('room-state', (state) => {
      addStatus('Received room state');
      setShowSubtitles(state.subtitleVisible);
      setSubtitleOffset(state.subtitleOffset);
      setFontSize(state.fontSize);
    });

    // User joined notification
    socket.on('user-joined', ({ userId }) => {
      addStatus(`User ${userId.substring(0, 8)} joined the room`);
    });

    // Play video event
    socket.on('play-video', ({ currentTime }) => {
      addStatus(`Remote play at ${currentTime.toFixed(2)}s`);
      isReceivingUpdate.current = true;
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime;
        videoRef.current.play().catch(err => {
          console.error('Play error:', err);
          addStatus('Error: Could not play video');
        });
      }
      setIsPlaying(true);
      setTimeout(() => { isReceivingUpdate.current = false; }, 100);
    });

    // Pause video event
    socket.on('pause-video', ({ currentTime }) => {
      addStatus(`Remote pause at ${currentTime.toFixed(2)}s`);
      isReceivingUpdate.current = true;
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime;
        videoRef.current.pause();
      }
      setIsPlaying(false);
      setTimeout(() => { isReceivingUpdate.current = false; }, 100);
    });

    // Seek video event
    socket.on('seek-video', ({ currentTime }) => {
      addStatus(`Remote seek to ${currentTime.toFixed(2)}s`);
      isReceivingUpdate.current = true;
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime;
      }
      setTimeout(() => { isReceivingUpdate.current = false; }, 100);
    });

    // Subtitle loaded notification
    socket.on('subtitle-loaded', ({ userId, fileName, fileSize }) => {
      addStatus(`User ${userId.substring(0, 8)} loaded subtitle: ${fileName}`);
    });

    // Subtitle toggle event
    socket.on('subtitle-toggle', ({ visible }) => {
      addStatus(`Remote subtitle toggle: ${visible ? 'ON' : 'OFF'}`);
      setShowSubtitles(visible);
    });

    // Subtitle offset event
    socket.on('subtitle-offset', ({ offset }) => {
      addStatus(`Remote subtitle offset: ${offset}s`);
      setSubtitleOffset(offset);
    });

    // Font size change event
    socket.on('font-size-change', ({ fontSize }) => {
      addStatus(`Remote font size: ${fontSize}px`);
      setFontSize(fontSize);
    });

    return () => {
      socket.off('room-state');
      socket.off('user-joined');
      socket.off('play-video');
      socket.off('pause-video');
      socket.off('seek-video');
      socket.off('subtitle-loaded');
      socket.off('subtitle-toggle');
      socket.off('subtitle-offset');
      socket.off('font-size-change');
    };
  }, [socket]);

  // Update CSS variable for subtitle font size
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.style.setProperty('--subtitle-font-size', `${fontSize}px`);
    }
  }, [fontSize]);

  // Join room
  const handleJoinRoom = () => {
    if (socket && room.trim()) {
      socket.emit('join-room', room);
      setIsInRoom(true);
      addStatus(`Joined room: ${room}`);
    }
  };

  // Handle video file selection
  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoFile(url);
      addStatus(`Loaded video: ${file.name}`);
    }
  };

  // Parse SRT to WebVTT format
  const parseSRT = (srtContent) => {
    // Convert SRT format to WebVTT
    let vttContent = 'WEBVTT\n\n';
    
    // Replace comma with dot in timestamps (SRT uses comma, VTT uses dot)
    srtContent = srtContent.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
    
    // Split into blocks
    const blocks = srtContent.trim().split(/\n\s*\n/);
    
    blocks.forEach(block => {
      const lines = block.split('\n');
      if (lines.length >= 3) {
        // Skip the sequence number (first line)
        // Keep the timestamp (second line) and text (remaining lines)
        const timestamp = lines[1];
        const text = lines.slice(2).join('\n');
        vttContent += `${timestamp}\n${text}\n\n`;
      }
    });
    
    return vttContent;
  };

  // Handle subtitle file selection
  const handleSubtitleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        let vttContent;
        
        // Check if it's SRT or VTT
        if (file.name.endsWith('.srt')) {
          vttContent = parseSRT(content);
          addStatus(`Converted SRT to WebVTT: ${file.name}`);
        } else {
          vttContent = content;
          addStatus(`Loaded VTT: ${file.name}`);
        }
        
        // Create blob URL for the subtitle
        const blob = new Blob([vttContent], { type: 'text/vtt' });
        const url = URL.createObjectURL(blob);
        setSubtitleFile(url);
        
        // Notify others in the room
        if (socket && isInRoom) {
          socket.emit('subtitle-loaded', {
            roomId: room,
            fileName: file.name,
            fileSize: file.size
          });
        }
      };
      reader.readAsText(file);
    }
  };

  // Video event handlers
  const handlePlay = () => {
    if (isReceivingUpdate.current) return;
    
    const time = videoRef.current?.currentTime || 0;
    if (socket && isInRoom) {
      socket.emit('play-video', { roomId: room, currentTime: time });
      addStatus(`Sent play at ${time.toFixed(2)}s`);
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    if (isReceivingUpdate.current) return;
    
    const time = videoRef.current?.currentTime || 0;
    if (socket && isInRoom) {
      socket.emit('pause-video', { roomId: room, currentTime: time });
      addStatus(`Sent pause at ${time.toFixed(2)}s`);
    }
    setIsPlaying(false);
  };

  const handleSeeked = () => {
    if (isReceivingUpdate.current) return;
    
    const time = videoRef.current?.currentTime || 0;
    if (socket && isInRoom) {
      socket.emit('seek-video', { roomId: room, currentTime: time });
      addStatus(`Sent seek to ${time.toFixed(2)}s`);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Subtitle controls
  const handleSubtitleToggle = () => {
    const newValue = !showSubtitles;
    setShowSubtitles(newValue);
    
    if (socket && isInRoom) {
      socket.emit('subtitle-toggle', { roomId: room, visible: newValue });
      addStatus(`Subtitle ${newValue ? 'enabled' : 'disabled'}`);
    }
  };

  const handleSubtitleOffsetChange = (e) => {
    const offset = parseFloat(e.target.value);
    setSubtitleOffset(offset);
    
    if (socket && isInRoom) {
      socket.emit('subtitle-offset', { roomId: room, offset });
    }
  };

  const handleFontSizeChange = (e) => {
    const size = parseInt(e.target.value);
    setFontSize(size);
    
    if (socket && isInRoom) {
      socket.emit('font-size-change', { roomId: room, fontSize: size });
    }
  };

  // Handle right-click on video to toggle controls
  const handleContextMenu = (e) => {
    // Check if video is in fullscreen
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      e.preventDefault();
      setShowControls(prev => !prev);
    }
  };

  // Update track visibility
  useEffect(() => {
    if (trackRef.current) {
      trackRef.current.track.mode = showSubtitles ? 'showing' : 'hidden';
    }
  }, [showSubtitles]);

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 text-white">
            SyncParty
          </h1>
          <p className="text-gray-400">Watch videos together in perfect sync</p>
        </div>

        {/* Room Controls */}
        <div className="bg-white/5 rounded-xl p-6 mb-6 border border-white/20">
          <h2 className="text-xl font-semibold mb-4">Room</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Enter room name"
              disabled={isInRoom}
              className="flex-1 px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50"
            />
            <button
              onClick={handleJoinRoom}
              disabled={isInRoom || !room.trim()}
              className="px-6 py-2 bg-white text-black hover:bg-gray-200 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {isInRoom ? 'In Room' : 'Join Room'}
            </button>
          </div>
        </div>

        {/* File Inputs */}
        <div className="bg-white/5 rounded-xl p-6 mb-6 border border-white/20">
          <h2 className="text-xl font-semibold mb-4">Media Files</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Video File</label>
              <input
                type="file"
                accept="video/*,.mkv,.mp4,.webm,.avi,.mov,.wmv,.flv,.m4v"
                onChange={handleVideoFileChange}
                className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white file:text-black hover:file:bg-gray-200 file:cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Subtitle File (.srt or .vtt)</label>
              <input
                type="file"
                accept=".srt,.vtt"
                onChange={handleSubtitleFileChange}
                className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-800 file:text-white hover:file:bg-gray-700 file:cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Video Player */}
        {videoFile && (
          <div className="bg-white/5 rounded-xl p-6 mb-6 border border-white/20">
            <h2 className="text-xl font-semibold mb-4">Video Player</h2>
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                src={videoFile}
                controls={showControls}
                onPlay={handlePlay}
                onPause={handlePause}
                onSeeked={handleSeeked}
                onTimeUpdate={handleTimeUpdate}
                onContextMenu={handleContextMenu}
                className="w-full"
                style={{ '--subtitle-font-size': `${fontSize}px` }}
              >
                {subtitleFile && (
                  <track
                    ref={trackRef}
                    kind="subtitles"
                    src={subtitleFile}
                    srcLang="en"
                    label="English"
                    default
                  />
                )}
              </video>
            </div>
          </div>
        )}

        {/* Subtitle Controls */}
        {subtitleFile && (
          <div className="bg-white/5 rounded-xl p-6 mb-6 border border-white/20">
            <h2 className="text-xl font-semibold mb-4">Subtitle Controls</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Toggle */}
              <div>
                <label className="block text-sm font-medium mb-2">Visibility</label>
                <button
                  onClick={handleSubtitleToggle}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                    showSubtitles 
                      ? 'bg-white text-black hover:bg-gray-200' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {showSubtitles ? 'Subtitles ON' : 'Subtitles OFF'}
                </button>
              </div>

              {/* Offset */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Offset: {subtitleOffset.toFixed(1)}s
                </label>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.1"
                  value={subtitleOffset}
                  onChange={handleSubtitleOffsetChange}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>

              {/* Font Size */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Font Size: {fontSize}px
                </label>
                <input
                  type="range"
                  min="12"
                  max="64"
                  step="2"
                  value={fontSize}
                  onChange={handleFontSizeChange}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-gray-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* Status Log */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/20">
          <h2 className="text-xl font-semibold mb-4">Activity Log</h2>
          <div className="bg-black/50 rounded-lg p-4 h-48 overflow-y-auto font-mono text-sm">
            {statusLog.length === 0 ? (
              <p className="text-gray-400">No activity yet...</p>
            ) : (
              statusLog.map((log, index) => (
                <div key={index} className="text-gray-300 mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
