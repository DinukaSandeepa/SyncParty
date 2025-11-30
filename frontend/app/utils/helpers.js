export function extractYoutubeVideoId(url) {
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
}

export function parseSRT(srtContent) {
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
}

export function formatTime(seconds) {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    if (hh) {
        return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
    }
    return `${mm}:${ss}`;
}
