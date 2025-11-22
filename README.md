# SyncParty 🎉

A synchronized media player that allows multiple users to watch local video files together with perfectly synced playback and subtitle support.

## Features

✨ **Real-time Synchronization**
- Synchronized play/pause/seek across all users in a room
- Automatic state synchronization for new joiners

🎬 **Media Support**
- **Local video file playback** (supports .mp4, .mkv, .webm, .avi, .mov, .wmv, .flv, .m4v)
- **YouTube video support** (paste any YouTube URL to watch together)
- Subtitle support for local videos (.srt and .vtt formats)
- Automatic SRT to WebVTT conversion

🎛️ **Subtitle Controls**
- Toggle subtitle visibility
- Adjust subtitle timing offset (-10s to +10s)
- Customize font size (12px to 64px)
- All subtitle settings sync across users

🎨 **Modern UI**
- Sleek Monochrome / Black & White design
- Minimalist aesthetic with glassmorphism effects
- Real-time activity log
- Responsive layout
- Dark mode optimized

## Tech Stack

**Frontend:**
- Next.js 16
- React 19
- Socket.IO Client
- Tailwind CSS

**Backend:**
- Node.js
- Express 5
- Socket.IO
- CORS

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SyncParty
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Running Locally

You need to run both the backend and frontend servers.

**Option 1: Run in separate terminals**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```
The backend will start on `http://localhost:3001`

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```
The frontend will start on `http://localhost:3000`

**Option 2: Run both with npm-run-all (if configured)**
```bash
npm run dev
```

### Usage

1. **Open the application** in your browser at `http://localhost:3000`

2. **Join a room**
   - Enter a room name (e.g., "party1")
   - Click "Join Room"

3. **Choose your media source**
   - **🎬 Local Video Mode**: Select a video file from your local system
   - **📺 YouTube Mode**: Paste a YouTube URL and click "Load"

4. **Load media files**
   - For local videos: Select a video file and optionally a subtitle file (.srt or .vtt)
   - For YouTube videos: Paste any YouTube URL (e.g., youtube.com/watch?v=... or youtu.be/...)

5. **Invite friends**
   - Share the room name with friends
   - They should join the same room
   - For local videos, they must load the same video file
   - For YouTube videos, the URL will be automatically synced!

6. **Watch together!**
   - Play/pause/seek controls are synchronized
   - For local videos, subtitle settings are shared across all users
   - Activity log shows all sync events

## Testing the Sync Feature

1. Start the backend and frontend servers
2. Open two browser tabs to `http://localhost:3000`
3. Join the same room (e.g., "party1") in both tabs
4. Load the same video file in both tabs
5. Click play in one tab → the other tab should start playing automatically
6. Try pausing, seeking, and adjusting subtitle settings
7. Check the activity log to see sync events

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### Backend (.env)
```env
PORT=3001
FRONTEND_URL=http://localhost:3000
```

## Deployment

**⚠️ IMPORTANT: For detailed deployment instructions and troubleshooting, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

### Quick Deployment Guide

### Frontend (Vercel)

1. Push your code to GitHub
2. Import the project in Vercel
3. Set the root directory to `frontend`
4. Add environment variable:
   - `NEXT_PUBLIC_SOCKET_URL`: Your deployed backend URL (e.g., `https://syncparty.onrender.com`)
5. Deploy!

### Backend (Render/Railway)

**Render:**
1. Create a new Web Service
2. Connect your repository
3. Set root directory to `backend`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variable:
   - `FRONTEND_URL`: Your deployed frontend URL (e.g., `https://sync-party.vercel.app`)
7. Deploy!

**Railway:**
1. Create a new project
2. Connect your repository
3. Set root directory to `backend`
4. Add environment variable:
   - `FRONTEND_URL`: Your deployed frontend URL
5. Deploy!

### Troubleshooting Deployment

If rooms aren't syncing between devices after deployment, check [DEPLOYMENT.md](./DEPLOYMENT.md) for:
- CORS configuration issues
- Environment variable setup
- Connection debugging steps
- Common deployment problems and solutions

## Project Structure

```
SyncParty/
├── backend/
│   ├── server.js          # Socket.IO server with room management
│   └── package.json       # Backend dependencies
├── frontend/
│   ├── app/
│   │   ├── layout.jsx     # Root layout
│   │   ├── page.jsx       # Main application page
│   │   └── globals.css    # Global styles
│   ├── next.config.js     # Next.js configuration
│   ├── tailwind.config.js # Tailwind CSS configuration
│   ├── postcss.config.js  # PostCSS configuration
│   └── package.json       # Frontend dependencies
└── README.md              # This file
```

## Socket.IO Events

### Client → Server
- `join-room`: Join a specific room
- `play-video`: Broadcast play event with timestamp
- `pause-video`: Broadcast pause event with timestamp
- `seek-video`: Broadcast seek event with new timestamp
- `youtube-url-change`: Broadcast YouTube URL change
- `subtitle-loaded`: Notify room of loaded subtitle
- `subtitle-toggle`: Sync subtitle visibility
- `subtitle-offset`: Sync subtitle offset
- `font-size-change`: Sync font size

### Server → Client
- `room-state`: Current room state (sent on join)
- `user-joined`: Notification when a user joins
- `play-video`: Play command with timestamp
- `pause-video`: Pause command with timestamp
- `seek-video`: Seek command with timestamp
- `youtube-url-change`: YouTube URL change notification
- `subtitle-loaded`: Subtitle loaded notification
- `subtitle-toggle`: Subtitle visibility change
- `subtitle-offset`: Subtitle offset change
- `font-size-change`: Font size change

## Known Limitations

- Users must manually select the same video file (files are not shared/streamed)
- Subtitle files are also loaded locally (not shared)
- No user authentication or room passwords
- No persistent room state (state is lost on server restart)

## Future Enhancements

- [ ] File sharing/streaming capability
- [ ] User authentication
- [ ] Room passwords
- [ ] Persistent room state
- [ ] Chat functionality
- [ ] Video quality selection
- [ ] Playlist support
- [ ] Mobile app

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
