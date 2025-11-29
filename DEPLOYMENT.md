# SyncParty Deployment Guide

## Overview

This guide covers deploying SyncParty to production using **Vercel** (frontend) and **Render** (backend). The app supports both local video files and YouTube videos with real-time synchronization.

### Tech Stack
- **Frontend**: Next.js 16, React 19, Socket.IO Client, Plyr, Clerk Auth, Tailwind CSS
- **Backend**: Express 5, Socket.IO 4.8, CORS

---

## Problem: Rooms Not Syncing Between Devices

If users on different devices can't join the same room, it's usually a **CORS or Socket.IO connection issue**. Follow this guide to fix it.

---

## Backend Deployment (Render)

### 1. Deploy to Render
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Create a new **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node

### 2. Set Environment Variables on Render

Go to your service → **Environment** tab and add:

```
PORT=3001
FRONTEND_URL=https://sync-party.vercel.app
```

**Important**: Replace `https://sync-party.vercel.app` with your actual Vercel URL!

> **Note**: The backend automatically allows the following origins in addition to `FRONTEND_URL`:
> - `http://localhost:3000` (development)
> - `https://sync-party.vercel.app`
> - `https://sync.dinukasandeepa.com` (custom domain)
> - All `*.vercel.app` subdomains

### 3. Verify Backend is Running

After deployment, visit your Render URL (e.g., `https://syncparty.onrender.com/`). You should see:

```json
{
  "message": "SyncParty Socket.IO Server",
  "version": "1.0.0"
}
```

Also check the health endpoint: `https://syncparty.onrender.com/health`

```json
{
  "status": "ok",
  "timestamp": "2025-11-29T15:30:00.000Z",
  "rooms": 0,
  "connections": 0
}
```

---

## Frontend Deployment (Vercel)

### 1. Deploy to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Import your GitHub repository
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 2. Set Environment Variables on Vercel

Go to your project → **Settings** → **Environment Variables** and add:

```
NEXT_PUBLIC_SOCKET_URL=https://syncparty.onrender.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
```

**Important**: 
- Replace `https://syncparty.onrender.com` with your actual Render backend URL!
- The `NEXT_PUBLIC_` prefix is required for client-side accessible variables
- **NO trailing slash** at the end of the URL
- Clerk keys are required for user authentication (optional but recommended)

### 3. Redeploy After Adding Environment Variable

After adding the environment variable, you MUST redeploy:
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click the **⋯** menu → **Redeploy**
4. Check "Use existing Build Cache" is OFF
5. Click **Redeploy**

---

## Testing the Connection

### 1. Open Browser Console
On both devices, open the browser console (F12 → Console tab)

### 2. Check for Connection Errors
Look for errors like:
- `WebSocket connection failed`
- `CORS error`
- `Socket.IO connection timeout`

### 3. Test Room Joining

**Device 1:**
1. Open `https://sync-party.vercel.app`
2. Enter room name: `test-room`
3. Click "Join Room"
4. Check Activity Log for: `Connected to server` and `Joined room: test-room`

**Device 2:**
1. Open `https://sync-party.vercel.app`
2. Enter the SAME room name: `test-room`
3. Click "Join Room"
4. Check Activity Log for: `Connected to server` and `Joined room: test-room`
5. **Device 1 should show**: `[Username] joined the room` with a popup notification

### 4. Test Local Video Synchronization
1. On Device 1: Select **🎬 Local Video** mode and load a video file
2. On Device 2: Select **🎬 Local Video** mode and load the SAME video file
3. On Device 1: Click play
4. **Device 2 should automatically start playing**

### 5. Test YouTube Synchronization
1. On Device 1: Select **📺 YouTube** mode
2. Paste a YouTube URL and click **Load**
3. **Device 2 should automatically load the same YouTube video**
4. Play/pause/seek actions sync in real-time

---

## Common Issues & Solutions

### Issue 1: "Connected to server" but rooms don't sync

**Cause**: Both devices are connecting to different backend servers (one to localhost, one to Render)

**Solution**: 
- Make sure BOTH devices are using the Vercel URL (not localhost)
- Verify `NEXT_PUBLIC_SOCKET_URL` is set correctly on Vercel
- Clear browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R on Mac)

### Issue 2: "WebSocket connection failed"

**Cause**: CORS is blocking the connection

**Solution**:
- Verify `FRONTEND_URL` on Render matches your Vercel URL exactly
- Check Render logs for CORS errors
- Make sure there's no trailing slash in URLs

### Issue 3: "Connection timeout"

**Cause**: Render free tier may sleep after inactivity

**Solution**:
- Wait 30-60 seconds for Render to wake up
- Consider upgrading to a paid Render plan
- Use a service like UptimeRobot to ping your backend `/health` endpoint every 5 minutes

### Issue 4: Different video files (Local Mode)

**Cause**: Each user must load their own local video file

**Solution**:
- Both users need to have the SAME video file on their device
- Both users must manually select and load the file
- The app only syncs playback controls, not the video file itself
- Consider using **YouTube mode** for easier sharing

### Issue 5: Video plays but no audio

**Cause**: Unsupported audio codec (e.g., E-AC-3/Dolby Digital Plus, DTS)

**Solution**:
- Convert audio to AAC using FFmpeg:
  ```bash
  ffmpeg -i "input.mkv" -c:v copy -c:a aac -b:a 384k "output.mkv"
  ```
- Or use YouTube mode which handles all encoding

### Issue 6: Subtitles not showing

**Cause**: Subtitle file format or visibility toggle

**Solution**:
- Ensure subtitle file is `.srt` or `.vtt` format
- Check the "Subtitles ON/OFF" toggle in Subtitle Controls
- SRT files are automatically converted to WebVTT
- Subtitles are only available in Local Video mode

### Issue 7: YouTube mode not loading

**Cause**: Invalid YouTube URL format

**Solution**:
- Use valid URL formats:
  - `https://www.youtube.com/watch?v=VIDEO_ID`
  - `https://youtu.be/VIDEO_ID`
  - `https://www.youtube.com/embed/VIDEO_ID`
- Make sure the video is not private or restricted

---

## Debugging Checklist

- [ ] Backend is deployed and accessible at Render URL (`/` and `/health` endpoints)
- [ ] Frontend is deployed and accessible at Vercel URL
- [ ] `FRONTEND_URL` on Render = Vercel URL (no trailing slash)
- [ ] `NEXT_PUBLIC_SOCKET_URL` on Vercel = Render URL (no trailing slash)
- [ ] Clerk environment variables set on Vercel (if using auth)
- [ ] Frontend redeployed after setting environment variables
- [ ] Both devices accessing the SAME Vercel URL (not localhost)
- [ ] Both devices entering the EXACT same room name
- [ ] For local videos: Both devices have loaded the same video file
- [ ] Activity Log shows "Connected to server" on both devices
- [ ] Activity Log shows "Joined room: [room-name]" on both devices
- [ ] User join popup notification appears when second user joins

---

## Synchronized Events

The following actions are synchronized across all room members:

| Event | Description |
|-------|-------------|
| Play | Starts playback at the same timestamp |
| Pause | Pauses playback at the same timestamp |
| Seek | Jumps to the same timestamp (300ms debounce) |
| YouTube URL | Loads the same YouTube video for all users |
| Subtitle Toggle | Syncs subtitle visibility (local mode only) |
| Subtitle Offset | Syncs subtitle timing offset |
| Font Size | Syncs subtitle font size |

---

## Room State

When a new user joins a room, they automatically receive the current room state:
- Current playback position
- Play/pause status
- Subtitle settings (visibility, offset, font size)
- YouTube URL (if in YouTube mode)

---

## Render Logs

To check backend logs:
1. Go to Render Dashboard
2. Click your service
3. Click **Logs** tab
4. Look for messages like:
   - `Server running on port 3001`
   - Socket.IO connection events

---

## Local Development

### Running Locally

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Server runs on `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
App runs on `http://localhost:3000`

### Environment Variables for Local Development

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` or `K` | Play/Pause |
| `F` | Toggle Fullscreen |
| `M` | Mute/Unmute |
| `←` or `J` | Rewind 10 seconds |
| `→` or `L` | Forward 10 seconds |
| `↑` | Increase Volume |
| `↓` | Decrease Volume |

---

## Need More Help?

If rooms still aren't syncing:
1. Check Render logs for errors
2. Check browser console on both devices (F12 → Console)
3. Check the Activity Log in the app for sync events
4. Verify both devices are on different networks to test internet connectivity
5. Try using incognito/private browsing mode
6. Make sure both users are using the latest deployment (clear cache)
7. For YouTube: Ensure the video is not age-restricted or region-blocked
