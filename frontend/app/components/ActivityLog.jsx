'use client';

export default function ActivityLog({ statusLog }) {
    return (
        <div className="p-6 transition-all duration-300 delay-500 border bg-white/5 rounded-xl border-white/5 animate-fade-in-up hover:border-white/20">
            <h2 className="mb-4 text-xl font-semibold">Activity Log</h2>
            <div className="h-48 p-4 overflow-y-auto font-mono text-sm rounded-lg bg-black/50">
                {statusLog.length === 0 ? (
                    <p className="text-gray-400">No activity yet...</p>
                ) : (
                    statusLog.map((log, index) => (
                        <div key={index} className="mb-1 text-gray-300">
                            {log}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
