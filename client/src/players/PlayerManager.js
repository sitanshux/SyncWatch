import HTML5Player from './players/HTML5Player';
import YouTubePlayer from './players/YouTubePlayer';
import GoogleDrivePlayer from './players/GoogleDrivePlayer';
import CloudinaryPlayer from './players/CloudinaryPlayer';
import VimeoPlayer from './players/VimeoPlayer';
import DailymotionPlayer from './players/DailymotionPlayer';
import DropboxPlayer from './players/DropboxPlayer';

/**
 * Supported Provider Constants
 */
export const PROVIDERS = {
  HTML5: { type: 'html5', name: 'HTML5' },
  YOUTUBE: { type: 'youtube', name: 'YouTube' },
  GOOGLE_DRIVE: { type: 'googledrive', name: 'Google Drive' },
  CLOUDINARY: { type: 'cloudinary', name: 'Cloudinary' },
  VIMEO: { type: 'vimeo', name: 'Vimeo' },
  DAILYMOTION: { type: 'dailymotion', name: 'Dailymotion' },
  DROPBOX: { type: 'dropbox', name: 'Dropbox' },
  UNKNOWN: { type: 'unknown', name: 'Unsupported Video Provider' },
};

/**
 * PlayerManager
 * Universal Video Player Architecture Manager & Adapter Facade.
 *
 * KEY DESIGN: initializePlayer returns a Promise so that callers
 * can await async adapters (YouTube) before issuing load/play/seek.
 * A monotonic _initId guards against stale inits stomping new ones.
 */
export default class PlayerManager {
  constructor() {
    this.activePlayer = null;
    this.currentProvider = null;
    this.eventListeners = new Map();
    this._ready = false;       // true once initialize + ready event complete
    this._initId = 0;          // monotonic counter to discard stale inits
    this._readyPromise = null; // resolves when active player is ready
    this._readyResolver = null;
  }

  /**
   * Automatically detect provider based on video URL
   * @param {string} url
   * @returns {{ type: string, name: string }}
   */
  static detectProvider(url) {
    if (!url || typeof url !== 'string') return PROVIDERS.UNKNOWN;
    const lowerUrl = url.trim().toLowerCase();

    // YouTube
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
      return PROVIDERS.YOUTUBE;
    }
    // Google Drive
    if (lowerUrl.includes('drive.google.com')) {
      return PROVIDERS.GOOGLE_DRIVE;
    }
    // Cloudinary
    if (lowerUrl.includes('cloudinary.com') || lowerUrl.includes('res.cloudinary.com')) {
      return PROVIDERS.CLOUDINARY;
    }
    // Vimeo
    if (lowerUrl.includes('vimeo.com')) {
      return PROVIDERS.VIMEO;
    }
    // Dailymotion
    if (lowerUrl.includes('dailymotion.com') || lowerUrl.includes('dai.ly')) {
      return PROVIDERS.DAILYMOTION;
    }
    // Dropbox
    if (lowerUrl.includes('dropbox.com')) {
      return PROVIDERS.DROPBOX;
    }
    // Direct HTML5 video extension or standard web URL
    if (
      lowerUrl.match(/\.(mp4|webm|ogg|ogv|m3u8|mpd|mov)(\?.*)?$/i) ||
      lowerUrl.startsWith('http://') ||
      lowerUrl.startsWith('https://')
    ) {
      return PROVIDERS.HTML5;
    }

    return PROVIDERS.UNKNOWN;
  }

  /**
   * Instantiate and initialize player for a specific provider.
   * Returns a Promise that resolves when the player is fully ready
   * (iframe created, onReady fired for YouTube; element appended for HTML5).
   */
  async initializePlayer(providerType, container) {
    // Bump init counter — any in‑flight init with a lower id is stale.
    const thisInit = ++this._initId;

    // Destroy existing player if present
    if (this.activePlayer) {
      this.activePlayer.destroy();
      this.activePlayer = null;
    }
    this._ready = false;

    // Create a readiness promise that external code can await.
    this._readyPromise = new Promise((resolve) => {
      this._readyResolver = resolve;
    });

    switch (providerType) {
      case PROVIDERS.HTML5.type:
        this.activePlayer = new HTML5Player();
        break;
      case PROVIDERS.YOUTUBE.type:
        this.activePlayer = new YouTubePlayer();
        break;
      case PROVIDERS.GOOGLE_DRIVE.type:
        this.activePlayer = new GoogleDrivePlayer();
        break;
      case PROVIDERS.CLOUDINARY.type:
        this.activePlayer = new CloudinaryPlayer();
        break;
      case PROVIDERS.VIMEO.type:
        this.activePlayer = new VimeoPlayer();
        break;
      case PROVIDERS.DAILYMOTION.type:
        this.activePlayer = new DailymotionPlayer();
        break;
      case PROVIDERS.DROPBOX.type:
        this.activePlayer = new DropboxPlayer();
        break;
      default:
        throw new Error('Unsupported Video Provider');
    }

    this.currentProvider = providerType;

    // Listen for the 'canplay' event to mark readiness.
    // For HTML5 this fires from the native element; for YouTube from _onReady / _onStateChange.
    const markReady = () => {
      if (this._initId !== thisInit) return; // stale
      if (!this._ready) {
        this._ready = true;
        if (this._readyResolver) {
          this._readyResolver();
          this._readyResolver = null;
        }
      }
    };
    this.activePlayer.on('canplay', markReady);
    this.activePlayer.on('ready', markReady);

    // Re‑attach existing subscribers to the new player
    this.eventListeners.forEach((callbacks, event) => {
      callbacks.forEach((cb) => this.activePlayer.on(event, cb));
    });

    // Call initialize — may be async (YouTube) or sync (HTML5).
    await this.activePlayer.initialize(container);

    // Guard: if a newer init started while we were awaiting, bail out.
    if (this._initId !== thisInit) {
      return this.activePlayer;
    }

    // For synchronous adapters (HTML5) that fire canplay during load()
    // _ready may already be true at this point. That's fine.

    return this.activePlayer;
  }

  /**
   * Wait until the current player is ready.
   * Safe to call at any time — resolves immediately if already ready.
   */
  whenReady() {
    if (this._ready) return Promise.resolve();
    if (this._readyPromise) return this._readyPromise;
    // No active init — return a promise that won't resolve
    // (caller should guard with activePlayer check)
    return new Promise(() => {});
  }

  /**
   * Universal Adapter Facade Methods
   */
  load(source) {
    if (this.activePlayer) this.activePlayer.load(source);
  }

  play() {
    return this.activePlayer ? this.activePlayer.play() : Promise.resolve();
  }

  pause() {
    if (this.activePlayer) this.activePlayer.pause();
  }

  seek(seconds) {
    if (this.activePlayer) this.activePlayer.seek(seconds);
  }

  getCurrentTime() {
    return this.activePlayer ? this.activePlayer.getCurrentTime() : 0;
  }

  isPlaying() {
    return this.activePlayer ? this.activePlayer.isPlaying() : false;
  }

  isBuffering() {
    return this.activePlayer && typeof this.activePlayer.isBuffering === 'function'
      ? this.activePlayer.isBuffering()
      : false;
  }

  isReady() {
    return this._ready;
  }

  setVolume(value) {
    if (this.activePlayer) this.activePlayer.setVolume(value);
  }

  mute() {
    if (this.activePlayer) this.activePlayer.mute();
  }

  unmute() {
    if (this.activePlayer) this.activePlayer.unmute();
  }

  destroy() {
    this._initId++; // invalidate any in‑flight async init
    if (this.activePlayer) {
      this.activePlayer.destroy();
      this.activePlayer = null;
    }
    this._ready = false;
    this.eventListeners.clear();
    // Resolve any pending ready promise so nothing hangs.
    if (this._readyResolver) {
      this._readyResolver();
      this._readyResolver = null;
    }
    // Null out the promise so whenReady() doesn't return a stale resolved promise
    this._readyPromise = null;
  }

  /**
   * Universal Event Subscription
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);

    if (this.activePlayer) {
      this.activePlayer.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const callbacks = this.eventListeners.get(event).filter((cb) => cb !== callback);
      this.eventListeners.set(event, callbacks);
    }
    if (this.activePlayer) {
      this.activePlayer.off(event, callback);
    }
  }
}
