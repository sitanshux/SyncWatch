import BasePlayer from '../BasePlayer';
import HTML5Player from './HTML5Player';

/**
 * GoogleDrivePlayer Adapter
 *
 * Converts Google Drive sharing links into a proxy URL served by our own
 * Express backend (/api/drive-stream/:fileId). This bypasses Google's CORS
 * restrictions entirely. The proxy streams the raw video bytes, so the
 * HTML5 <video> element works normally — full play/pause/seek/sync support.
 *
 * Supported input formats:
 *   https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 *   https://drive.google.com/file/d/FILE_ID/view
 *   https://drive.google.com/open?id=FILE_ID
 */

const SERVER_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default class GoogleDrivePlayer extends BasePlayer {
  constructor() {
    super();
    this.container = null;
    this._html5 = null;
  }

  /**
   * Extract Google Drive File ID from various link formats.
   */
  static _extractFileId(url) {
    if (!url) return null;

    // Format: /file/d/FILE_ID/
    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch) return fileMatch[1];

    // Format: ?id=FILE_ID or &id=FILE_ID
    const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch) return idMatch[1];

    return null;
  }

  // ── BasePlayer interface ─────────────────────────────────────────

  initialize(container) {
    this.container = container;
    this._html5 = new HTML5Player();
    this._html5.initialize(container);

    // Forward ALL events from the internal HTML5Player
    const events = [
      'loadstart', 'loadedmetadata', 'canplay', 'ready',
      'play', 'pause', 'seeking', 'seeked',
      'ended', 'waiting', 'error',
    ];
    events.forEach((evt) => {
      this._html5.on(evt, (data) => this.emit(evt, data));
    });
  }

  load(source) {
    const fileId = GoogleDrivePlayer._extractFileId(source);

    if (!fileId) {
      this.emit('error', {
        code: 'INVALID_DRIVE_LINK',
        message: 'Invalid Google Drive link. Could not extract File ID.',
      });
      return;
    }

    const serverUrl = `${window.location.protocol}//${window.location.hostname}:3001`;
    const proxyUrl = `${serverUrl}/api/drive-stream/${fileId}`;
    console.log('[GoogleDrivePlayer] Proxy URL:', proxyUrl);

    if (this._html5) {
      this._html5.load(proxyUrl);
    }
  }

  play() {
    return this._html5 ? this._html5.play() : Promise.resolve();
  }

  pause() {
    if (this._html5) this._html5.pause();
  }

  seek(seconds) {
    if (this._html5) this._html5.seek(seconds);
  }

  getCurrentTime() {
    return this._html5 ? this._html5.getCurrentTime() : 0;
  }

  isPlaying() {
    return this._html5 ? this._html5.isPlaying() : false;
  }

  setVolume(value) {
    if (this._html5) this._html5.setVolume(value);
  }

  mute() {
    if (this._html5) this._html5.mute();
  }

  unmute() {
    if (this._html5) this._html5.unmute();
  }

  destroy() {
    if (this._html5) {
      this._html5.destroy();
      this._html5 = null;
    }
    this.container = null;
    super.destroy();
  }
}
