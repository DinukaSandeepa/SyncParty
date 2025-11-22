'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useUser } from '@clerk/nextjs';
import { io } from 'socket.io-client';
import 'plyr/dist/plyr.css';

export default function Home() {
  const { user } = useUser();
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState('');
  const [isInRoom, setIsInRoom] = useState(false);
  const [mode, setMode] = useState('local'); // 'local' or 'youtube'
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
  const [showControls, setShowControls] = useState(true);
  const [isWindows, setIsWindows] = useState(false);
  const [popup, setPopup] = useState({ show: false, message: '', icon: null });

  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const trackRef = useRef(null);
  const isReceivingUpdate = useRef(false);
  const seekDebounceTimer = useRef(null);
  const popupTimeoutRef = useRef(null);

  const addStatus = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setStatusLog(prev => [...prev.slice(-9), `[${timestamp}] ${message}`]);
  };

  const triggerPopup = (message, icon) => {
    if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
    setPopup({ show: true, message, icon });
    popupTimeoutRef.current = setTimeout(() => {
      setPopup(prev => ({ ...prev, show: false }));
    }, 2500);
  };

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
    socket.on('youtube-url-change', ({ youtubeUrl }) => {
      addStatus(`YouTube URL updated`);
      setYoutubeUrl(youtubeUrl);
      const videoId = extractYoutubeVideoId(youtubeUrl);
      if (videoId) {
        setYoutubeVideoId(videoId);
        setMode('youtube');
        triggerPopup('YouTube Video Loaded', 'youtube');
      } else {
        setYoutubeVideoId(null);
      }
    });
    socket.on('play-video', ({ currentTime }) => {
      addStatus(`Remote play at ${currentTime.toFixed(2)}s`);
      triggerPopup('Remote Play', 'play');
      isReceivingUpdate.current = true;
      if (playerRef.current) {
        playerRef.current.currentTime = currentTime;
        playerRef.current.play().catch(err => {

          addStatus('Error: Could not play video');
        });
      }
      setIsPlaying(true);
      setTimeout(() => { isReceivingUpdate.current = false; }, 100);
    });
    socket.on('pause-video', ({ currentTime }) => {
      addStatus(`Remote pause at ${currentTime.toFixed(2)}s`);
      triggerPopup('Remote Pause', 'pause');
      isReceivingUpdate.current = true;
      if (playerRef.current) {
        playerRef.current.currentTime = currentTime;
        playerRef.current.pause();
      }
      setIsPlaying(false);
      setTimeout(() => { isReceivingUpdate.current = false; }, 100);
    });
    socket.on('seek-video', ({ currentTime }) => {
      addStatus(`Remote seek to ${currentTime.toFixed(2)}s`);
      triggerPopup(`Seek to ${formatTime(currentTime)}`, 'seek');
      isReceivingUpdate.current = true;
      if (playerRef.current) {
        playerRef.current.currentTime = currentTime;
      }
      // Longer timeout for YouTube to ensure seek completes
      setTimeout(() => { isReceivingUpdate.current = false; }, 500);
    });
    socket.on('subtitle-loaded', ({ userId, fileName, fileSize }) => {
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
    return () => {
      socket.off('room-state');
      socket.off('user-joined');
      socket.off('youtube-url-change');
      socket.off('play-video');
      socket.off('pause-video');
      socket.off('seek-video');
      socket.off('subtitle-loaded');
      socket.off('subtitle-toggle');
      socket.off('subtitle-offset');
      socket.off('font-size-change');
    };
  }, [socket]);

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
          // Set muted to false for YouTube to enable audio
          plyrOptions.muted = false;
          plyrOptions.volume = 1;
        } else {
          plyrOptions.captions = { active: true, update: true, language: 'en' };
        }

        playerRef.current = new Plyr(videoRef.current, plyrOptions);

        // Apply current settings immediately
        if (playerRef.current.elements.container) {
          playerRef.current.elements.container.style.setProperty('--plyr-font-size-captions', `${fontSize}px`);
        }

        // Add event listeners to Plyr instance
        playerRef.current.on('play', () => {
          if (!isReceivingUpdate.current) handlePlay();
        });

        playerRef.current.on('pause', () => {
          if (!isReceivingUpdate.current) handlePause();
        });

        playerRef.current.on('seeked', () => {
          if (!isReceivingUpdate.current) handleSeeked();
        });

        playerRef.current.on('timeupdate', () => {
          handleTimeUpdate();
        });

        // YouTube-specific events and fixes
        if (mode === 'youtube') {
          playerRef.current.on('ready', () => {
            addStatus('YouTube player ready');

            // Fix: Ensure audio is enabled by unmuting and setting volume
            setTimeout(() => {
              if (playerRef.current) {
                playerRef.current.muted = false;
                playerRef.current.volume = 1;
                addStatus('Audio enabled');
              }
            }, 500);
          });

          // Additional YouTube-specific event for better seeking support
          playerRef.current.on('seeking', () => {
            // This fires when seeking starts (good for YouTube)
            if (!isReceivingUpdate.current) {
              // We'll let 'seeked' handle the actual sync to avoid double events
            }
          });

          // Handle YouTube API state changes
          playerRef.current.on('statechange', (event) => {
            // YouTube specific state changes
            // This helps with catching state changes that might not fire standard events
          });
        }
      })();
    }

    return () => {
      isMounted = false;
      // Clean up debounce timer
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

      // Apply font size to caption wrapper if it exists
      const captionWrapper = playerRef.current.elements.container.querySelector('.plyr__captions');
      if (captionWrapper) {
        captionWrapper.style.fontSize = `${fontSize}px`;
      }
    }
  }, [fontSize]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (!playerRef.current) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          playerRef.current.togglePlay();
          break;
        case 'f':
          e.preventDefault();
          playerRef.current.fullscreen.toggle();
          break;
        case 'm':
          e.preventDefault();
          playerRef.current.muted = !playerRef.current.muted;
          break;
        case 'arrowleft':
        case 'j':
          e.preventDefault();
          playerRef.current.rewind(10);
          break;
        case 'arrowright':
        case 'l':
          e.preventDefault();
          playerRef.current.forward(10);
          break;
        case 'arrowup':
          e.preventDefault();
          playerRef.current.increaseVolume(0.1);
          break;
        case 'arrowdown':
          e.preventDefault();
          playerRef.current.decreaseVolume(0.1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const handleJoinRoom = () => {
    if (socket && room.trim()) {
      const username = user ? user.fullName || user.firstName || 'Guest' : 'Guest';
      socket.emit('join-room', room, username);
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

  const extractYoutubeVideoId = (url) => {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\?]+)/,
      /youtube\.com\/embed\/([^&\?]+)/,
      /youtube\.com\/v\/([^&\?]+)/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) return match[1];
    }
    return null;
  };

  const handleYoutubeUrlChange = (e) => {
    const url = e.target.value;
    setYoutubeUrl(url);
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
  const parseSRT = (srtContent) => {
    let vttContent = 'WEBVTT\n\n';
    srtContent = srtContent.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
    const blocks = srtContent.trim().split(/\n\s*\n/);
    blocks.forEach(block => {
      const lines = block.split('\n');
      if (lines.length >= 3) {
        const timestamp = lines[1];
        const text = lines.slice(2).join('\n');
        vttContent += `${timestamp}\n${text}\n\n`;
      }
    });
    return vttContent;
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

    // Clear any pending seek events
    if (seekDebounceTimer.current) {
      clearTimeout(seekDebounceTimer.current);
    }

    // Debounce seek events to prevent spam (especially important for YouTube)
    seekDebounceTimer.current = setTimeout(() => {
      const time = playerRef.current?.currentTime || 0;
      if (socket && isInRoom) {
        socket.emit('seek-video', { roomId: room, currentTime: time });
        addStatus(`Sent seek to ${time.toFixed(2)}s`);
      }
    }, 300); // 300ms debounce - balances responsiveness and sync accuracy
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
  const handleContextMenu = (e) => {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      e.preventDefault();
      setShowControls(prev => !prev);
    }
  };
  useEffect(() => {
    if (playerRef.current && subtitleFile) {
      // Only toggle if captions are available
      try {
        playerRef.current.toggleCaptions(showSubtitles);
      } catch (e) {
        // Fallback to track mode if toggleCaptions fails
        if (trackRef.current) {
          trackRef.current.track.mode = showSubtitles ? 'showing' : 'hidden';
        }
      }
    } else if (trackRef.current) {
      trackRef.current.track.mode = showSubtitles ? 'showing' : 'hidden';
    }
  }, [showSubtitles, subtitleFile]);

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

  const formatTime = (seconds) => {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  return (
    <main className="min-h-screen p-8 text-white bg-black">
      {popup.show && playerRef.current?.elements?.container && createPortal(
        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-[100] pointer-events-none animate-fade-in-down">
          <div className="flex items-center gap-3 px-6 py-3 border shadow-2xl bg-black/60 backdrop-blur-xl rounded-full border-white/10">
            {popup.icon === 'play' && (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-green-400">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
            {popup.icon === 'pause' && (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-400">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            )}
            {popup.icon === 'seek' && (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            )}
            {popup.icon === 'user' && (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
            {popup.icon === 'subtitle' && (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            )}
            {popup.icon === 'youtube' && (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-red-500">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
              </svg>
            )}
            <span className="text-sm font-medium tracking-wide text-white/90">{popup.message}</span>
          </div>
        </div>,
        playerRef.current.elements.container
      )}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center w-full py-10">
          <svg className='w-[200px]' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 1524 322">
            <path fill="#fff" d="M63.11 3.07c-13.733 4-23.866 10.267-35.2 21.6-10.666 10.667-19.2 25.733-21.866 38.8-2.4 11.2-1.067 33.733 2.667 44 3.733 10.8 11.733 23.067 20.533 31.733 9.467 9.2 27.067 18.134 36.267 18.267 12.133.267 20.533-7.6 20.533-19.2 0-8.933-4.133-14.133-15.6-19.733-18.267-8.934-26.4-20.667-26.267-38.667 0-12.267 3.2-20 11.467-28.267 16.133-16.133 40-17.333 58.8-3.066 4.8 3.733 6.667 6.4 9.467 13.733 5.6 14.667 15.066 22.667 29.733 25.067 18.267 2.933 37.733-14.667 37.733-34-.133-21.867-21.733-39.2-41.866-33.6-4.934 1.333-5.734 1.066-14-4.4C118.577 4.137 104.577-.13 85.377.003c-8.4 0-15.066.934-22.266 3.067Zm677.601 146.8v108.667h44v-72h26.666c30.134 0 36.534-.933 50.667-7.733 31.733-15.067 47.733-53.334 36.667-87.867-6-18.533-18.4-33.2-35.6-41.867-14.8-7.466-18.4-7.866-72.667-7.866h-49.733V149.87Zm99.333-65.866c22.667 10.666 24.267 44.533 2.8 57.866l-6.533 4-25.867.4-25.733.534v-65.6h24.666c22.4 0 25.2.266 30.667 2.8Zm443.596-20.801c-10.4 3.2-19.6 6.267-20.26 6.667-.8.533-1.34 7.733-1.34 16.8v15.867h-26.4l-.8 9.6c-.4 5.333-.53 13.733-.4 18.666l.27 9.067h27.33v35.6c0 50.8 1.6 58.133 14.4 71.467 9.2 9.333 16.8 11.866 38.54 12.666 9.73.267 19.73.134 22.4-.266l4.66-.934V221.87h-13.86c-12.94 0-14.14-.267-17.34-3.2-5.6-5.333-6.26-10.267-5.86-45.467l.4-32.666 18.4-.4 18.26-.4v-37.2h-37.33V79.87c0-12.533-.4-22.667-.93-22.533-.67 0-9.6 2.666-20.14 5.866ZM457.777 98.67c-10.266 1.467-21.066 6.8-28.4 14-3.333 3.2-6.4 5.867-6.666 5.867-.4 0-.667-3.6-.667-8v-8h-41.333v156h42.666v-46.4c0-54.533.4-57.2 10.534-66.933 6.933-6.8 13.6-9.334 24.666-9.334 8.667 0 15.867 2.667 21.2 7.734 8.4 7.866 8.267 6.8 8.667 63.2l.4 51.733h42.667l-.4-55.733c-.534-52.134-.667-56.134-3.334-63.867-1.466-4.533-4.266-10.933-6.133-14.133-7.6-13.067-24-23.467-40.933-26.134-9.734-1.6-12.134-1.6-22.934 0Zm173.6-.133c-35.6 4.4-62.8 28.267-71.466 62.667-2.934 11.6-2 34.666 2 45.733 11.066 31.333 34.133 50.4 67.466 55.6 18.534 2.933 42.134-1.867 57.467-11.733 8-5.2 20.533-18 24.8-25.334l2.4-4-16.667-9.466c-9.2-5.2-17.066-9.467-17.6-9.467-.666 0-4 3.467-7.6 7.467-8.933 10.266-16.933 13.866-30.266 13.866-8.667 0-11.334-.533-18.267-4-15.067-7.6-23.467-21.466-23.467-38.666-.133-14.4 3.2-22.8 12.4-32.134 8.8-8.666 16.534-11.866 28.934-11.866 12.933 0 21.6 3.866 30.4 13.466l7.2 8.134 16.533-9.734c9.067-5.2 16.667-9.733 16.8-10 1.733-1.333-2.933-7.866-12.267-17.333-8-8.133-13.2-12.133-19.6-15.067-15.466-7.2-32.933-10.133-49.2-8.133Zm352.667-.134c-24.933 3.067-47.467 18.8-59.2 41.334-6.933 13.333-9.467 24.133-9.467 40.933 0 24.533 6.934 43.067 22.4 59.333 27.067 28.8 76.403 31.6 102.133 5.867l4.8-4.8v17.467h41.33v-156h-41.33v16.266l-5.2-4.666c-14.13-12.667-34-18.4-55.466-15.734Zm35.996 42.267c15.87 7.467 26 25.867 24.14 43.467-1.6 15.2-11.07 30-22.94 36.133-16.66 8.4-38.263 5.333-51.196-7.2-15.6-15.2-18-43.067-4.933-60.133 12.266-16 35.999-21.334 54.929-12.267Zm181.07-40.666c-13.47 2.533-25.33 10.933-32.13 22.4l-3.6 6.133-.4-13.067-.4-12.933h-41.2v156h41.2l.4-42.4c.4-40.8.53-42.533 3.46-48.933 6.8-14.667 18.67-22 37.34-23.067l10.93-.667V98.537l-4.93.133c-2.8.134-7.6.667-10.67 1.334ZM195.377 103.07c0 .4 2.934 7.733 6.534 16.4 44.8 107.333 54.8 132.133 54.8 135.2 0 1.733-2 6.8-4.534 11.2-6 10.933-13.733 15.733-26.266 16.4l-9.2.533v38.4h10.4c24.666 0 44.133-10 58.266-29.867 9.467-13.466 5.067-2.8 53.867-131.2 11.867-31.066 21.467-56.666 21.467-57.066 0-.267-10.134-.534-22.4-.534h-22.534l-12.666 36.934c-7.067 20.4-14.8 43.466-17.2 51.333-2.534 7.867-4.934 14.4-5.467 14.4-.667 0-1.067-.533-1.067-1.333 0-.667-6-17.067-13.333-36.267-7.333-19.333-16-41.867-19.067-50l-5.6-15.067h-22.933c-12.667 0-23.067.267-23.067.534Zm1163.463 2.4c.54 1.734 9.34 23.2 19.6 47.734 10.27 24.533 22.67 54.533 27.6 66.666 5.07 12.134 10.27 24.8 11.87 28.267l2.67 6.267-4.67 9.333c-6.8 13.733-13.73 17.733-32.53 19.067-4.14.4-4.67.8-4.54 4 0 2.133.14 10.666.27 19.2l.27 15.6 13.73-.8c29.2-1.467 49.07-15.067 63.33-43.2 1.6-3.067 9.87-24 18.4-46.667 8.54-22.533 18.67-49.467 22.54-59.733 3.86-10.267 11.33-29.734 16.53-43.2 5.2-13.467 9.47-24.667 9.47-24.934 0-.266-10.14-.533-22.54-.533h-22.53l-2.67 7.6c-1.46 4.267-8.4 24.4-15.6 44.933-7.06 20.4-13.86 40.267-14.93 44l-2 6.8-6.53-16.666c-3.47-9.2-12.4-32.267-19.6-51.334l-13.34-34.666-22.93-.4-22.8-.267.93 2.933Z" />
            <path fill="#fff" d="M115.377 114.404c-8.8 4.8-12.4 15.2-8.266 24.533 2.666 6.133 7.733 10 16.533 12.8 7.2 2.4 16.4 11.2 20.667 19.867 3.066 6.266 3.733 9.2 3.6 17.6 0 12.666-3.6 21.2-12.267 29.733-9.2 8.933-17.2 12.267-30.267 12.267-18.4 0-32.533-8.667-38.133-23.6-7.2-19.334-24.267-28.667-42.667-23.334C7.511 189.337-2.889 206.537.711 223.604c4.133 19.066 22.533 30.933 40.533 26.266 6.133-1.6 7.067-1.6 9.467.667 1.466 1.333 5.733 4.267 9.6 6.533 56.533 34.534 126.933-3.466 127.066-68.533 0-25.733-12.933-50.933-33.2-64.533-16.666-11.2-30-14.534-38.8-9.6Z" />
          </svg>
        </div>
        <div className="p-6 mb-6 transition-all duration-300 delay-100 border bg-white/5 rounded-xl border-white/5 animate-fade-in-up hover:border-white/20">
          <h2 className="mb-4 text-xl font-semibold">Room</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Enter room name"
              disabled={isInRoom}
              className="flex-1 px-4 py-2 transition-all duration-300 border rounded-lg bg-white/10 border-white/30 focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50 hover:bg-white/15"
            />
            <button
              onClick={handleJoinRoom}
              disabled={isInRoom || !room.trim()}
              className="px-6 py-2 font-medium text-black transition-all duration-300 bg-white rounded-lg hover:bg-white/80 disabled:bg-white/20 disabled:text-white/40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            >
              {isInRoom ? 'In Room' : 'Join Room'}
            </button>
          </div>
        </div>
        <div className="p-6 mb-6 transition-all duration-300 delay-200 border bg-white/5 rounded-xl border-white/5 animate-fade-in-up hover:border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Media Source</h2>
            <button
              onClick={handleResetMedia}
              className="px-4 py-1 text-sm font-medium text-red-400 transition-all duration-300 border border-red-500/50 rounded-lg hover:bg-red-500/10 hover:border-red-500 hover:text-red-300"
            >
              Reset
            </button>
          </div>

          {/* Mode Selector */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => {
                setMode('local');
                setYoutubeVideoId(null);
                addStatus('Switched to Local Video mode');
              }}
              disabled={isInRoom}
              className={`flex-1 px-6 py-3 font-medium rounded-lg transition-all duration-300 border ${mode === 'local'
                ? 'bg-white text-black border-white hover:bg-white/80'
                : 'bg-white/10 text-white border-white/30 hover:bg-white/15'
                } disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95`}
            >
              🎬 Local Video
            </button>
            <button
              onClick={() => {
                setMode('youtube');
                setVideoFile(null);
                addStatus('Switched to YouTube mode');
              }}
              disabled={isInRoom}
              className={`flex-1 px-6 py-3 font-medium rounded-lg transition-all duration-300 border ${mode === 'youtube'
                ? 'bg-white text-black border-white hover:bg-white/80'
                : 'bg-white/10 text-white border-white/30 hover:bg-white/15'
                } disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95`}
            >
              📺 YouTube
            </button>
          </div>

          {/* Local Video Mode */}
          {mode === 'local' && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium">Video File</label>
                <input
                  type="file"
                  accept="video/*,.mkv,.mp4,.webm,.avi,.mov,.wmv,.flv,.m4v"
                  onChange={handleVideoFileChange}
                  className="w-full px-4 py-2 transition-all duration-300 border rounded-lg bg-white/10 border-white/30 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white file:text-black hover:file:bg-white/80 file:cursor-pointer hover:bg-white/15"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">Subtitle File (.srt or .vtt)</label>
                <input
                  type="file"
                  accept=".srt,.vtt"
                  onChange={handleSubtitleFileChange}
                  className="w-full px-4 py-2 transition-all duration-300 border rounded-lg bg-white/10 border-white/30 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-black file:text-white hover:file:bg-black/80 file:cursor-pointer file:border file:border-white/30 hover:bg-white/15"
                />
              </div>
            </div>
          )}

          {/* YouTube Mode */}
          {mode === 'youtube' && (
            <div>
              <label className="block mb-2 text-sm font-medium">YouTube URL</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={handleYoutubeUrlChange}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="flex-1 px-4 py-2 transition-all duration-300 border rounded-lg bg-white/10 border-white/30 focus:outline-none focus:ring-2 focus:ring-white hover:bg-white/15"
                />
                <button
                  onClick={handleLoadYoutube}
                  className="px-6 py-2 font-medium text-black transition-all duration-300 bg-white rounded-lg hover:bg-white/80 hover:scale-105 active:scale-95"
                >
                  Load
                </button>
              </div>
              <p className="mt-2 text-xs text-white/60">Paste a YouTube URL (e.g., youtube.com/watch?v=... or youtu.be/...)</p>
            </div>
          )}
        </div>
        {(videoFile || youtubeVideoId) && (
          <div className="p-6 mb-6 transition-all duration-300 delay-300 border bg-white/5 rounded-xl border-white/5 animate-fade-in-up hover:border-white/20">
            <h2 className="mb-4 text-xl font-semibold">Video Player</h2>
            <div className={`relative overflow-hidden transition-shadow duration-300 bg-black rounded-lg shadow-2xl hover:shadow-white/10 ${isWindows ? 'windows-subtitles' : ''}`}>
              {mode === 'local' ? (
                <video
                  ref={videoRef}
                  src={videoFile}
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
              ) : (
                <div key={youtubeVideoId} className="w-full">
                  <div
                    ref={videoRef}
                    data-plyr-provider="youtube"
                    data-plyr-embed-id={youtubeVideoId}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>
        )}
        {(subtitleFile && mode === 'local') && (
          <div className="p-6 mb-6 transition-all duration-300 border bg-white/5 rounded-xl border-white/5 animate-fade-in-up delay-400 hover:border-white/20">
            <h2 className="mb-4 text-xl font-semibold">Subtitle Controls</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <label className="block mb-2 text-sm font-medium">Visibility</label>
                <button
                  onClick={handleSubtitleToggle}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-all duration-300 border hover:scale-105 active:scale-95 ${showSubtitles
                    ? 'bg-white text-black hover:bg-white/80 border-white'
                    : 'bg-black text-white hover:bg-white/10 border-white/30'
                    }`}
                >
                  {showSubtitles ? 'Subtitles ON' : 'Subtitles OFF'}
                </button>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">
                  Offset: {subtitleOffset.toFixed(1)}s
                </label>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.1"
                  value={subtitleOffset}
                  onChange={handleSubtitleOffsetChange}
                  className="w-full h-2 transition-all duration-300 rounded-lg appearance-none cursor-pointer bg-white/20 accent-white hover:bg-white/30"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">
                  Font Size: {fontSize}px
                </label>
                <input
                  type="range"
                  min="12"
                  max="64"
                  step="2"
                  value={fontSize}
                  onChange={handleFontSizeChange}
                  className="w-full h-2 transition-all duration-300 rounded-lg appearance-none cursor-pointer bg-white/20 accent-gray-400 hover:bg-white/30"
                />
              </div>
            </div>
          </div>
        )}
        <div className="p-6 transition-all duration-300 delay-500 border bg-white/5 rounded-xl border-white/5 animate-fade-in-up hover:border-white/20">
          <h2 className="mb-4 text-xl font-semibold">Activity Log</h2>
          <div className="h-48 p-4 overflow-y-auto font-mono text-sm rounded-lg bg-black/50">
            {statusLog.length === 0 ? (
              <p className="text-gray-400">No activity yet...</p>
            ) : (
              statusLog.map((log, index) => (
                <div key={index} className="mb-1 text-gray-300">
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