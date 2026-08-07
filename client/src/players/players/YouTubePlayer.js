import BasePlayer from '../BasePlayer';

/**
 * YouTubePlayer Adapter (Official YouTube IFrame API)
 *
 * KEY FIXES:
 * - Creates a CHILD div for YT.Player so the container div (owned by React) is never replaced
 * - Uses cueVideoById instead of loadVideoById to prevent auto-play conflicts with sync engine
 * - Tracks _isSeeking to emit proper seeked events
 */
export default class YouTubePlayer extends BasePlayer {
  constructor() {
    super();
    this.container = null;
    this.playerDiv = null;   // child div that YT.Player replaces with iframe
    this.player = null;
    this._isPlaying = false;
    this._ready = false;
    this._pendingVideoId = null;
    this._iframeCheckTimer = null;
  }

  /**
   * Ensure YouTube IFrame API script is loaded exactly once.
   */
  static _ensureYouTubeAPI() {
    // API already fully loaded
    if (window.YT && window.YT.Player) {
      console.log('[YouTubePlayer] API already loaded');
      return Promise.resolve(window.YT);
    }
    // Script already injected, waiting for callback
    if (window.__ytApiPromise) {
      console.log('[YouTubePlayer] API script already injected, awaiting ready');
      return window.__ytApiPromise;
    }
    console.log('[YouTubePlayer] Injecting YouTube IFrame API script');
    window.__ytApiPromise = new Promise((resolve) => {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      const first = document.getElementsByTagName('script')[0];
      if (first && first.parentNode) {
        first.parentNode.insertBefore(tag, first);
      } else {
        document.head.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = () => {
        console.log('[YouTubePlayer] onYouTubeIframeAPIReady fired');
        resolve(window.YT);
      };
    });
    return window.__ytApiPromise;
  }

  /**
   * Extract video ID from supported YouTube URL formats.
   */
  static _extractVideoId(url) {
    if (!url) return null;
    const re = /(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/;
    const m = url.match(re);
    return m ? m[1] : null;
  }

  /**
   * Create the YT.Player inside a disposable child div so the
   * React-owned container is never removed from the DOM.
   */
  _createPlayer() {
    const container = this.container;
    if (!container) return;

    // Clear previous content and create a fresh target div
    container.innerHTML = '';
    this.playerDiv = document.createElement('div');
    this.playerDiv.style.width = '100%';
    this.playerDiv.style.height = '100%';
    container.appendChild(this.playerDiv);

    console.log('[YouTubePlayer] Creating YT.Player');
    this.player = new window.YT.Player(this.playerDiv, {
      width: '100%',
      height: '100%',
      videoId: '',
      playerVars: {
        controls: 1,
        modestbranding: 1,
        rel: 0,
        iv_load_policy: 3,
        fs: 1,
        playsinline: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: this._onReady.bind(this),
        onStateChange: this._onStateChange.bind(this),
        onError: this._onError.bind(this),
      },
    });
    console.log('[YouTubePlayer] YT.Player constructor returned');

    // Verify iframe insertion within 3 seconds
    if (this._iframeCheckTimer) clearTimeout(this._iframeCheckTimer);
    this._iframeCheckTimer = setTimeout(() => {
      const iframe = container.querySelector('iframe');
      if (iframe) {
        console.log('[YouTubePlayer] Iframe confirmed in DOM');
      } else {
        console.error('[YouTubePlayer] No iframe after 3s. Connected:', container.isConnected);
      }
    }, 3000);
  }

  /**
   * Initialize player inside the given container.
   */
  async initialize(container) {
    console.log('[YouTubePlayer] initialize() called');
    // Clean up any previous instance
    this._destroyInternal();
    this.container = container;

    await YouTubePlayer._ensureYouTubeAPI();

    // Guard: if destroyed while awaiting API
    if (!this.container) return;

    this._createPlayer();
  }

  _destroyInternal() {
    if (this._iframeCheckTimer) {
      clearTimeout(this._iframeCheckTimer);
      this._iframeCheckTimer = null;
    }
    if (this.player) {
      try { this.player.destroy(); } catch (e) { /* already destroyed */ }
      this.player = null;
    }
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.playerDiv = null;
    this._ready = false;
    this._isPlaying = false;
    this._pendingVideoId = null;
  }

  // ── YT Event Handlers ───────────────────────────────────────────

  _onReady() {
    console.log('[YouTubePlayer] onReady fired');
    this._ready = true;
    this.emit('ready');
    this.emit('canplay');

    if (this._pendingVideoId) {
      console.log('[YouTubePlayer] Loading queued video:', this._pendingVideoId);
      this._loadById(this._pendingVideoId);
      this._pendingVideoId = null;
    }
  }

  _onStateChange(event) {
    const state = event.data;
    const YT = window.YT;
    console.log('[YouTubePlayer] stateChange:', state);

    switch (state) {
      case YT.PlayerState.PLAYING:
        this._isPlaying = true;
        this.emit('canplay');
        this.emit('play');
        break;
      case YT.PlayerState.PAUSED:
        this._isPlaying = false;
        this.emit('canplay');
        this.emit('pause');
        break;
      case YT.PlayerState.ENDED:
        this._isPlaying = false;
        this.emit('ended');
        break;
      case YT.PlayerState.BUFFERING:
        this.emit('waiting');
        break;
      case YT.PlayerState.CUED:
        this.emit('canplay');
        break;
      default:
        break;
    }
  }

  _onError(event) {
    const code = event.data;
    const messages = {
      2: 'Invalid parameter value.',
      5: 'HTML5 player error.',
      100: 'Video not found (deleted or private).',
      101: 'Embedding not allowed by video owner.',
      150: 'Embedding not allowed by video owner.',
    };
    const message = messages[code] || 'Unknown YouTube error.';
    console.error('[YouTubePlayer] error:', code, message);
    this.emit('error', { code, message });
  }

  // ── Public API ───────────────────────────────────────────────────

  /**
   * Internal: load by extracted video ID using cueVideoById
   * to avoid auto-play conflicts. Sync engine will call play() when ready.
   */
  _loadById(videoId) {
    if (!this.player) return;
    this.emit('loadstart');
    // cueVideoById loads the video WITHOUT auto-playing.
    // The sync engine will call play() if the room state is "playing".
    this.player.cueVideoById({ videoId, startSeconds: 0 });
    console.log('[YouTubePlayer] cueVideoById called:', videoId);
    this.emit('loadedmetadata');
    this.emit('canplay');
  }

  load(source) {
    const videoId = YouTubePlayer._extractVideoId(source) || source;
    if (!videoId) {
      this.emit('error', { code: null, message: 'Invalid YouTube URL or ID' });
      return;
    }
    console.log('[YouTubePlayer] load() videoId:', videoId);
    if (!this._ready) {
      this._pendingVideoId = videoId;
      console.log('[YouTubePlayer] Queued – player not ready yet');
      return;
    }
    this._loadById(videoId);
  }

  play() {
    if (!this._ready || !this.player) return Promise.resolve();
    console.log('[YouTubePlayer] play()');
    this.player.playVideo();
    return Promise.resolve();
  }

  pause() {
    if (!this._ready || !this.player) return;
    console.log('[YouTubePlayer] pause()');
    this.player.pauseVideo();
  }

  seek(seconds) {
    if (!this._ready || !this.player) return;
    console.log('[YouTubePlayer] seek()', seconds);
    this.player.seekTo(seconds, true);
    this.emit('seeked');
  }

  getCurrentTime() {
    if (!this._ready || !this.player) return 0;
    return this.player.getCurrentTime();
  }

  isPlaying() {
    return this._isPlaying;
  }

  setVolume(value) {
    if (!this._ready || !this.player) return;
    this.player.setVolume(Math.max(0, Math.min(100, value * 100)));
  }

  mute() {
    if (!this._ready || !this.player) return;
    this.player.mute();
  }

  unmute() {
    if (!this._ready || !this.player) return;
    this.player.unMute();
  }

  destroy() {
    console.log('[YouTubePlayer] destroy()');
    this._destroyInternal();
    this.container = null;
    super.destroy();
  }
}
