#!/usr/bin/env python3
"""
SyncParty Backend - Python Socket.IO Server
Handles real-time video synchronization across multiple users in rooms
"""

import os
from datetime import datetime
from typing import Dict, Any, Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="SyncParty Socket.IO Server", version="1.0.0")

# Initialize Socket.IO server with async mode
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=[],  # Will be set after allowed_origins is defined
    logger=True,
    engineio_logger=False
)

# Wrap FastAPI app with Socket.IO ASGI app
socket_app = socketio.ASGIApp(
    socketio_server=sio,
    other_asgi_app=app
)

# Configure allowed origins
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
allowed_origins = [
    'http://localhost:3000',
    'https://sync-party.vercel.app',
    'https://sync.dinukasandeepa.com',
    'https://www.syncparty.net',
    FRONTEND_URL
]
# Filter out None values and duplicates
allowed_origins = list(set([origin for origin in allowed_origins if origin]))

# Update Socket.IO CORS with the allowed origins
sio.cors_allowed_origins = allowed_origins

# Custom CORS origin validator
def verify_origin(origin: str) -> bool:
    """Verify if the origin is allowed"""
    if not origin:
        return True
    if origin in allowed_origins:
        return True
    if origin.endswith('.vercel.app'):
        return True
    return False

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # Remove the wildcard, use explicit list
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],  # Added OPTIONS for preflight
    allow_headers=["*"],
)

# In-memory storage for rooms and users
rooms: Dict[str, Dict[str, Any]] = {}
room_users: Dict[str, Dict[str, Dict[str, Any]]] = {}


# HTTP Endpoints
@app.get("/")
async def root():
    """Root endpoint - Server information"""
    return {
        "message": "SyncParty Socket.IO Server",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint with server statistics"""
    # Count active rooms and connections
    active_rooms = len(rooms)
    
    # Get connection count from Socket.IO server
    try:
        # In python-socketio, we need to count sessions differently
        connection_count = len(sio.manager.get_participants('/', '/'))
    except:
        # Fallback: count total users across all rooms
        connection_count = sum(len(users) for users in room_users.values())
    
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "rooms": active_rooms,
        "connections": connection_count
    }


# Socket.IO Event Handlers
@sio.event
async def connect(sid, environ, auth):
    """Handle client connection"""
    print(f"Client connected: {sid}")


@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    print(f"Client disconnected: {sid}")
    
    # Find and clean up user from their room
    user_room = None
    for room_id, users in room_users.items():
        if sid in users:
            user_room = room_id
            break
    
    if user_room:
        user_data = room_users[user_room].get(sid)
        
        # Remove user from room
        del room_users[user_room][sid]
        
        # If room is empty, delete the room
        if len(room_users[user_room]) == 0:
            del room_users[user_room]
            if user_room in rooms:
                del rooms[user_room]
        else:
            # Notify other users
            user_list = list(room_users[user_room].values())
            await sio.emit('user-left', {
                'oderId': sid,
                'oderId': user_data.get('oderId') if user_data else sid,
                'username': user_data.get('username') if user_data else 'Unknown'
            }, room=user_room, skip_sid=sid)
            
            await sio.emit('room-users', user_list, room=user_room, skip_sid=sid)


@sio.on('join-room')
async def join_room(sid, room_id, username=None, user_info=None):
    """Handle user joining a room"""
    if user_info is None:
        user_info = {}
    
    print(f"Processing join-room: sid={sid}, room={room_id}, user={username}")
    
    # Join the Socket.IO room
    await sio.enter_room(sid, room_id)
    
    # Store user info in session
    async with sio.session(sid) as session:
        session['username'] = username
        session['userInfo'] = user_info
        session['currentRoom'] = room_id
    
    # Initialize room state if it doesn't exist
    if room_id not in rooms:
        rooms[room_id] = {
            'isPlaying': False,
            'currentTime': 0,
            'subtitleVisible': False,
            'subtitleOffset': 0,
            'fontSize': 16,
            'youtubeUrl': None
        }
    
    # Initialize room users if it doesn't exist
    if room_id not in room_users:
        room_users[room_id] = {}
    
    # Add user to room
    user_data = {
        'visibleId': sid,
        'oderId': user_info.get('oderId', sid),
        'username': username or f'User {sid[:8]}',
        'imageUrl': user_info.get('imageUrl'),
        'joinedAt': int(datetime.now().timestamp() * 1000)
    }
    room_users[room_id][sid] = user_data
    
    # Send current room state to the joining user
    await sio.emit('room-state', rooms[room_id], to=sid)
    
    print(f"Sent room-state to {sid}: {rooms[room_id]}")
    
    # Send user list to the joining user
    user_list = list(room_users[room_id].values())
    await sio.emit('room-users', user_list, to=sid)
    
    print(f"Sent room-users to {sid}: {len(user_list)} users")
    
    # Notify other users in the room
    await sio.emit('user-joined', {
        'oderId': sid,
        'oderId': user_info.get('oderId', sid),
        'username': username,
        'imageUrl': user_info.get('imageUrl')
    }, room=room_id, skip_sid=sid)
    
    print(f"Notified room {room_id} about user {username} joining")
    
    # Send updated user list to other users
    await sio.emit('room-users', user_list, room=room_id, skip_sid=sid)
    
    print(f"User {username} ({sid}) joined room {room_id}, total users: {len(user_list)}")

@sio.on('leave-room')
async def leave_room(sid, room_id):
    """Handle user leaving a room"""
    async with sio.session(sid) as session:
        username = session.get('username', 'Unknown')
    
    # Remove user from room
    if room_id in room_users and sid in room_users[room_id]:
        user_data = room_users[room_id][sid]
        del room_users[room_id][sid]
        
        # Notify other users
        await sio.emit('user-left', {
            'oderId': sid,
            'oderId': user_data.get('oderId', sid),
            'username': username
        }, room=room_id, skip_sid=sid)
        
        # If room is empty, delete it
        if len(room_users[room_id]) == 0:
            del room_users[room_id]
            if room_id in rooms:
                del rooms[room_id]
        else:
            # Send updated user list
            user_list = list(room_users[room_id].values())
            await sio.emit('room-users', user_list, room=room_id, skip_sid=sid)
    
    # Leave the Socket.IO room
    await sio.leave_room(sid, room_id)
    
    # Clear current room from session
    async with sio.session(sid) as session:
        session['currentRoom'] = None
    
    print(f"User {username} ({sid}) left room {room_id}")


@sio.on('play-video')
async def play_video(sid, data):
    """Handle play video event"""
    room_id = data.get('roomId')
    current_time = data.get('currentTime', 0)
    
    print(f"Processing play-video: room={room_id}, time={current_time}")
    
    async with sio.session(sid) as session:
        username = session.get('username', 'Unknown')
    
    # Update room state
    if room_id in rooms:
        rooms[room_id]['isPlaying'] = True
        rooms[room_id]['currentTime'] = current_time
    
    # Broadcast to other users in the room
    await sio.emit('play-video', {
        'currentTime': current_time,
        'username': username
    }, room=room_id, skip_sid=sid)
    print(f"Broadcasted play-video to room {room_id}, sender: {username}")

@sio.on('pause-video')
async def pause_video(sid, data):
    """Handle pause video event"""
    room_id = data.get('roomId')
    current_time = data.get('currentTime', 0)
    
    print(f"Processing pause-video: room={room_id}, time={current_time}")
    
    async with sio.session(sid) as session:
        username = session.get('username', 'Unknown')
    
    # Update room state
    if room_id in rooms:
        rooms[room_id]['isPlaying'] = False
        rooms[room_id]['currentTime'] = current_time
    
    # Broadcast to other users in the room
    await sio.emit('pause-video', {
        'currentTime': current_time,
        'username': username
    }, room=room_id, skip_sid=sid)
    print(f"Broadcasted pause-video to room {room_id}, sender: {username}")

@sio.on('seek-video')
async def seek_video(sid, data):
    """Handle seek video event"""
    room_id = data.get('roomId')
    current_time = data.get('currentTime', 0)
    
    print(f"Processing seek-video: room={room_id}, time={current_time}")
    
    async with sio.session(sid) as session:
        username = session.get('username', 'Unknown')
    
    # Update room state
    if room_id in rooms:
        rooms[room_id]['currentTime'] = current_time
    
    # Broadcast to other users in the room
    await sio.emit('seek-video', {
        'currentTime': current_time,
        'username': username
    }, room=room_id, skip_sid=sid)


@sio.on('youtube-url-change')
async def change_video(sid, data):
    """Handle video URL change event"""
    room_id = data.get('roomId')
    youtube_url = data.get('youtubeUrl')
    
    async with sio.session(sid) as session:
        username = session.get('username', 'Unknown')
    
    # Update room state
    if room_id in rooms:
        rooms[room_id]['youtubeUrl'] = youtube_url
    
    # Broadcast to other users in the room
    await sio.emit('youtube-url-change', {
        'youtubeUrl': youtube_url,
        'username': username
    }, room=room_id, skip_sid=sid)


@sio.on('subtitle-loaded')
async def subtitle_loaded(sid, data):
    """Handle subtitle loaded event"""
    room_id = data.get('roomId')
    file_name = data.get('fileName')
    file_size = data.get('fileSize')
    
    # Broadcast to other users in the room
    await sio.emit('subtitle-loaded', {
        'userId': sid,
        'fileName': file_name,
        'fileSize': file_size
    }, room=room_id, skip_sid=sid)


@sio.on('subtitle-toggle')
async def subtitle_toggle(sid, data):
    """Handle subtitle visibility toggle"""
    room_id = data.get('roomId')
    visible = data.get('visible', False)
    
    # Update room state
    if room_id in rooms:
        rooms[room_id]['subtitleVisible'] = visible
    
    # Broadcast to other users in the room
    await sio.emit('subtitle-toggle', {
        'visible': visible
    }, room=room_id, skip_sid=sid)
    
    print(f"Broadcasted subtitle-toggle to room {room_id}, visible={visible}")


@sio.on('subtitle-offset')
async def subtitle_offset(sid, data):
    """Handle subtitle offset change"""
    room_id = data.get('roomId')
    offset = data.get('offset', 0)
    
    # Update room state
    if room_id in rooms:
        rooms[room_id]['subtitleOffset'] = offset
    
    # Broadcast to other users in the room
    await sio.emit('subtitle-offset', {
        'offset': offset
    }, room=room_id, skip_sid=sid)
    
    print(f"Broadcasted subtitle-offset to room {room_id}, offset={offset}")

@sio.on('font-size-change')
async def font_size_change(sid, data):
    """Handle font size change"""
    room_id = data.get('roomId')
    font_size = data.get('fontSize', 16)
    
    # Update room state
    if room_id in rooms:
        rooms[room_id]['fontSize'] = font_size
    
    # Broadcast to other users in the room
    await sio.emit('font-size-change', {
        'fontSize': font_size
    }, room=room_id, skip_sid=sid)
    
    print(f"Broadcasted font-size-change to room {room_id}, fontSize={font_size}")


# Entry point for running the server
if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv('PORT', 3001))
    
    print(f"Starting SyncParty Socket.IO Server on port {port}")
    print(f"Allowed origins: {allowed_origins}")
    
    uvicorn.run(
        socket_app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )
