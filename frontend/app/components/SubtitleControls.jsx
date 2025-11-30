'use client';

export default function SubtitleControls({
    showSubtitles,
    subtitleOffset,
    fontSize,
    onSubtitleToggle,
    onSubtitleOffsetChange,
    onFontSizeChange
}) {
    return (
        <div className="p-6 mb-6 transition-all duration-300 border bg-white/5 rounded-xl border-white/5 animate-fade-in-up delay-400 hover:border-white/20">
            <h2 className="mb-4 text-xl font-semibold">Subtitle Controls</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                    <label className="block mb-2 text-sm font-medium">Visibility</label>
                    <button
                        onClick={onSubtitleToggle}
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
                        onChange={onSubtitleOffsetChange}
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
                        onChange={onFontSizeChange}
                        className="w-full h-2 transition-all duration-300 rounded-lg appearance-none cursor-pointer bg-white/20 accent-gray-400 hover:bg-white/30"
                    />
                </div>
            </div>
        </div>
    );
}
