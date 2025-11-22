# YouTube Watch Party Feature

## Overview
The YouTube watch party feature has been successfully implemented! Users can now watch YouTube videos together in real-time, with synchronized playback across all participants in a room.

## What's New

### Frontend Changes (`frontend/app/page.jsx`)
1. **New State Variables**:
   - `mode`: Tracks whether user is in 'local' or 'youtube' mode
   - `youtubeUrl`: Stores the YouTube URL input by the user
   - `youtubeVideoId`: Stores the extracted video ID from the URL

2. **YouTube URL Extraction**:
   - `extractYoutubeVideoId()`: Extracts video ID from various YouTube URL formats:
     - `youtube.com/watch?v=...`
     - `youtu.be/...`
     - `youtube.com/embed/...`
     - `youtube.com/v/...`

3. **Mode Selector UI**:
   - Two-button toggle between Local Video and YouTube modes
   - Mode selection is disabled once user joins a room
   - Clear visual indication of active mode

4. **YouTube URL Input**:
   - Text input for YouTube URL
   - "Load" button to validate and load the video
   - Helpful placeholder text and instructions

5. **Enhanced Plyr Integration**:
   - Updated Plyr initialization to support YouTube embeds
   - YouTube-specific options: noCookie, rel, showinfo, iv_load_policy, modestbranding
   - Conditional rendering: `<video>` for local files, `<div>` with data attributes for YouTube

6. **Socket Events**:
   - `youtube-url-change` (send): Broadcasts YouTube URL to other users in the room
   - `youtube-url-change` (receive): Updates local state when another user changes the URL
   - Room state now includes YouTube URL for new joiners

### Backend Changes (`backend/server.js`)
1. **Extended Room State**:
   - Added `youtubeUrl` field to room state
   - Initialized as `null` when room is created

2. **New Socket Event Handler**:
   - `youtube-url-change`: Receives YouTube URL from a user and broadcasts to all other users in the room
   - Updates room state so new joiners get the current YouTube URL

### Documentation Updates (`README.md`)
1. Updated features list to highlight YouTube support
2. Added usage instructions for YouTube mode
3. Updated socket events documentation
4. Clarified that YouTube URLs are automatically synced (unlike local files)

## How It Works

### User Flow
1. User joins a room
2. User selects YouTube mode
3. User pastes a YouTube URL and clicks "Load"
4. The app extracts the video ID and:
   - Displays the YouTube video using Plyr
   - Broadcasts the URL to other users in the room
5. When another user joins the room:
   - They receive the room state with the YouTube URL
   - The video automatically loads for them
6. All play/pause/seek actions are synchronized across all users

### Technical Details

**YouTube Video Rendering**:
```jsx
<div
  ref={videoRef}
  data-plyr-provider="youtube"
  data-plyr-embed-id={youtubeVideoId}
  className="w-full"
/>
```

**Plyr YouTube Options**:
```javascript
{
  youtube: {
    noCookie: false,
    rel: 0,              // Don't show related videos
    showinfo: 0,         // Don't show video info
    iv_load_policy: 3,   // Don't show annotations
    modestbranding: 1    // Minimal YouTube branding
  }
}
```

## Key Differences: Local vs YouTube Mode

| Feature | Local Video | YouTube Video |
|---------|-------------|---------------|
| File Loading | Each user loads their own file | URL is automatically synced |
| Subtitles | Supported (.srt, .vtt) | Uses YouTube's built-in captions |
| Subtitle Controls | Full control (offset, font size) | Controlled by YouTube |
| Network Usage | Files stored locally | Streamed from YouTube |
| Internet Required | No (after loading page) | Yes |

## Benefits

1. **No File Sharing Needed**: Users don't need to have the same video file
2. **Lower Bandwidth**: Video streams from YouTube, not through your server
3. **Easier Setup**: Just paste a URL instead of uploading large files
4. **Legal**: Uses official YouTube embeds
5. **Quality Options**: Users can adjust quality via YouTube player controls

## Limitations

1. **YouTube Captions Only**: Custom subtitle uploads not supported for YouTube videos
2. **Internet Required**: All users need active internet connection
3. **YouTube Restrictions**: Age-restricted or region-locked videos may not work for all users
4. **Embedding Disabled**: Some videos have embedding disabled and won't work

## Testing

To test the YouTube feature:

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Open two browser tabs to `http://localhost:3000`
4. In both tabs, join the same room (e.g., "test-room")
5. In tab 1:
   - Select YouTube mode
   - Paste a YouTube URL (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
   - Click "Load"
6. In tab 2:
   - The YouTube URL should automatically sync
   - The same video should appear
7. Try playing/pausing/seeking in either tab
8. Both tabs should stay in sync!

## Future Enhancements

- [ ] Support for other video platforms (Vimeo, Dailymotion, etc.)
- [ ] Playlist support for YouTube
- [ ] Custom subtitle overlay for YouTube videos
- [ ] Video platform auto-detection from URL
- [ ] Queue system for multiple videos

## Migration Notes

- Existing local video functionality remains unchanged
- No breaking changes to existing features
- Backward compatible with deployed instances
- No new dependencies required (Plyr already supports YouTube)
