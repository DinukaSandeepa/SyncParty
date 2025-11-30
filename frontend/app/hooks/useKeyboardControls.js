'use client';

import { useEffect } from 'react';

export function useKeyboardControls(playerRef) {
    useEffect(() => {
        const handleKeyDown = (e) => {
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
    }, [playerRef]);
}
