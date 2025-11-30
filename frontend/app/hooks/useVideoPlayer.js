'use client';

import { useEffect, useRef } from 'react';

export function useVideoPlayer({
    mode,
    videoFile,
    youtubeVideoId,
    fontSize,
    addStatus,
    isReceivingUpdate,
    onPlay,
    onPause,
    onSeeked,
    onTimeUpdate
}) {
    const playerRef = useRef(null);
    const videoRef = useRef(null);
    const seekDebounceTimer = useRef(null);
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
                    if (!isReceivingUpdate.current) onPlay();
                });
                playerRef.current.on('pause', () => {
                    if (!isReceivingUpdate.current) onPause();
                });
                playerRef.current.on('seeked', () => {
                    if (!isReceivingUpdate.current) {
                        if (seekDebounceTimer.current) {
                            clearTimeout(seekDebounceTimer.current);
                        }
                        seekDebounceTimer.current = setTimeout(() => {
                            onSeeked();
                        }, 300);
                    }
                });
                playerRef.current.on('timeupdate', () => {
                    onTimeUpdate();
                });
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
    }, [videoFile, youtubeVideoId, mode, fontSize, addStatus, isReceivingUpdate, onPlay, onPause, onSeeked, onTimeUpdate]);
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
    return { playerRef, videoRef };
}
