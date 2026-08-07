import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { socket } from '../socket/socket';
import SyncWatchLogo from '../components/SyncWatchLogo';

/**
 * Join Room Page Component
 * Redesigned with dark luxury graphite theme, matching CreateRoom & Home design system.
 */
export default function JoinRoom() {
  const navigate = useNavigate();
  const { roomCodeUrl } = useParams();

  const isDirectInvite = Boolean(roomCodeUrl);
  const targetRoomCode = (roomCodeUrl || '').trim().toUpperCase();

  const [displayName, setDisplayName] = useState(
    sessionStorage.getItem('last_displayName') || ''
  );
  const [roomCode, setRoomCode] = useState(targetRoomCode);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingRoom, setIsCheckingRoom] = useState(isDirectInvite);
  const [roomNotFound, setRoomNotFound] = useState(false);
  const [requiresPassword, setRequiresPassword] = useState(false);

  // Check direct room link validity on mount
  useEffect(() => {
    if (!isDirectInvite || !targetRoomCode) return;

    socket.emit('get-room-data', targetRoomCode, (response) => {
      setIsCheckingRoom(false);
      if (response && response.success && response.room) {
        setRequiresPassword(Boolean(response.room.password));
        setRoomNotFound(false);
      } else {
        setRoomNotFound(true);
      }
    });
  }, [isDirectInvite, targetRoomCode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const formattedCode = (isDirectInvite ? targetRoomCode : roomCode).trim().toUpperCase();
    const finalDisplayName = displayName.trim() || 'Member';

    if (!formattedCode) {
      setError('Please enter a valid room code.');
      return;
    }

    setIsSubmitting(true);

    let userToken = sessionStorage.getItem(`room_token_${formattedCode}`);
    if (!userToken) {
      userToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    socket.emit(
      'join-room',
      {
        roomCode: formattedCode,
        displayName: finalDisplayName,
        password: password.trim(),
        userToken,
      },
      (response) => {
        setIsSubmitting(false);
        if (response && response.success) {
          localStorage.setItem('syncwatch_active_room', formattedCode);
          localStorage.setItem(`room_user_${formattedCode}`, finalDisplayName);
          localStorage.setItem('last_displayName', finalDisplayName);
          localStorage.setItem(`room_pass_${formattedCode}`, password.trim());
          localStorage.setItem(`room_token_${formattedCode}`, userToken);

          sessionStorage.setItem(`room_user_${formattedCode}`, finalDisplayName);
          sessionStorage.setItem('last_displayName', finalDisplayName);
          sessionStorage.setItem(`room_pass_${formattedCode}`, password.trim());
          sessionStorage.setItem(`room_token_${formattedCode}`, userToken);

          navigate(`/room/${formattedCode}`, {
            state: { room: response.room, displayName: finalDisplayName },
          });
        } else {
          setError(response?.message || 'Failed to join room. Please check the code and password.');
        }
      }
    );
  };

  if (isCheckingRoom) {
    return (
      <main className="min-h-screen bg-[#08080A] text-[#F3F3F5] flex items-center justify-center p-6 font-sans">
        <div className="font-mono text-xs text-[#A1A1A6] animate-pulse flex items-center gap-3">
          <SyncWatchLogo iconSize={22} showText={false} />
          <span>VERIFYING ROOM KEY [{targetRoomCode}]...</span>
        </div>
      </main>
    );
  }

  if (roomNotFound) {
    return (
      <main className="min-h-screen bg-[#08080A] text-[#F3F3F5] flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md matte-panel-dark border border-white/[0.1] p-10 text-center space-y-6">
          <div className="font-mono text-xs text-[#C5A059] tracking-widest uppercase">
            ROOM NOT FOUND
          </div>
          <h1 className="font-grotesk text-2xl font-bold text-white uppercase">
            Theater Offline
          </h1>
          <p className="font-mono text-xs text-[#A1A1A6]">
            The requested room code <strong className="text-white">{targetRoomCode}</strong> does not exist or has expired.
          </p>
          <Link
            to="/"
            className="block w-full py-3.5 bg-[#F3F3F5] text-black font-grotesk font-bold text-xs uppercase tracking-widest hover:bg-white transition-colors"
          >
            RETURN TO LANDING
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08080A] text-[#F3F3F5] flex flex-col items-center justify-center p-6 font-sans relative selection:bg-[#C5A059]/30">
      {/* Background Vignette */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_20%,#08080A_100%)] opacity-80" />

      <div className="w-full max-w-xl matte-panel-dark border border-white/[0.1] p-8 sm:p-12 relative z-10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 mb-8 border-b border-white/[0.08]">
          <div className="flex items-center gap-4">
            <SyncWatchLogo iconSize={26} showText={false} />
            <div>
              <h1 className="font-grotesk text-xl font-bold tracking-tight text-white uppercase">
                Join Theater Room
              </h1>
              {isDirectInvite ? (
                <p className="font-mono text-[11px] text-[#C5A059] tracking-widest uppercase mt-0.5">
                  ROOM KEY: {targetRoomCode}
                </p>
              ) : (
                <p className="font-mono text-[11px] text-[#6E6E73] tracking-widest uppercase mt-0.5">
                  ENTER CRYPTOGRAPHIC KEY
                </p>
              )}
            </div>
          </div>
          <Link
            to="/"
            className="font-mono text-xs text-[#A1A1A6] hover:text-white transition-colors duration-200 uppercase tracking-wider"
          >
            ← Return
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs font-mono rounded-none">
            ERR: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Display Name */}
          <div className="space-y-2">
            <label className="block font-mono text-[11px] font-semibold text-[#A1A1A6] uppercase tracking-[0.2em]">
              YOUR DISPLAY NAME
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Jordan"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 bg-[#0E0E11] border border-white/[0.1] text-sm text-white placeholder:text-[#444] font-sans focus:outline-none focus:border-[#C5A059] transition-colors"
            />
          </div>

          {/* Room Code (if not direct link) */}
          {!isDirectInvite && (
            <div className="space-y-2">
              <label className="block font-mono text-[11px] font-semibold text-[#A1A1A6] uppercase tracking-[0.2em]">
                ROOM KEY CODE
              </label>
              <input
                type="text"
                required
                placeholder="E.G. AB7KQ91P"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-[#0E0E11] border border-white/[0.1] text-sm text-white placeholder:text-[#444] font-mono tracking-widest uppercase focus:outline-none focus:border-[#C5A059] transition-colors"
              />
            </div>
          )}

          {/* Password (if protected) */}
          {(!isDirectInvite || requiresPassword) && (
            <div className="space-y-2">
              <label className="block font-mono text-[11px] font-semibold text-[#A1A1A6] uppercase tracking-[0.2em]">
                {requiresPassword ? 'ROOM PASSWORD (REQUIRED)' : 'ROOM PASSWORD (IF PROTECTED)'}
              </label>
              <input
                type="password"
                required={requiresPassword}
                placeholder="Enter room key password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#0E0E11] border border-white/[0.1] text-sm text-white placeholder:text-[#444] font-sans focus:outline-none focus:border-[#C5A059] transition-colors"
              />
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-[#F3F3F5] hover:bg-white text-black font-grotesk font-bold text-xs uppercase tracking-[0.25em] transition-all duration-200 disabled:opacity-50 mt-6 border border-white"
          >
            {isSubmitting ? 'CONNECTING TO ROOM...' : 'ENTER THEATER ROOM →'}
          </button>
        </form>
      </div>
    </main>
  );
}
