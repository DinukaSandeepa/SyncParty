# Quick Start Guide: YouTube Watch Party

## 🎉 New Feature: Watch YouTube Together!

You can now watch YouTube videos with your friends in perfect sync using SyncParty!

## How to Use

### Step 1: Join a Room
1. Enter a room name (e.g., "movie-night")
2. Click **"Join Room"**

### Step 2: Switch to YouTube Mode
1. Click the **"📺 YouTube"** button in the Media Source section
2. The interface will switch to YouTube mode

### Step 3: Load a YouTube Video
1. Copy any YouTube URL from your browser
   - Example: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
   - Or short URL: `https://youtu.be/dQw4w9WgXcQ`
2. Paste it into the "YouTube URL" input field
3. Click **"Load"**
4. The video will appear in the player below

### Step 4: Invite Friends
1. Share your room name with friends
2. Your friends join the same room
3. The YouTube video will **automatically sync** to their screen!
4. No need for them to paste the URL - it's already there! ✨

### Step 5: Watch Together
- Click play/pause in any browser
- All browsers stay in sync automatically
- Seeking works too - everyone follows along
- Check the Activity Log to see sync events

## Tips & Tricks

### Supported YouTube URL Formats
All of these work:
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- `https://www.youtube.com/v/VIDEO_ID`

### Switching Between Modes
- You can switch between Local Video and YouTube modes
- **Important**: You must switch BEFORE joining a room
- Once in a room, the mode selector is locked

### Troubleshooting

**"Invalid YouTube URL" message?**
- Make sure you copied the complete URL
- Check that it's a valid YouTube link
- Try copying the URL directly from the address bar

**Video not loading?**
- Some YouTube videos have embedding disabled
- Age-restricted videos may not work
- Region-locked content might not be available in your area
- Try a different video to test

**Not syncing with friends?**
- Make sure everyone joined the **same room name**
- Check the Activity Log for connection status
- Ensure you're connected to the server (look for "Connected to server" message)

## Comparing Modes

### Local Video Mode 🎬
- **Best for**: Watching your own video files
- **Pros**: Works offline, full subtitle control, any video format
- **Cons**: Everyone needs the same file, larger file sizes

### YouTube Mode 📺
- **Best for**: Easy sharing, no file downloads needed
- **Pros**: Automatic URL sync, streaming from YouTube, quality options
- **Cons**: Requires internet, limited subtitle customization

## Example Session

```
You:
1. Join room "friday-movie"
2. Click "YouTube" mode
3. Paste: https://www.youtube.com/watch?v=dQw4w9WgXcQ
4. Click "Load"
5. Wait for friends...

Your Friend:
1. Join room "friday-movie"
2. Video automatically loads! (no need to paste URL)
3. Click play and enjoy together!
```

## Need Help?

- Check the Activity Log for connection/sync events
- Make sure both frontend and backend servers are running
- Verify environment variables are set correctly
- See `DEPLOYMENT.md` for deployment issues

Enjoy your watch party! 🎉🍿
