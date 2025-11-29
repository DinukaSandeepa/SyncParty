<div align="center">

# 🎬 SyncParty

### Watch Together, Perfectly Synced

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?style=for-the-badge&logo=socket.io)](https://socket.io/)
[![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express)](https://expressjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**A real-time synchronized media player that lets you watch local videos or YouTube together with friends, featuring perfect playback sync, subtitle support, and user authentication.**

[Live Demo](https://sync.dinukasandeepa.com) · [Report Bug](https://github.com/DinukaSandeepa/SyncParty/issues) · [Request Feature](https://github.com/DinukaSandeepa/SyncParty/issues)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Usage Guide](#-usage-guide)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

SyncParty is a modern web application that enables multiple users to watch videos together in perfect synchronization. Whether you're hosting a virtual movie night with friends across the globe or collaborating on video content, SyncParty ensures everyone's playback stays in sync.

### Why SyncParty?

- **No Video Upload Required**: Watch local files directly from your device
- **YouTube Integration**: Paste any YouTube URL and watch together instantly
- **Zero Latency Sync**: Real-time synchronization using WebSocket technology
- **Privacy First**: Videos stay on your device; only playback commands are synced
- **Modern Authentication**: Secure user authentication powered by Clerk

---

## ✨ Features

### 🔄 Real-time Synchronization
- **Instant Sync**: Play, pause, and seek operations synchronized across all room participants within milliseconds
- **State Recovery**: New joiners automatically receive the current room state (playback position, subtitle settings, etc.)
- **Debounced Seeking**: Smart seek synchronization prevents event spam while maintaining accuracy
- **Username Display**: See who performed each action in real-time

### 🎬 Media Support
| Feature | Local Videos | YouTube |
|---------|-------------|---------|
| Supported Formats | `.mp4`, `.mkv`, `.webm`, `.avi`, `.mov`, `.wmv`, `.flv`, `.m4v` | Any valid YouTube URL |
| Subtitle Support | ✅ `.srt`, `.vtt` | ❌ (Use YouTube's built-in) |
| Auto URL Sync | N/A | ✅ |
| Quality Control | Native | Via YouTube Player |

### 📝 Subtitle System
- **Format Support**: SRT and WebVTT files
- **Auto-Conversion**: SRT files automatically converted to WebVTT
- **Timing Adjustment**: Offset subtitles from -10s to +10s
- **Font Customization**: Adjust size from 12px to 64px
- **Cross-Platform Fonts**: Sinhala font support for Windows users
- **Synced Settings**: All subtitle preferences sync across users

### 🎨 User Interface
- **Dark Theme**: Sleek monochrome design optimized for video watching
- **Glassmorphism Effects**: Modern translucent UI elements
- **Animated Transitions**: Smooth fade-in animations for all components
- **Real-time Notifications**: Popup alerts for user actions (join, play, pause, seek)
- **Activity Log**: Timestamped event log for all synchronization events
- **Responsive Design**: Works on desktop and tablet devices

### 🔐 Authentication
- **Clerk Integration**: Secure sign-in/sign-up functionality
- **User Profiles**: Display names shown in activity notifications
- **Guest Support**: Users can join rooms without signing in

### 🎮 Video Player (Plyr)
- **Modern Controls**: Play, pause, progress bar, volume, captions, settings, PiP, AirPlay, fullscreen
- **Keyboard Navigation**: Full keyboard control support
- **Mobile Friendly**: Touch-optimized controls

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| [Next.js](https://nextjs.org/) | 16.0.3 | React framework with App Router |
| [React](https://react.dev/) | 19.2.0 | UI component library |
| [Socket.IO Client](https://socket.io/) | 4.8.1 | Real-time bidirectional communication |
| [Plyr](https://plyr.io/) | 3.8.3 | Media player with YouTube support |
| [Clerk](https://clerk.com/) | 6.35.4 | Authentication & user management |
| [Tailwind CSS](https://tailwindcss.com/) | 3.4.18 | Utility-first CSS framework |
| [SparkMD5](https://github.com/nicbell/spark-md5) | 3.0.2 | File hashing utility |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| [Node.js](https://nodejs.org/) | 18+ | JavaScript runtime |
| [Express](https://expressjs.com/) | 5.1.0 | Web application framework |
| [Socket.IO](https://socket.io/) | 4.8.1 | WebSocket server |
| [CORS](https://github.com/expressjs/cors) | 2.8.5 | Cross-origin resource sharing |

### Development Tools
| Tool | Purpose |
|------|---------|
| [Nodemon](https://nodemon.io/) | Hot-reload for backend development |
| [PostCSS](https://postcss.org/) | CSS processing |
| [Autoprefixer](https://github.com/postcss/autoprefixer) | CSS vendor prefixing |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Browsers                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   User A    │  │   User B    │  │   User C    │              │
│  │  (Next.js)  │  │  (Next.js)  │  │  (Next.js)  │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          │    WebSocket   │   Connection   │
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Socket.IO Server (Express)                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      Room Manager                          │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │  │
│  │  │   Room 1    │  │   Room 2    │  │   Room N    │        │  │
│  │  │ - isPlaying │  │ - isPlaying │  │ - isPlaying │        │  │
│  │  │ - time      │  │ - time      │  │ - time      │        │  │
│  │  │ - settings  │  │ - settings  │  │ - settings  │        │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘        │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Action**: User performs an action (play, pause, seek)
2. **Client Emit**: Frontend emits Socket.IO event with action data
3. **Server Broadcast**: Backend updates room state and broadcasts to all room members
4. **Client Receive**: All clients receive the event and update their players
5. **UI Update**: Activity log and notifications display the action

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm**, **yarn**, **pnpm**, or **bun** package manager
- **Git** for cloning the repository

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/DinukaSandeepa/SyncParty.git
   cd SyncParty
   ```

2. **Install all dependencies** (recommended)
   ```bash
   npm run install:all
   ```

   Or install separately:
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend
   cd ../frontend && npm install
   ```

3. **Configure environment variables**

   Create `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   ```

   Create `backend/.env`:
   ```env
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start the development servers**

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

### Quick Start with Root Scripts

```bash
# From the root directory
npm run dev:backend   # Start backend with nodemon
npm run dev:frontend  # Start frontend dev server
```

---

## 📖 Usage Guide

### Creating a Watch Party

1. **Sign In** (optional): Click "Sign In" to authenticate with Clerk
2. **Enter Room Name**: Type a unique room name (e.g., "movie-night-2024")
3. **Join Room**: Click "Join Room" to enter

### Watching Local Videos

1. Select **🎬 Local Video** mode
2. Click the video file input and select your video
3. (Optional) Add a subtitle file (`.srt` or `.vtt`)
4. Share the room name with friends
5. Friends must load the **same video file** on their device

### Watching YouTube

1. Select **📺 YouTube** mode
2. Paste a YouTube URL:
   - `https://www.youtube.com/watch?v=VIDEO_ID`
   - `https://youtu.be/VIDEO_ID`
   - `https://www.youtube.com/embed/VIDEO_ID`
3. Click **Load**
4. The video automatically syncs to all room members!

### Subtitle Controls (Local Videos)

| Control | Range | Description |
|---------|-------|-------------|
| Visibility | ON/OFF | Toggle subtitle display |
| Offset | -10s to +10s | Adjust subtitle timing |
| Font Size | 12px to 64px | Customize text size |

---

## ⌨️ Keyboard Shortcuts

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

## 📡 API Reference

### Socket.IO Events

#### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join-room` | `roomId: string, username: string` | Join a specific room |
| `play-video` | `{ roomId, currentTime }` | Broadcast play action |
| `pause-video` | `{ roomId, currentTime }` | Broadcast pause action |
| `seek-video` | `{ roomId, currentTime }` | Broadcast seek action |
| `youtube-url-change` | `{ roomId, youtubeUrl }` | Share YouTube video |
| `subtitle-loaded` | `{ roomId, fileName, fileSize }` | Notify subtitle load |
| `subtitle-toggle` | `{ roomId, visible }` | Toggle subtitle visibility |
| `subtitle-offset` | `{ roomId, offset }` | Change subtitle timing |
| `font-size-change` | `{ roomId, fontSize }` | Change subtitle size |

#### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `room-state` | `RoomState` | Current room state on join |
| `user-joined` | `{ userId, username }` | User joined notification |
| `play-video` | `{ currentTime, username }` | Play command |
| `pause-video` | `{ currentTime, username }` | Pause command |
| `seek-video` | `{ currentTime, username }` | Seek command |
| `youtube-url-change` | `{ youtubeUrl, username }` | YouTube URL update |
| `subtitle-toggle` | `{ visible }` | Subtitle visibility change |
| `subtitle-offset` | `{ offset }` | Subtitle offset change |
| `font-size-change` | `{ fontSize }` | Font size change |

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Server info and version |
| `GET` | `/health` | Health check with stats |

#### Health Check Response
```json
{
  "status": "ok",
  "timestamp": "2024-11-29T12:00:00.000Z",
  "rooms": 5,
  "connections": 12
}
```

---

## 🌐 Deployment

> **📘 For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

### Quick Deploy

#### Frontend → Vercel

1. Import repository on [Vercel](https://vercel.com)
2. Set root directory: `frontend`
3. Add environment variables:
   ```
   NEXT_PUBLIC_SOCKET_URL=https://your-backend.onrender.com
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
   CLERK_SECRET_KEY=sk_...
   ```
4. Deploy!

#### Backend → Render

1. Create Web Service on [Render](https://render.com)
2. Set root directory: `backend`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variable:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
6. Deploy!

### Production URLs

| Service | URL |
|---------|-----|
| Frontend | `https://sync-party.vercel.app` or custom domain |
| Backend | `https://syncparty.onrender.com` |

---

## 📁 Project Structure

```
SyncParty/
├── backend/
│   ├── server.js              # Socket.IO server & Express app
│   └── package.json           # Backend dependencies
│
├── frontend/
│   ├── app/
│   │   ├── layout.jsx         # Root layout with Clerk provider
│   │   ├── page.jsx           # Main application component
│   │   └── globals.css        # Global styles & animations
│   ├── next.config.js         # Next.js configuration
│   ├── tailwind.config.js     # Tailwind CSS configuration
│   ├── postcss.config.js      # PostCSS configuration
│   ├── proxy.js               # Development proxy (optional)
│   └── package.json           # Frontend dependencies
│
├── package.json               # Root scripts
├── README.md                  # This file
└── DEPLOYMENT.md              # Deployment guide
```

---

## ⚙️ Configuration

### Frontend Configuration

**`next.config.js`**
```javascript
const nextConfig = {
  reactStrictMode: true,
}
```

**`tailwind.config.js`**
- Custom color palette with primary shades
- Content paths for all component directories

### Backend Configuration

**CORS Origins** (configured in `server.js`):
- `http://localhost:3000` (development)
- `https://sync-party.vercel.app` (production)
- `https://sync.dinukasandeepa.com` (custom domain)
- All `*.vercel.app` subdomains

---

## 🔧 Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| Rooms not syncing | Verify both users are on the same environment (not mixing localhost with production) |
| WebSocket errors | Check CORS configuration and `FRONTEND_URL` environment variable |
| YouTube not loading | Ensure valid YouTube URL format |
| Subtitles not showing | Check file format (SRT/VTT) and try toggling visibility |
| Connection timeout | Render free tier may sleep; wait 30-60 seconds for cold start |

### Debug Checklist

- [ ] Backend accessible at health endpoint
- [ ] Frontend `NEXT_PUBLIC_SOCKET_URL` set correctly
- [ ] Backend `FRONTEND_URL` matches frontend domain
- [ ] No trailing slashes in URLs
- [ ] Browser console shows "Connected to server"
- [ ] Both users in the exact same room name

### Viewing Logs

**Browser Console**: Press `F12` → Console tab
**Render Logs**: Dashboard → Service → Logs tab

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Test synchronization with multiple browser tabs
- Update documentation for new features

### Ideas for Contributions

- [ ] Chat functionality
- [ ] Room passwords/private rooms
- [ ] Persistent room state (database)
- [ ] Playlist support
- [ ] Mobile app (React Native)
- [ ] Screen sharing integration
- [ ] Video streaming/file sharing

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Dinuka Sandeepa**

- Website: [dinukasandeepa.com](https://dinukasandeepa.com)
- GitHub: [@DinukaSandeepa](https://github.com/DinukaSandeepa)

---

<div align="center">

**⭐ Star this repo if you find it useful!**

Made with ❤️ for synchronized movie nights

</div>