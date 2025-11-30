'use client';

import { forwardRef } from 'react';

const VideoPlayer = forwardRef(function VideoPlayer({
    mode,
    videoFile,
    youtubeVideoId,
    subtitleFile,
    fontSize,
    isWindows,
    trackRef
}, videoRef) {
    if (!videoFile && !youtubeVideoId) return null;
    return (
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
    );
});

export default VideoPlayer;
