'use client';

export default function RoomSection({ room, setRoom, isInRoom, onJoinRoom }) {
    return (
        <div className="p-6 mb-6 transition-all duration-300 delay-100 border bg-white/5 rounded-xl border-white/5 animate-fade-in-up hover:border-white/20">
            <h2 className="mb-4 text-xl font-semibold">Room</h2>
            <div className="flex gap-3">
                <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="Enter room name"
                    disabled={isInRoom}
                    className="flex-1 px-4 py-2 transition-all duration-300 border rounded-lg bg-white/10 border-white/30 focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50 hover:bg-white/15"
                />
                <button
                    onClick={onJoinRoom}
                    disabled={isInRoom || !room.trim()}
                    className="px-6 py-2 font-medium text-black transition-all duration-300 bg-white rounded-lg hover:bg-white/80 disabled:bg-white/20 disabled:text-white/40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                >
                    {isInRoom ? 'In Room' : 'Join Room'}
                </button>
            </div>
        </div>
    );
}
