import React, { useState, useEffect, useRef, useCallback } from 'react';
import PlayerManager, { PROVIDERS } from '../players/PlayerManager';

/**
 * VideoPlayer Component
 * Renders universal player using PlayerManager facade.
 * Dark luxury graphite styling with high contrast UI controls.
 */
export default function VideoPlayer({
  videoUrl,
  roomCode,
  isHost,
  canControl: canControlProp,
  playbackMode,
  socket,
  onLoadVideo,
}) {
  const [inputUrl, setInputUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resyncedBadge, setResyncedBadge] = useState(false);
  const [detectedProvider, setDetectedProvider] = useState(PROVIDERS.UNKNOWN);

  const containerRef = useRef(null);
  const playerManagerRef = useRef(null);
  const isRemoteAction = useRef(false);
  const resyncTimeoutRef = useRef(null);

  const canControlRef = useRef(false);
  const socketRef = useRef(socket);
  const roomCodeRef = useRef(roomCode);
  const videoUrlRef = useRef(videoUrl);

  const effectiveCanControl = canControlProp !== undefined ? canControlProp : (playbackMode === 'Everyone' || isHost);
  canControlRef.current = effectiveCanControl;
  socketRef.current = socket;
  roomCodeRef.current = roomCode;
  videoUrlRef.current = videoUrl;

  const canControl = canControlRef.current;

  if (!playerManagerRef.current) {
    playerManagerRef.current = new PlayerManager();
  }

  useEffect(() => {
    if (inputUrl.trim()) {
      setDetectedProvider(PlayerManager.detectProvider(inputUrl.trim()));
    } else if (videoUrl) {
      setDetectedProvider(PlayerManager.detectProvider(videoUrl));
    } else {
      setDetectedProvider(PROVIDERS.UNKNOWN);
    }
  }, [inputUrl, videoUrl]);

  const triggerResyncBadge = useCallback(() => {
    setResyncedBadge(true);
    if (resyncTimeoutRef.current) clearTimeout(resyncTimeoutRef.current);
    resyncTimeoutRef.current = setTimeout(() => setResyncedBadge(false), 2500);
  }, []);

  useEffect(() => {
    const playerManager = playerManagerRef.current;
    let cancelled = false;

    if (!videoUrl || !containerRef.current) {
      if (containerRef.current) containerRef.current.innerHTML = '';
      setIsLoading(false);
      return;
    }

    const provider = PlayerManager.detectProvider(videoUrl);
    setDetectedProvider(provider);

    if (provider.type === PROVIDERS.UNKNOWN.type) {
      setErrorMessage('Unsupported Video Provider');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    const handlePlay = () => {
      if (isRemoteAction.current) return;
      if (!canControlRef.current) return;
      const s = socketRef.current;
      if (s) {
        s.emit('video-play', {
          roomCode: roomCodeRef.current,
          currentTime: playerManager.getCurrentTime(),
        });
      }
    };

    const handlePause = () => {
      if (isRemoteAction.current) return;
      if (!canControlRef.current) return;
      const s = socketRef.current;
      if (s) {
        s.emit('video-pause', {
          roomCode: roomCodeRef.current,
          currentTime: playerManager.getCurrentTime(),
        });
      }
    };

    const handleSeeked = () => {
      if (isRemoteAction.current) return;
      if (!canControlRef.current) return;
      const s = socketRef.current;
      if (s) {
        s.emit('video-seek', {
          roomCode: roomCodeRef.current,
          currentTime: playerManager.getCurrentTime(),
        });
      }
    };

    const handleEnded = () => {
      if (!canControlRef.current) return;
      const s = socketRef.current;
      if (s) {
        s.emit('video-pause', {
          roomCode: roomCodeRef.current,
          currentTime: playerManager.getCurrentTime(),
        });
        s.emit('auto-next-queue', {
          roomCode: roomCodeRef.current,
        });
      }
    };

    const handleCanPlay = () => {
      if (!cancelled) setIsLoading(false);
    };

    const handleError = (err) => {
      if (cancelled) return;
      setIsLoading(false);
      const msg = (err && err.message) ? err.message : 'Video format is not supported.';
      setErrorMessage(msg);
    };

    playerManager.on('play', handlePlay);
    playerManager.on('pause', handlePause);
    playerManager.on('seeked', handleSeeked);
    playerManager.on('ended', handleEnded);
    playerManager.on('ready', handleCanPlay);
    playerManager.on('canplay', handleCanPlay);
    playerManager.on('error', handleError);

    const loadingTimeout = setTimeout(() => {
      if (!cancelled) setIsLoading(false);
    }, 6000);

    (async () => {
      try {
        await playerManager.initializePlayer(provider.type, containerRef.current);
        if (cancelled) return;
        playerManager.load(videoUrl);
      } catch (err) {
        if (cancelled) return;
        console.error('[VideoPlayer] Initialization error:', err);
        setIsLoading(false);
        setErrorMessage(err.message || 'Unable to load video provider.');
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(loadingTimeout);
      playerManager.destroy();
    };
  }, [videoUrl]);

  useEffect(() => {
    if (!socket || !roomCode) return;
    const playerManager = playerManagerRef.current;

    const whenPlayerReady = (fn) => {
      if (!playerManager.activePlayer) return;
      if (playerManager.isReady()) {
        fn();
      } else {
        playerManager.whenReady().then(() => {
          if (playerManager.activePlayer && playerManager.isReady()) {
            fn();
          }
        });
      }
    };

    const handleRemotePlay = (data) => {
      if (!data) return;
      if (data.issuer && data.issuer === socket.id) return;
      whenPlayerReady(() => {
        isRemoteAction.current = true;

        let targetTime = data.currentTime;
        if (data.lastUpdateTimestamp && data.isPlaying) {
          const elapsed = (Date.now() - data.lastUpdateTimestamp) / 1000;
          targetTime += elapsed;
        }

        if (Math.abs(playerManager.getCurrentTime() - targetTime) > 0.3) {
          playerManager.seek(targetTime);
        }

        playerManager.play().catch(() => {});

        setTimeout(() => { isRemoteAction.current = false; }, 1200);
      });
    };

    const handleRemotePause = (data) => {
      if (!data) return;
      if (data.issuer && data.issuer === socket.id) return;
      whenPlayerReady(() => {
        isRemoteAction.current = true;

        if (typeof data.currentTime === 'number') {
          playerManager.seek(data.currentTime);
        }
        playerManager.pause();

        setTimeout(() => { isRemoteAction.current = false; }, 1200);
      });
    };

    const handleRemoteSeek = (data) => {
      if (!data) return;
      if (data.issuer && data.issuer === socket.id) return;
      whenPlayerReady(() => {
        isRemoteAction.current = true;

        if (typeof data.currentTime === 'number') {
          playerManager.seek(data.currentTime);
        }

        if (data.isPlaying) {
          playerManager.play().catch(() => {});
        } else {
          playerManager.pause();
        }

        setTimeout(() => { isRemoteAction.current = false; }, 1200);
      });
    };

    const handleSyncState = (data) => {
      if (!data) return;
      whenPlayerReady(() => {
        isRemoteAction.current = true;

        let targetTime = data.currentTime || 0;
        if (data.isPlaying && data.lastUpdateTimestamp) {
          const elapsed = (Date.now() - data.lastUpdateTimestamp) / 1000;
          targetTime += elapsed;
        }

        if (Math.abs(playerManager.getCurrentTime() - targetTime) > 0.3) {
          playerManager.seek(Math.max(0, targetTime));
          triggerResyncBadge();
        }

        if (data.isPlaying) {
          playerManager.play().catch(() => {});
        } else {
          playerManager.pause();
        }

        setTimeout(() => { isRemoteAction.current = false; }, 1200);
      });
    };

    socket.on('video-play', handleRemotePlay);
    socket.on('video-pause', handleRemotePause);
    socket.on('video-seek', handleRemoteSeek);
    socket.on('sync-state', handleSyncState);

    socket.emit('request-sync', { roomCode });

    return () => {
      socket.off('video-play', handleRemotePlay);
      socket.off('video-pause', handleRemotePause);
      socket.off('video-seek', handleRemoteSeek);
      socket.off('sync-state', handleSyncState);
    };
  }, [socket, roomCode, triggerResyncBadge]);

  useEffect(() => {
    if (!socket || !roomCode || !videoUrl) return;
    const playerManager = playerManagerRef.current;

    const interval = setInterval(() => {
      if (!playerManager.isReady() || !playerManager.activePlayer) return;
      if (canControlRef.current) return;
      if (playerManager.isBuffering()) return;

      socket.emit('request-sync', { roomCode }, (response) => {
        if (response && response.syncState) {
          const syncState = response.syncState;
          if (!syncState.isPlaying) return;

          let expectedTime = syncState.currentTime || 0;
          if (syncState.lastUpdateTimestamp) {
            const elapsed = (Date.now() - syncState.lastUpdateTimestamp) / 1000;
            expectedTime += elapsed;
          }

          const currentPos = playerManager.getCurrentTime();
          const drift = Math.abs(currentPos - expectedTime);

          if (drift > 3.5) {
            console.log(`[Drift Correction] Correcting drift of ${drift.toFixed(2)}s`);
            isRemoteAction.current = true;
            playerManager.seek(expectedTime);

            if (syncState.isPlaying && !playerManager.isPlaying()) {
              playerManager.play().catch(() => {});
            }

            triggerResyncBadge();

            setTimeout(() => { isRemoteAction.current = false; }, 1500);
          }
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [socket, roomCode, videoUrl, triggerResyncBadge]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedUrl = inputUrl.trim();
    if (!trimmedUrl) {
      setErrorMessage('Unable to load video.');
      return;
    }

    const provider = PlayerManager.detectProvider(trimmedUrl);
    setDetectedProvider(provider);

    if (provider.type === PROVIDERS.UNKNOWN.type) {
      setErrorMessage('Unsupported Video Provider');
      return;
    }

    if (typeof onLoadVideo === 'function') {
      onLoadVideo(trimmedUrl, provider.type);
    }
  };

  return (
    <div className="w-full space-y-4 font-sans selection:bg-[#C5A059]/30">
      {/* Top Input Bar */}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3">
        <input
          type="url"
          placeholder="Paste YouTube, Google Drive, or Direct Video Stream URL"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          className="flex-1 w-full px-4 py-3 bg-[#0E0E12] border border-white/[0.12] focus:border-[#C5A059] text-sm text-white font-sans outline-none transition-colors placeholder:text-[#444]"
        />
        <button
          type="submit"
          className="w-full sm:w-auto px-6 py-3 bg-[#F3F3F5] text-black font-grotesk font-bold text-xs uppercase tracking-[0.18em] hover:bg-white transition-colors duration-150 border border-white whitespace-nowrap"
        >
          LOAD STREAM
        </button>
      </form>

      {/* Header Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 font-mono text-xs text-[#A1A1A6]">
        <div className="flex items-center gap-2">
          <span>SOURCE:</span>
          <span className="font-semibold text-white px-2.5 py-0.5 bg-[#0E0E12] border border-white/[0.1]">
            {detectedProvider.name}
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {resyncedBadge ? (
            <span className="flex items-center gap-1.5 font-semibold px-3 py-0.5 bg-amber-500/10 border border-amber-500/40 text-amber-300 font-mono text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              RESYNCHRONIZED
            </span>
          ) : (
            <span className="flex items-center gap-1.5 font-semibold px-3 py-0.5 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 font-mono text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              SYNCHRONIZED
            </span>
          )}

          <div className="flex items-center gap-1">
            <span>AUTHORITY:</span>
            <strong className="text-white font-medium">
              {playbackMode === 'Everyone'
                ? 'EVERYONE'
                : isHost
                ? 'HOST (YOU)'
                : effectiveCanControl
                ? 'GRANTED'
                : 'HOST ONLY'}
            </strong>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 font-mono text-xs flex items-center justify-between">
          <span>ERR // {errorMessage}</span>
          <button
            onClick={() => setErrorMessage('')}
            className="text-[#A1A1A6] hover:text-white font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Universal Player Canvas Container */}
      <div className="relative w-full aspect-video bg-[#040405] border border-white/[0.1] shadow-2xl overflow-hidden flex items-center justify-center">
        {/* Loading Spinner */}
        {isLoading && videoUrl && (
          <div className="absolute inset-0 bg-[#08080A]/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10 font-mono">
            <div className="w-8 h-8 border-2 border-white/20 border-t-[#C5A059] rounded-full animate-spin" />
            <span className="text-xs text-[#A1A1A6] tracking-widest uppercase">INITIALIZING MEDIA PIPELINE...</span>
          </div>
        )}

        {/* DOM container */}
        <div
          ref={containerRef}
          className={`w-full h-full ${!videoUrl ? 'hidden' : 'block'}`}
        />

        {/* Empty State */}
        {!videoUrl && (
          <div className="font-mono text-xs text-[#6E6E73] tracking-[0.25em] uppercase text-center p-8">
            [ NO VIDEO STREAM LOADED // PASTE STREAM URL ABOVE ]
          </div>
        )}
      </div>
    </div>
  );
}
