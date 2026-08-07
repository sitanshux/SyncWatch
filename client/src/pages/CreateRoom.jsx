import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { socket } from '../socket/socket';
import { generateRoomCode } from '../utils/helpers';
import SyncWatchLogo from '../components/SyncWatchLogo';

/**
 * Create Room Page Component
 * Redesigned with dark graphite theme, matte surfaces, and Linear/macOS settings aesthetic.
 */
export default function CreateRoom() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [password, setPassword] = useState('');
  const [playbackControl, setPlaybackControl] = useState('Host Only');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const finalDisplayName = displayName.trim() || 'Host';
    const finalRoomName = roomName.trim() || 'SyncWatch Room';

    setIsSubmitting(true);

    const roomCode = generateRoomCode(8);
    const userToken = Math.random().toString(36).substring(2) + Date.now().toString(36);

    socket.emit(
      'create-room',
      {
        roomCode,
        roomName: finalRoomName,
        displayName: finalDisplayName,
        password: password.trim(),
        playbackControl,
        userToken,
      },
      (response) => {
        setIsSubmitting(false);
        if (response && response.success) {
          localStorage.setItem('syncwatch_active_room', roomCode);
          localStorage.setItem(`room_user_${roomCode}`, finalDisplayName);
          localStorage.setItem('last_displayName', finalDisplayName);
          localStorage.setItem(`room_pass_${roomCode}`, password.trim());
          localStorage.setItem(`room_token_${roomCode}`, userToken);

          sessionStorage.setItem(`room_user_${roomCode}`, finalDisplayName);
          sessionStorage.setItem('last_displayName', finalDisplayName);
          sessionStorage.setItem(`room_pass_${roomCode}`, password.trim());
          sessionStorage.setItem(`room_token_${roomCode}`, userToken);

          navigate(`/room/${roomCode}`, {
            state: { room: response.room, displayName: finalDisplayName },
          });
        } else {
          setError(response?.message || 'Failed to create room. Please try again.');
        }
      }
    );
  };

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
                Create Theater Room
              </h1>
              <p className="font-mono text-[11px] text-[#6E6E73] tracking-widest uppercase mt-0.5">
                SYSTEM INITIALIZATION
              </p>
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
              HOST DISPLAY NAME
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Alexander"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 bg-[#0E0E11] border border-white/[0.1] text-sm text-white placeholder:text-[#444] font-sans focus:outline-none focus:border-[#C5A059] transition-colors"
            />
          </div>

          {/* Room Name */}
          <div className="space-y-2">
            <label className="block font-mono text-[11px] font-semibold text-[#A1A1A6] uppercase tracking-[0.2em]">
              THEATER ROOM NAME
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Cinema Night — IMAX Master"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full px-4 py-3 bg-[#0E0E11] border border-white/[0.1] text-sm text-white placeholder:text-[#444] font-sans focus:outline-none focus:border-[#C5A059] transition-colors"
            />
          </div>

          {/* Optional Password */}
          <div className="space-y-2">
            <label className="block font-mono text-[11px] font-semibold text-[#A1A1A6] uppercase tracking-[0.2em]">
              ROOM PASSWORD (OPTIONAL)
            </label>
            <input
              type="password"
              placeholder="Leave blank for public room key"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#0E0E11] border border-white/[0.1] text-sm text-white placeholder:text-[#444] font-sans focus:outline-none focus:border-[#C5A059] transition-colors"
            />
          </div>

          {/* Playback Control Mode Selector */}
          <div className="space-y-3 pt-2">
            <label className="block font-mono text-[11px] font-semibold text-[#A1A1A6] uppercase tracking-[0.2em]">
              PLAYBACK AUTHORITY MODE
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'Host Only', title: 'Host Only', desc: 'Strict host playback control' },
                { id: 'Everyone', title: 'Everyone', desc: 'Any member can seek / play' },
                { id: 'Selected Users', title: 'Delegated', desc: 'Host grants explicit permission' },
              ].map((opt) => {
                const selected = playbackControl === opt.id;
                return (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setPlaybackControl(opt.id)}
                    className={`p-3 text-left border transition-all duration-200 ${
                      selected
                        ? 'bg-[#C5A059]/15 border-[#C5A059] text-white'
                        : 'bg-[#0E0E11] border-white/[0.08] text-[#A1A1A6] hover:border-white/20'
                    }`}
                  >
                    <div className="font-grotesk text-xs font-bold uppercase tracking-wider text-white">
                      {opt.title}
                    </div>
                    <div className="font-sans text-[10px] text-[#6E6E73] mt-1 leading-snug">
                      {opt.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-[#F3F3F5] hover:bg-white text-black font-grotesk font-bold text-xs uppercase tracking-[0.25em] transition-all duration-200 disabled:opacity-50 mt-6 border border-white"
          >
            {isSubmitting ? 'INITIALIZING ROOM...' : 'INITIALIZE THEATER ROOM →'}
          </button>
        </form>
      </div>
    </main>
  );
}
