import React from 'react';

/**
 * UserList Component
 * Displays connected room members with dark luxury graphite styling and host actions.
 */
export default function UserList({ users = [], currentSocketId, isHost = false, roomCode, socket }) {
  const sortedUsers = [...users].sort((a, b) => (b.isHost ? 1 : 0) - (a.isHost ? 1 : 0));

  const handleToggleControl = (targetSocketId) => {
    if (!isHost || !socket || !roomCode) return;
    socket.emit('toggle-user-control', { roomCode, targetSocketId });
  };

  const handleKickUser = (targetSocketId, displayName) => {
    if (!isHost || !socket || !roomCode) return;
    if (window.confirm(`Are you sure you want to remove ${displayName} from the room?`)) {
      socket.emit('kick-user', { roomCode, targetSocketId });
    }
  };

  return (
    <div className="w-full matte-panel-dark border border-white/[0.1] p-5 font-sans space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2 font-grotesk text-xs font-bold tracking-[0.2em] text-white uppercase">
          <span>👥 PARTICIPANTS ({users.length})</span>
        </div>
      </div>

      <ul className="space-y-2.5">
        {sortedUsers.map((user) => {
          const isCurrentUser = user.socketId === currentSocketId;

          return (
            <li
              key={user.socketId}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-[#0E0E12] border border-white/[0.08] text-xs font-sans"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-sm select-none text-[#C5A059] flex-shrink-0">
                  {user.isHost ? '👑' : '•'}
                </span>
                <div className="min-w-0 flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-white truncate">
                    {user.displayName}
                  </span>
                  {isCurrentUser && (
                    <span className="font-mono text-[10px] text-[#A1A1A6]">(YOU)</span>
                  )}
                  {user.isHost ? (
                    <span className="font-mono text-[9px] px-2 py-0.5 border border-[#C5A059]/40 bg-[#C5A059]/10 text-[#C5A059] uppercase tracking-wider font-semibold">
                      HOST
                    </span>
                  ) : user.canControlPlayback ? (
                    <span className="font-mono text-[9px] px-2 py-0.5 border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 uppercase tracking-wider font-semibold">
                      CONTROL GRANTED
                    </span>
                  ) : (
                    <span className="font-mono text-[9px] px-2 py-0.5 border border-white/[0.1] bg-white/[0.03] text-[#A1A1A6] uppercase tracking-wider">
                      MEMBER
                    </span>
                  )}
                </div>
              </div>

              {/* Host Action Buttons */}
              {isHost && !user.isHost && (
                <div className="flex items-center gap-2 flex-shrink-0 font-mono text-[10px]">
                  <button
                    onClick={() => handleToggleControl(user.socketId)}
                    className={`px-3 py-1 font-bold uppercase tracking-wider border transition-colors ${
                      user.canControlPlayback
                        ? 'bg-amber-950/40 border-amber-800 text-amber-300 hover:bg-amber-900/60'
                        : 'bg-white/[0.05] border-white/[0.15] text-white hover:bg-white/10'
                    }`}
                    title={user.canControlPlayback ? 'Revoke playback control' : 'Grant playback control'}
                  >
                    {user.canControlPlayback ? 'REVOKE CONTROL' : 'GRANT CONTROL'}
                  </button>

                  <button
                    onClick={() => handleKickUser(user.socketId, user.displayName)}
                    className="px-3 py-1 font-bold uppercase tracking-wider bg-rose-950/40 border border-rose-900 text-rose-300 hover:bg-rose-900/60 transition-colors"
                    title="Remove user from room"
                  >
                    REMOVE
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
