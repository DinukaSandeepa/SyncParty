'use client';

export default function MediaSourceSection({
    mode,
    setMode,
    isInRoom,
    youtubeUrl,
    onYoutubeUrlChange,
    onLoadYoutube,
    onVideoFileChange,
    onSubtitleFileChange,
    onResetMedia,
    addStatus
}) {
    const handleModeChange = (newMode) => {
        setMode(newMode);
        addStatus(`Switched to ${newMode === 'local' ? 'Local Video' : 'YouTube'} mode`);
    };

    return (
        <div className="p-6 mb-6 transition-all duration-300 delay-200 border bg-white/5 rounded-xl border-white/5 animate-fade-in-up hover:border-white/20">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Media Source</h2>
                <button
                    onClick={onResetMedia}
                    className="px-4 py-1 text-sm font-medium text-red-400 transition-all duration-300 border rounded-lg border-red-500/50 hover:bg-red-500/10 hover:border-red-500 hover:text-red-300"
                >
                    Reset
                </button>
            </div>
            <div className="flex gap-3 mb-6">
                <button
                    onClick={() => handleModeChange('local')}
                    disabled={isInRoom}
                    className={`flex-1 px-6 py-3 font-medium rounded-lg transition-all duration-300 border ${mode === 'local'
                        ? 'bg-white text-black border-white hover:bg-white/80'
                        : 'bg-white/10 text-white border-white/30 hover:bg-white/15'
                        } disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95`}
                >
                    🎬 Local Video
                </button>
                <button
                    onClick={() => handleModeChange('youtube')}
                    disabled={isInRoom}
                    className={`flex-1 px-6 py-3 font-medium rounded-lg transition-all duration-300 border ${mode === 'youtube'
                        ? 'bg-white text-black border-white hover:bg-white/80'
                        : 'bg-white/10 text-white border-white/30 hover:bg-white/15'
                        } disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95`}
                >
                    📺 YouTube
                </button>
            </div>
            {mode === 'local' && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className="block mb-2 text-sm font-medium">Video File</label>
                        <input
                            type="file"
                            accept="video/*,.mkv,.mp4,.webm,.avi,.mov,.wmv,.flv,.m4v"
                            onChange={onVideoFileChange}
                            className="w-full px-4 py-2 transition-all duration-300 border rounded-lg bg-white/10 border-white/30 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white file:text-black hover:file:bg-white/80 file:cursor-pointer hover:bg-white/15"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium">Subtitle File (.srt or .vtt)</label>
                        <input
                            type="file"
                            accept=".srt,.vtt"
                            onChange={onSubtitleFileChange}
                            className="w-full px-4 py-2 transition-all duration-300 border rounded-lg bg-white/10 border-white/30 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-white/30 file:bg-black file:text-white hover:file:bg-black/80 file:cursor-pointer hover:bg-white/15"
                        />
                    </div>
                </div>
            )}
            {mode === 'youtube' && (
                <div>
                    <label className="block mb-2 text-sm font-medium">YouTube URL</label>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={youtubeUrl}
                            onChange={onYoutubeUrlChange}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="flex-1 px-4 py-2 transition-all duration-300 border rounded-lg bg-white/10 border-white/30 focus:outline-none focus:ring-2 focus:ring-white hover:bg-white/15"
                        />
                        <button
                            onClick={onLoadYoutube}
                            className="px-6 py-2 font-medium text-black transition-all duration-300 bg-white rounded-lg hover:bg-white/80 hover:scale-105 active:scale-95"
                        >
                            Load
                        </button>
                    </div>
                    <p className="mt-2 text-xs text-white/60">Paste a YouTube URL (e.g., youtube.com/watch?v=... or youtu.be/...)</p>
                </div>
            )}
        </div>
    );
}
