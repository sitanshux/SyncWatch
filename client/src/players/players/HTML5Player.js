import BasePlayer from '../BasePlayer';

/**
 * HTML5Player Adapter
 * Fully implemented HTML5 video player adapter.
 */
export default class HTML5Player extends BasePlayer {
  constructor() {
    super();
    this.videoElement = null;
    this.container = null;
    this._isPlaying = false;
  }

  initialize(container) {
    if (!container) return;
    this.container = container;

    // Create native video element
    this.videoElement = document.createElement('video');
    this.videoElement.controls = true;
    this.videoElement.playsInline = true;
    this.videoElement.className = 'w-full h-full object-contain bg-black rounded-lg';

    // Event listeners mapping
    this.videoElement.addEventListener('loadstart', () => {
      this.emit('loadstart');
    });

    this.videoElement.addEventListener('loadedmetadata', () => {
      this.emit('loadedmetadata');
    });

    this.videoElement.addEventListener('canplay', () => {
      this.emit('canplay');
    });

    this.videoElement.addEventListener('play', () => {
      this._isPlaying = true;
      this.emit('play');
    });

    this.videoElement.addEventListener('pause', () => {
      this._isPlaying = false;
      this.emit('pause');
    });

    this.videoElement.addEventListener('seeking', () => {
      this.emit('seeking');
    });

    this.videoElement.addEventListener('seeked', () => {
      this.emit('seeked');
    });

    this.videoElement.addEventListener('ended', () => {
      this._isPlaying = false;
      this.emit('ended');
    });

    this.videoElement.addEventListener('waiting', () => {
      this.emit('waiting');
    });

    this.videoElement.addEventListener('error', (e) => {
      this.emit('error', e);
    });

    // Clear container and append element
    container.innerHTML = '';
    container.appendChild(this.videoElement);
  }

  load(source) {
    if (!this.videoElement) return;
    this.videoElement.src = source;
    this.videoElement.load();
  }

  play() {
    if (!this.videoElement) return Promise.reject(new Error('No video element'));
    return this.videoElement.play().then(() => {
      this._isPlaying = true;
    });
  }

  pause() {
    if (!this.videoElement) return;
    this.videoElement.pause();
    this._isPlaying = false;
  }

  seek(seconds) {
    if (!this.videoElement) return;
    this.videoElement.currentTime = Math.max(0, seconds);
  }

  getCurrentTime() {
    return this.videoElement ? this.videoElement.currentTime : 0;
  }

  isPlaying() {
    return this._isPlaying && this.videoElement && !this.videoElement.paused;
  }

  isBuffering() {
    if (!this.videoElement) return false;
    return this.videoElement.readyState < 3 || this.videoElement.seeking;
  }

  setVolume(value) {
    if (!this.videoElement) return;
    this.videoElement.volume = Math.max(0, Math.min(1, value));
  }

  mute() {
    if (!this.videoElement) return;
    this.videoElement.muted = true;
  }

  unmute() {
    if (!this.videoElement) return;
    this.videoElement.muted = false;
  }

  destroy() {
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.removeAttribute('src');
      this.videoElement.load();
      if (this.videoElement.parentNode) {
        this.videoElement.parentNode.removeChild(this.videoElement);
      }
      this.videoElement = null;
    }
    super.destroy();
  }
}
