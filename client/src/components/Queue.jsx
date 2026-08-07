import React, { useState, useEffect } from 'react';
import PlayerManager, { PROVIDERS } from '../players/PlayerManager';

/**
 * Queue Component
 * Synchronized room playback queue with dark luxury graphite aesthetic.
 */
export default function Queue({ roomCode, socket, isHost, currentVideoUrl, providerType }) {
  const [queue, setQueue] = useState([]);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [inputUrl, setInputUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [detectedProvider, setDetectedProvider] = useState(PROVIDERS.UNKNOWN);
  const [errorMsg, setErrorMsg] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!socket || !roomCode) return;

    const handleQueueUpdated = (data) => {
      if (!data) return;
      if (Array.isArray(data.queue)) setQueue(data.queue);
      if (data.nowPlaying !== undefined) setNowPlaying(data.nowPlaying);
    };

    const handleRoomUpdated = (room) => {
      if (room && room.roomCode === roomCode) {
        if (Array.isArray(room.queue)) setQueue(room.queue);
        if (room.nowPlaying !== undefined) setNowPlaying(room.nowPlaying);
      }
    };

    socket.on('queue-updated', handleQueueUpdated);
    socket.on('room-updated', handleRoomUpdated);

    socket.emit('get-room-data', roomCode, (res) => {
      if (res && res.success && res.room) {
        if (Array.isArray(res.room.queue)) setQueue(res.room.queue);
        if (res.room.nowPlaying) setNowPlaying(res.room.nowPlaying);
      }
    });

    return () => {
      socket.off('queue-updated', handleQueueUpdated);
      socket.off('room-updated', handleRoomUpdated);
    };
  }, [socket, roomCode]);

  useEffect(() => {
    const trimmed = inputUrl.trim();
    if (trimmed) {
      setDetectedProvider(PlayerManager.detectProvider(trimmed));
    } else {
      setDetectedProvider(PROVIDERS.UNKNOWN);
    }
  }, [inputUrl]);

  const handleAddToQueue = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const url = inputUrl.trim();
    if (!url) {
      setErrorMsg('Please enter a valid video URL.');
      return;
    }

    const provider = PlayerManager.detectProvider(url);
    if (provider.type === PROVIDERS.UNKNOWN.type) {
      setErrorMsg('Unsupported provider. Only HTML5, YouTube, and Google Drive are supported.');
      return;
    }

    socket.emit('add-to-queue', {
      roomCode,
      url,
      providerType: provider.type,
      title: customTitle.trim(),
    }, (res) => {
      if (res && res.success) {
        setInputUrl('');
        setCustomTitle('');
      } else {
        setErrorMsg(res?.message || 'Failed to add video to queue.');
      }
    });
  };

  const handleRemove = (itemId) => {
    if (!isHost) return;
    socket.emit('remove-from-queue', { roomCode, itemId });
  };

  const handleReorder = (itemId, direction) => {
    if (!isHost) return;
    socket.emit('reorder-queue', { roomCode, itemId, direction });
  };

  const handleSkipNext = () => {
    if (!isHost) return;
    socket.emit('skip-next-queue', { roomCode });
  };

  const handleClearQueue = () => {
    if (!isHost) return;
    socket.emit('clear-queue', { roomCode });
  };

  const renderProviderBadge = (pType) => {
    const type = (pType || '').toLowerCase();
    if (type === 'youtube') {
      return (
        <span className="font-mono text-[9px] px-2 py-0.5 border border-red-500/40 bg-red-500/10 text-red-400 uppercase tracking-wider font-semibold">
          YOUTUBE
        </span>
      );
    }
    if (type === 'googledrive') {
      return (
        <span className="font-mono text-[9px] px-2 py-0.5 border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 uppercase tracking-wider font-semibold">
          GOOGLE DRIVE
        </span>
      );
    }
    return (
      <span className="font-mono text-[9px] px-2 py-0.5 border border-white/20 bg-white/5 text-white uppercase tracking-wider font-semibold">
        HTML5 DIRECT
      </span>
    );
  };

  return (
    <div className="w-full matte-panel-dark border border-white/[0.1] p-5 font-sans space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2 font-grotesk text-xs font-bold tracking-[0.2em] text-white uppercase">
          <span>📑 PLAYBACK QUEUE ({queue.length})</span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px]">
          {isHost && queue.length > 0 && (
            <>
              <button
                onClick={handleSkipNext}
                className="px-3 py-1 bg-white/[0.05] border border-white/[0.12] hover:border-white text-white font-bold uppercase tracking-wider transition-colors"
                title="Skip to next queued video"
              >
                SKIP NEXT ⏭
              </button>
              <button
                onClick={handleClearQueue}
                className="px-3 py-1 bg-rose-950/40 border border-rose-900 hover:bg-rose-900/60 text-rose-300 font-bold uppercase tracking-wider transition-colors"
                title="Clear entire queue"
              >
                CLEAR
              </button>
            </>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="lg:hidden text-xs text-[#A1A1A6] hover:text-white px-2 py-1 bg-[#0E0E12] border border-white/[0.1]"
          >
            {isCollapsed ? 'EXPAND' : 'COLLAPSE'}
          </button>
        </div>
      </div>

      {/* Main Queue Body */}
      {!isCollapsed && (
        <div className="space-y-4">
          {/* Now Playing Section */}
          <div>
            <span className="block font-mono text-[10px] font-semibold text-[#C5A059] uppercase tracking-[0.2em] mb-2">
              NOW PLAYING IN THEATER
            </span>
            {currentVideoUrl ? (
              <div className="p-3.5 bg-[#0E0E12] border border-white/[0.1] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="font-mono text-sm text-[#C5A059] flex-shrink-0 animate-pulse">▶</span>
                  <div className="min-w-0">
                    <p className="font-sans text-xs font-semibold text-white truncate">
                      {nowPlaying?.displayTitle || 'Active Video Stream'}
                    </p>
                    <p className="font-mono text-[10px] text-[#A1A1A6] truncate mt-0.5">
                      {nowPlaying?.addedBy ? `Added by ${nowPlaying.addedBy}` : 'Direct Room Stream'}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {renderProviderBadge(providerType || nowPlaying?.providerType)}
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-[#0E0E12] border border-white/[0.08] font-mono text-xs text-[#6E6E73] italic">
                No video stream active in theater.
              </div>
            )}
          </div>

          {/* Host Add to Queue Form */}
          {isHost && (
            <form onSubmit={handleAddToQueue} className="p-4 bg-[#0E0E12] border border-white/[0.1] space-y-3">
              <span className="block font-mono text-[11px] font-semibold text-white uppercase tracking-wider">
                + ADD STREAM TO QUEUE
              </span>

              {errorMsg && (
                <div className="p-2.5 bg-rose-950/50 border border-rose-800 text-rose-300 font-mono text-[11px]">
                  ERR // {errorMsg}
                </div>
              )}

              <div className="space-y-2">
                <input
                  type="url"
                  placeholder="Paste YouTube, Google Drive, or Direct MP4/WebM URL..."
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#08080A] border border-white/[0.12] focus:border-[#C5A059] text-white text-xs font-sans outline-none transition-colors placeholder:text-[#444]"
                />

                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    placeholder="Optional title (e.g. Chapter 01)"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full sm:flex-1 px-3 py-2 bg-[#08080A] border border-white/[0.12] focus:border-[#C5A059] text-white text-xs font-sans outline-none transition-colors placeholder:text-[#444]"
                  />

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    {inputUrl.trim() && (
                      <span className="font-mono text-[10px] text-[#A1A1A6]">
                        SOURCE: <strong className="text-white">{detectedProvider.name}</strong>
                      </span>
                    )}
                    <button
                      type="submit"
                      disabled={!inputUrl.trim() || detectedProvider.type === PROVIDERS.UNKNOWN.type}
                      className="px-4 py-2 bg-[#F3F3F5] text-black font-grotesk font-bold text-xs uppercase tracking-wider hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-white"
                    >
                      + ADD QUEUE
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* Queue List */}
          <div>
            <span className="block font-mono text-[10px] font-semibold text-[#A1A1A6] uppercase tracking-[0.2em] mb-2">
              QUEUED VIDEO STREAMS
            </span>

            {queue.length === 0 ? (
              <div className="p-4 bg-[#0E0E12] border border-white/[0.08] text-center font-mono text-xs text-[#6E6E73]">
                QUEUE IS EMPTY. {isHost && 'ADD STREAMS ABOVE TO AUTO-PLAY NEXT.'}
              </div>
            ) : (
              <ul className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {queue.map((item, idx) => (
                  <li
                    key={item.id}
                    className="p-3 bg-[#0E0E12] border border-white/[0.08] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="font-mono text-[#C5A059] text-[11px] flex-shrink-0 w-5 text-right font-bold">
                        {idx + 1}.
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white truncate max-w-xs sm:max-w-md">
                            {item.displayTitle}
                          </p>
                          {renderProviderBadge(item.providerType)}
                        </div>
                        <p className="font-mono text-[10px] text-[#6E6E73] mt-0.5 truncate">
                          Added by {item.addedBy} at {item.addedAt}
                        </p>
                      </div>
                    </div>

                    {/* Host Actions */}
                    {isHost && (
                      <div className="flex items-center gap-1 flex-shrink-0 font-mono text-[10px]">
                        <button
                          onClick={() => handleReorder(item.id, 'up')}
                          disabled={idx === 0}
                          className="px-2 py-1 bg-white/[0.05] border border-white/[0.12] hover:border-white text-white disabled:opacity-20 transition-colors"
                          title="Move Up"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleReorder(item.id, 'down')}
                          disabled={idx === queue.length - 1}
                          className="px-2 py-1 bg-white/[0.05] border border-white/[0.12] hover:border-white text-white disabled:opacity-20 transition-colors"
                          title="Move Down"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="px-2 py-1 bg-rose-950/50 border border-rose-800 hover:bg-rose-900 text-rose-300 transition-colors ml-1"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
