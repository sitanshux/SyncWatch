/**
 * BasePlayer
 * Abstract base class defining the universal player interface.
 */
export default class BasePlayer {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Initialize player inside container DOM element
   */
  initialize(container) {
    throw new Error('initialize() must be implemented by subclass.');
  }

  /**
   * Load video source URL
   */
  load(source) {
    throw new Error('load() must be implemented by subclass.');
  }

  /**
   * Play video
   */
  play() {
    throw new Error('play() must be implemented by subclass.');
  }

  /**
   * Pause video
   */
  pause() {
    throw new Error('pause() must be implemented by subclass.');
  }

  /**
   * Seek video to specified seconds
   */
  seek(seconds) {
    throw new Error('seek() must be implemented by subclass.');
  }

  /**
   * Get current playback time in seconds
   */
  getCurrentTime() {
    throw new Error('getCurrentTime() must be implemented by subclass.');
  }

  /**
   * Check if video is currently playing
   */
  isPlaying() {
    throw new Error('isPlaying() must be implemented by subclass.');
  }

  /**
   * Set playback volume (0.0 to 1.0)
   */
  setVolume(value) {
    throw new Error('setVolume() must be implemented by subclass.');
  }

  /**
   * Mute video audio
   */
  mute() {
    throw new Error('mute() must be implemented by subclass.');
  }

  /**
   * Unmute video audio
   */
  unmute() {
    throw new Error('unmute() must be implemented by subclass.');
  }

  /**
   * Clean up resources and remove elements
   */
  destroy() {
    this.listeners.clear();
  }

  /**
   * Subscribe to player events
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Unsubscribe from player events
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event).filter(cb => cb !== callback);
    this.listeners.set(event, callbacks);
  }

  /**
   * Emit event to subscribers
   */
  emit(event, data) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (err) {
        console.error(`[BasePlayer Error in ${event} listener]:`, err);
      }
    });
  }
}
