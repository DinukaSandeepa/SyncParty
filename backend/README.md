# SyncParty Backend - Python Socket.IO Server

A real-time video synchronization server built with FastAPI and Socket.IO for the SyncParty application.

## Features

- **Real-time synchronization**: Play, pause, seek, and video URL changes synced across all users in a room
- **Room-based architecture**: Multiple isolated rooms with independent state management
- **Subtitle support**: Synchronized subtitle visibility, offset, and font size
- **User management**: Track users per room with join/leave notifications
- **In-memory state**: Fast, ephemeral state storage (no database required)
- **CORS support**: Configured for local development and production deployments

## Tech Stack

- **FastAPI**: Modern Python web framework for building APIs
- **python-socketio**: Socket.IO server compatible with JavaScript clients
- **Uvicorn**: High-performance ASGI server
- **python-dotenv**: Environment variable management

## Prerequisites

- Python 3.11 or higher
- pip (Python package manager)

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file (optional):
```bash
cp .env.example .env
```

3. Configure environment variables:
```env
PORT=3001
FRONTEND_URL=http://localhost:3000
```

## Running the Server

### Development

Run with auto-reload:
```bash
uvicorn server:socket_app --reload --host 0.0.0.0 --port 3001
```

Or run directly:
```bash
python server.py
```

### Production

```bash
uvicorn server:socket_app --host 0.0.0.0 --port $PORT
```

## API Endpoints

### HTTP Endpoints

- `GET /` - Server information
  - Returns: `{ message: string, version: string }`

- `GET /health` - Health check with server statistics
  - Returns: `{ status: string, timestamp: string, rooms: number, connections: number }`

### Socket.IO Events

#### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join-room` | `(roomId, username, userInfo)` | Join a room |
| `leave-room` | `(roomId)` | Leave a room |
| `play-video` | `{ roomId, currentTime }` | Play video at specified time |
| `pause-video` | `{ roomId, currentTime }` | Pause video at specified time |
| `seek-video` | `{ roomId, currentTime }` | Seek to specific time |
| `change-video` | `{ roomId, youtubeUrl }` | Change video URL |
| `subtitle-loaded` | `{ roomId, fileName, fileSize }` | Notify subtitle loaded |
| `subtitle-toggle` | `{ roomId, visible }` | Toggle subtitle visibility |
| `subtitle-offset` | `{ roomId, offset }` | Change subtitle timing offset |
| `font-size-change` | `{ roomId, fontSize }` | Change subtitle font size |

#### Server → Client

| Event | Payload | Recipients | Description |
|-------|---------|------------|-------------|
| `room-state` | Room state object | Joining user | Current room state |
| `room-users` | User array | All in room | Updated user list |
| `user-joined` | User object | Others in room | New user notification |
| `user-left` | User object | Others in room | User left notification |
| `play-video` | `{ currentTime, username }` | Others in room | Sync play |
| `pause-video` | `{ currentTime, username }` | Others in room | Sync pause |
| `seek-video` | `{ currentTime, username }` | Others in room | Sync seek |
| `youtube-url-change` | `{ youtubeUrl, username }` | Others in room | Sync video change |
| `subtitle-loaded` | `{ userId, fileName, fileSize }` | Others in room | Subtitle loaded |
| `subtitle-toggle` | `{ visible }` | Others in room | Sync subtitle visibility |
| `subtitle-offset` | `{ offset }` | Others in room | Sync subtitle offset |
| `font-size-change` | `{ fontSize }` | Others in room | Sync font size |

## State Management

### Room State
```python
{
    'isPlaying': bool,
    'currentTime': float,
    'subtitleVisible': bool,
    'subtitleOffset': float,
    'fontSize': int,
    'youtubeUrl': str | None
}
```

### User Data
```python
{
    'visibleId': str,      # Socket ID
    'oderId': str,         # User ID from auth or socket ID
    'username': str,
    'imageUrl': str | None,
    'joinedAt': int        # Unix timestamp in milliseconds
}
```

## Architecture

- **In-memory storage**: All state is stored in Python dictionaries (ephemeral)
- **Room lifecycle**: Rooms are created on first join and deleted when last user leaves
- **Event broadcasting**: Uses Socket.IO rooms for efficient message routing
- **Async operations**: All Socket.IO handlers are async for optimal performance

## Performance Optimization

- **Async/await**: Non-blocking I/O for handling multiple connections
- **Event-driven**: Push-based updates minimize polling overhead
- **Minimal state**: Only essential sync data is stored and transmitted
- **Room isolation**: Each room operates independently

## CORS Configuration

Allowed origins:
- `http://localhost:3000` (development)
- `https://sync-party.vercel.app` (production)
- `https://sync.dinukasandeepa.com` (custom domain)
- All `*.vercel.app` domains
- Custom `FRONTEND_URL` from environment

## Deployment

### Render.com

1. Create a new Web Service
2. Select "Python" as the environment
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn server:socket_app --host 0.0.0.0 --port $PORT`
5. Add environment variables:
   - `FRONTEND_URL`: Your frontend URL

The `Procfile` and `runtime.txt` files are included for automatic configuration.

## Testing

Check server health:
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-06T...",
  "rooms": 0,
  "connections": 0
}
```

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
