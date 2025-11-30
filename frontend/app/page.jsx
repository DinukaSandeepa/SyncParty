'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { io } from 'socket.io-client';
import 'plyr/dist/plyr.css';

import {
  RoomSection,
  MediaSourceSection,
  VideoPlayer,
  SubtitleControls,
  ActivityLog,
  SyncPopup,
  UserPanel
} from './components';

import { useKeyboardControls } from './hooks/useKeyboardControls';
import { extractYoutubeVideoId, parseSRT, formatTime } from './utils/helpers';

export default function Home() {
  const { user } = useUser();
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState('');
  const [isInRoom, setIsInRoom] = useState(false);
  const [mode, setMode] = useState('local');
  const [videoFile, setVideoFile] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeVideoId, setYoutubeVideoId] = useState(null);
  const [subtitleFile, setSubtitleFile] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [subtitleOffset, setSubtitleOffset] = useState(0);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const [statusLog, setStatusLog] = useState([]);
  const [isWindows, setIsWindows] = useState(false);
  const [popup, setPopup] = useState({ show: false, message: '', icon: null });
  const [roomUsers, setRoomUsers] = useState([]);
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const trackRef = useRef(null);
  const isReceivingUpdate = useRef(false);
  const seekDebounceTimer = useRef(null);
  const popupTimeoutRef = useRef(null);
  const addStatus = useCallback((message) => {
    const timestamp = new Date().toLocaleTimeString();
    setStatusLog(prev => [...prev.slice(-9), `[${timestamp}] ${message}`]);
  }, []);
  const triggerPopup = useCallback((message, icon) => {
    if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
    setPopup({ show: true, message, icon });
    popupTimeoutRef.current = setTimeout(() => {
      setPopup(prev => ({ ...prev, show: false }));
    }, 2500);
  }, []);
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
  }, [addStatus]);
  useEffect(() => {
    if (!socket) return;
    socket.on('room-state', (state) => {
      addStatus('Received room state');
      setShowSubtitles(state.subtitleVisible);
      setSubtitleOffset(state.subtitleOffset);
      setFontSize(state.fontSize);
      if (state.youtubeUrl) {
        setYoutubeUrl(state.youtubeUrl);
        const videoId = extractYoutubeVideoId(state.youtubeUrl);
        if (videoId) {
          setYoutubeVideoId(videoId);
          setMode('youtube');
        }
      }
    });
    socket.on('user-joined', ({ userId, username }) => {
      const displayName = username || `User ${userId.substring(0, 8)}`;
      addStatus(`${displayName} joined the room`);
      triggerPopup(`${displayName} joined`, 'user');
    });
    socket.on('youtube-url-change', ({ youtubeUrl, username }) => {
      const user = username || 'Remote user';
      addStatus(`${user} updated YouTube URL`);
      setYoutubeUrl(youtubeUrl);
      const videoId = extractYoutubeVideoId(youtubeUrl);
      if (videoId) {
        setYoutubeVideoId(videoId);
        setMode('youtube');
        triggerPopup(`${user} loaded video`, 'youtube');
      } else {
        setYoutubeVideoId(null);
      }
    });
    socket.on('play-video', ({ currentTime, username }) => {
      const user = username || 'Remote user';
      addStatus(`${user} played at ${currentTime.toFixed(2)}s`);
      triggerPopup(`${user} played`, 'play');
      isReceivingUpdate.current = true;
      if (playerRef.current) {
        playerRef.current.currentTime = currentTime;
        playerRef.current.play().catch(() => {
          addStatus('Error: Could not play video');
        });
      }
      setIsPlaying(true);
      setTimeout(() => { isReceivingUpdate.current = false; }, 100);
    });
    socket.on('pause-video', ({ currentTime, username }) => {
      const user = username || 'Remote user';
      addStatus(`${user} paused at ${currentTime.toFixed(2)}s`);
      triggerPopup(`${user} paused`, 'pause');
      isReceivingUpdate.current = true;
      if (playerRef.current) {
        playerRef.current.currentTime = currentTime;
        playerRef.current.pause();
      }
      setIsPlaying(false);
      setTimeout(() => { isReceivingUpdate.current = false; }, 100);
    });
    socket.on('seek-video', ({ currentTime, username }) => {
      const user = username || 'Remote user';
      addStatus(`${user} seeked to ${currentTime.toFixed(2)}s`);
      triggerPopup(`${user} seeked to ${formatTime(currentTime)}`, 'seek');
      isReceivingUpdate.current = true;
      if (playerRef.current) {
        playerRef.current.currentTime = currentTime;
      }
      setTimeout(() => { isReceivingUpdate.current = false; }, 500);
    });
    socket.on('subtitle-loaded', ({ userId, fileName }) => {
      addStatus(`User ${userId.substring(0, 8)} loaded subtitle: ${fileName}`);
      triggerPopup('Subtitle Loaded', 'subtitle');
    });
    socket.on('subtitle-toggle', ({ visible }) => {
      addStatus(`Remote subtitle toggle: ${visible ? 'ON' : 'OFF'}`);
      setShowSubtitles(visible);
      triggerPopup(`Subtitles ${visible ? 'ON' : 'OFF'}`, 'subtitle');
    });
    socket.on('subtitle-offset', ({ offset }) => {
      addStatus(`Remote subtitle offset: ${offset}s`);
      setSubtitleOffset(offset);
    });
    socket.on('font-size-change', ({ fontSize }) => {
      addStatus(`Remote font size: ${fontSize}px`);
      setFontSize(fontSize);
    });
    socket.on('room-users', (users) => {
      const updatedUsers = users.map(u => ({
        ...u,
        isCurrentUser: u.oderId === user?.id
      }));
      setRoomUsers(updatedUsers);
    });
    socket.on('user-left', ({ oderId, username }) => {
      const displayName = username || `User ${oderId?.substring(0, 8) || 'Unknown'}`;
      addStatus(`${displayName} left the room`);
      triggerPopup(`${displayName} left`, 'user');
    });
    return () => {
      socket.off('room-state');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('room-users');
      socket.off('youtube-url-change');
      socket.off('play-video');
      socket.off('pause-video');
      socket.off('seek-video');
      socket.off('subtitle-loaded');
      socket.off('subtitle-toggle');
      socket.off('subtitle-offset');
      socket.off('font-size-change');
    };
  }, [socket, addStatus, triggerPopup, user]);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsWindows(navigator.userAgent.indexOf('Windows') !== -1);
    }
  }, []);
  useEffect(() => {
    let isMounted = true;
    const hasLocalVideo = mode === 'local' && videoFile && videoRef.current;
    const hasYoutubeVideo = mode === 'youtube' && youtubeVideoId && videoRef.current;
    if ((hasLocalVideo || hasYoutubeVideo) && !playerRef.current) {
      (async () => {
        const Plyr = (await import('plyr')).default;
        if (!isMounted) return;
        const plyrOptions = {
          controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'],
          keyboard: { focused: true, global: true },
        };
        if (mode === 'youtube') {
          plyrOptions.youtube = {
            noCookie: false,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            modestbranding: 1
          };
          plyrOptions.muted = false;
          plyrOptions.volume = 1;
        } else {
          plyrOptions.captions = { active: true, update: true, language: 'en' };
        }
        playerRef.current = new Plyr(videoRef.current, plyrOptions);
        if (playerRef.current.elements.container) {
          playerRef.current.elements.container.style.setProperty('--plyr-font-size-captions', `${fontSize}px`);
        }
        playerRef.current.on('play', () => {
          if (!isReceivingUpdate.current) handlePlay();
        });
        playerRef.current.on('pause', () => {
          if (!isReceivingUpdate.current) handlePause();
        });
        playerRef.current.on('seeked', () => {
          if (!isReceivingUpdate.current) handleSeeked();
        });
        playerRef.current.on('timeupdate', handleTimeUpdate);
        if (mode === 'youtube') {
          playerRef.current.on('ready', () => {
            addStatus('YouTube player ready');
            setTimeout(() => {
              if (playerRef.current) {
                playerRef.current.muted = false;
                playerRef.current.volume = 1;
                addStatus('Audio enabled');
              }
            }, 500);
          });
        }
      })();
    }
    return () => {
      isMounted = false;
      if (seekDebounceTimer.current) {
        clearTimeout(seekDebounceTimer.current);
      }
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoFile, youtubeVideoId, mode]);
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.style.setProperty('--subtitle-font-size', `${fontSize}px`);
    }
    if (playerRef.current && playerRef.current.elements.container) {
      playerRef.current.elements.container.style.setProperty('--plyr-font-size-captions', `${fontSize}px`);
      const captionWrapper = playerRef.current.elements.container.querySelector('.plyr__captions');
      if (captionWrapper) {
        captionWrapper.style.fontSize = `${fontSize}px`;
      }
    }
  }, [fontSize]);
  useKeyboardControls(playerRef);
  useEffect(() => {
    if (playerRef.current && subtitleFile) {
      try {
        playerRef.current.toggleCaptions(showSubtitles);
      } catch (e) {
        if (trackRef.current) {
          trackRef.current.track.mode = showSubtitles ? 'showing' : 'hidden';
        }
      }
    } else if (trackRef.current) {
      trackRef.current.track.mode = showSubtitles ? 'showing' : 'hidden';
    }
  }, [showSubtitles, subtitleFile]);
  const handleJoinRoom = () => {
    if (socket && room.trim()) {
      const username = user ? user.fullName || user.firstName || 'Guest' : 'Guest';
      const userInfo = {
        oderId: user?.id || null,
        imageUrl: user?.imageUrl || null
      };
      socket.emit('join-room', room, username, userInfo);
      setIsInRoom(true);
      addStatus(`Joined room: ${room} as ${username}`);
    }
  };
  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoFile(url);
      addStatus(`Loaded video: ${file.name}`);
    }
  };
  const handleYoutubeUrlChange = (e) => {
    setYoutubeUrl(e.target.value);
  };
  const handleLoadYoutube = () => {
    const videoId = extractYoutubeVideoId(youtubeUrl);
    if (videoId) {
      setYoutubeVideoId(videoId);
      addStatus(`Loaded YouTube video: ${videoId}`);
      if (socket && isInRoom) {
        socket.emit('youtube-url-change', { roomId: room, youtubeUrl });
      }
    } else {
      addStatus('Invalid YouTube URL');
    }
  };
  const handleSubtitleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        let vttContent;
        if (file.name.endsWith('.srt')) {
          vttContent = parseSRT(content);
          addStatus(`Converted SRT to WebVTT: ${file.name}`);
        } else {
          vttContent = content;
          addStatus(`Loaded VTT: ${file.name}`);
        }
        const blob = new Blob([vttContent], { type: 'text/vtt' });
        const url = URL.createObjectURL(blob);
        setSubtitleFile(url);
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
  const handlePlay = () => {
    if (isReceivingUpdate.current) return;
    const time = playerRef.current?.currentTime || 0;
    if (socket && isInRoom) {
      socket.emit('play-video', { roomId: room, currentTime: time });
      addStatus(`Sent play at ${time.toFixed(2)}s`);
    }
    setIsPlaying(true);
  };
  const handlePause = () => {
    if (isReceivingUpdate.current) return;
    const time = playerRef.current?.currentTime || 0;
    if (socket && isInRoom) {
      socket.emit('pause-video', { roomId: room, currentTime: time });
      addStatus(`Sent pause at ${time.toFixed(2)}s`);
    }
    setIsPlaying(false);
  };
  const handleSeeked = () => {
    if (isReceivingUpdate.current) return;
    if (seekDebounceTimer.current) {
      clearTimeout(seekDebounceTimer.current);
    }
    seekDebounceTimer.current = setTimeout(() => {
      const time = playerRef.current?.currentTime || 0;
      if (socket && isInRoom) {
        socket.emit('seek-video', { roomId: room, currentTime: time });
        addStatus(`Sent seek to ${time.toFixed(2)}s`);
      }
    }, 300);
  };
  const handleTimeUpdate = () => {
    if (playerRef.current) {
      setCurrentTime(playerRef.current.currentTime);
    }
  };
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
  const handleResetMedia = () => {
    setVideoFile(null);
    setSubtitleFile(null);
    setYoutubeUrl('');
    setYoutubeVideoId(null);
    addStatus('Media source reset');
    if (socket && isInRoom && mode === 'youtube') {
      socket.emit('youtube-url-change', { roomId: room, youtubeUrl: '' });
    }
  };
  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('leave-room', room);
      setIsInRoom(false);
      setRoomUsers([]);
      setRoom('');
      addStatus('Left the room');
    }
  };
  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === 'local') {
      setYoutubeVideoId(null);
    } else {
      setVideoFile(null);
    }
  };
  return (
    <main className="min-h-screen p-6 text-white transition-all bg-black">
      <SyncPopup
        popup={popup}
        playerContainer={playerRef.current?.elements?.container}
      />
      <UserPanel users={roomUsers} isInRoom={isInRoom} roomName={room} />
      <div className="max-w-6xl mx-auto">
        <RoomSection
          room={room}
          setRoom={setRoom}
          isInRoom={isInRoom}
          onJoinRoom={handleJoinRoom}
          onLeaveRoom={handleLeaveRoom}
        />
        <MediaSourceSection
          mode={mode}
          setMode={handleModeChange}
          isInRoom={isInRoom}
          youtubeUrl={youtubeUrl}
          onYoutubeUrlChange={handleYoutubeUrlChange}
          onLoadYoutube={handleLoadYoutube}
          onVideoFileChange={handleVideoFileChange}
          onSubtitleFileChange={handleSubtitleFileChange}
          onResetMedia={handleResetMedia}
          addStatus={addStatus}
        />
        {(videoFile || youtubeVideoId) && (
          <VideoPlayer
            ref={videoRef}
            mode={mode}
            videoFile={videoFile}
            youtubeVideoId={youtubeVideoId}
            subtitleFile={subtitleFile}
            fontSize={fontSize}
            isWindows={isWindows}
            trackRef={trackRef}
          />
        )}
        {subtitleFile && mode === 'local' && (
          <SubtitleControls
            showSubtitles={showSubtitles}
            subtitleOffset={subtitleOffset}
            fontSize={fontSize}
            onSubtitleToggle={handleSubtitleToggle}
            onSubtitleOffsetChange={handleSubtitleOffsetChange}
            onFontSizeChange={handleFontSizeChange}
          />
        )}
        <ActivityLog statusLog={statusLog} />
      </div>
    </main>
  );
}