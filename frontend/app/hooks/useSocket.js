'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

export function useSocket({ addStatus, triggerPopup, setShowSubtitles, setSubtitleOffset, setFontSize, setYoutubeUrl, setYoutubeVideoId, setMode, extractYoutubeVideoId, playerRef, setIsPlaying, formatTime }) {
    const [socket, setSocket] = useState(null);
    const isReceivingUpdate = useRef(false);
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
    }, [socket, addStatus, triggerPopup, setShowSubtitles, setSubtitleOffset, setFontSize, setYoutubeUrl, setYoutubeVideoId, setMode, extractYoutubeVideoId, playerRef, setIsPlaying, formatTime]);
    return { socket, isReceivingUpdate };
}
