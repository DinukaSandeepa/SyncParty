'use client';

export default function UserPanel({ users, isInRoom, roomName }) {
    if (!isInRoom) return null;
    return (
        <div className="fixed right-0 top-0 h-full w-64 bg-[#2b2d31] border-l border-[#1e1f22] flex flex-col z-50 animate-slide-in-right">
            <div className="p-3 border-b border-[#1e1f22] bg-[#232428]">
                <div className="flex items-center gap-2">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-[#80848e]"
                    >
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <span className="text-[#f2f3f5] font-semibold truncate">{roomName}</span>
                </div>
            </div>
            <div className="p-4 border-b border-[#1e1f22]">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-[#23a559] rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-[#23a559] uppercase tracking-wider">
                        Live
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-[#80848e]"
                    >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span className="text-sm font-semibold text-[#80848e] uppercase tracking-wide">
                        In Room — {users.length}
                    </span>
                </div>
            </div>
            <div className="flex-1 p-2 overflow-y-auto">
                {users.length === 0 ? (
                    <div className="text-center py-8 text-[#80848e] text-sm">
                        No users in room
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        {users.map((member, index) => (
                            <div
                                key={member.oderId}
                                className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-[#35373c] transition-colors group cursor-pointer animate-user-join"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="relative flex-shrink-0">
                                    {member.imageUrl ? (
                                        <img
                                            src={member.imageUrl}
                                            alt={member.username}
                                            className="w-8 h-8 rounded-full object-cover ring-2 ring-transparent group-hover:ring-[#5865f2] transition-all"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-white text-sm font-medium ring-2 ring-transparent group-hover:ring-[#7289da] transition-all">
                                            {member.username?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#2b2d31] rounded-full flex items-center justify-center">
                                        <div className="w-2.5 h-2.5 bg-[#23a559] rounded-full" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[#f2f3f5] text-sm font-medium truncate">
                                            {member.username}
                                        </span>
                                        {member.isCurrentUser && (
                                            <span className="text-[10px] px-1 py-0.5 bg-[#5865f2] text-white rounded font-medium">
                                                YOU
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="transition-opacity opacity-0 group-hover:opacity-100">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="text-[#80848e]"
                                    >
                                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                                    </svg>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="p-3 border-t border-[#1e1f22] bg-[#232428]">
                <div className="flex items-center gap-2 text-[#80848e]">
                    <div className="w-2 h-2 bg-[#23a559] rounded-full animate-pulse" />
                    <span className="text-xs">Watching together</span>
                </div>
            </div>
        </div>
    );
}
