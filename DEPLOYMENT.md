# SyncParty Deployment Guide

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
  "timestamp": "2025-11-20T15:30:00.000Z",
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
```

**Important**: 
- Replace `https://syncparty.onrender.com` with your actual Render backend URL!
- The variable MUST start with `NEXT_PUBLIC_` to be accessible in the browser
- **NO trailing slash** at the end of the URL

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
4. Check console for: `Connected to server` and `Joined room: test-room`

**Device 2:**
1. Open `https://sync-party.vercel.app`
2. Enter the SAME room name: `test-room`
3. Click "Join Room"
4. Check console for: `Connected to server` and `Joined room: test-room`
5. **Device 1 should show**: `User [ID] joined the room`

### 4. Test Synchronization
1. On Device 1: Load a video file
2. On Device 2: Load the SAME video file
3. On Device 1: Click play
4. **Device 2 should automatically start playing**

---

## Common Issues & Solutions

### Issue 1: "Connected to server" but rooms don't sync

**Cause**: Both devices are connecting to different backend servers (one to localhost, one to Render)

**Solution**: 
- Make sure BOTH devices are using the Vercel URL (not localhost)
- Verify `NEXT_PUBLIC_SOCKET_URL` is set correctly on Vercel
- Clear browser cache and hard refresh (Ctrl+Shift+R)

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
- Use a service like UptimeRobot to ping your backend every 5 minutes

### Issue 4: Different video files

**Cause**: Each user must load their own local video file

**Solution**:
- Both users need to have the SAME video file on their device
- Both users must manually select and load the file
- The app only syncs playback controls, not the video file itself

---

## Debugging Checklist

- [ ] Backend is deployed and accessible at Render URL
- [ ] Frontend is deployed and accessible at Vercel URL
- [ ] `FRONTEND_URL` on Render = Vercel URL (no trailing slash)
- [ ] `NEXT_PUBLIC_SOCKET_URL` on Vercel = Render URL (no trailing slash)
- [ ] Both environment variables are set correctly
- [ ] Frontend redeployed after setting environment variable
- [ ] Both devices accessing the SAME Vercel URL (not localhost)
- [ ] Both devices entering the EXACT same room name
- [ ] Both devices have loaded the same video file locally
- [ ] Browser console shows "Connected to server" on both devices
- [ ] Browser console shows "Joined room: [room-name]" on both devices

---

## Render Logs

To check backend logs:
1. Go to Render Dashboard
2. Click your service
3. Click **Logs** tab
4. Look for messages like:
   - `Server running on port 3001`
   - `User [ID] connected`
   - `User [ID] joined room: [room-name] (2 users in room)`

If you see "2 users in room", both devices are successfully connected!

---

## Need More Help?

If rooms still aren't syncing:
1. Check Render logs for errors
2. Check browser console on both devices
3. Verify both devices are on the same network (or different networks to test internet connectivity)
4. Try using incognito/private browsing mode
5. Make sure both users are using the latest deployment (clear cache)
