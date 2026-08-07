/**
 * RoomManager - RAM-only state store for SyncWatch rooms
 */
class RoomManager {
  constructor() {
    // Map<roomCode, RoomObject>
    this.rooms = new Map();
    // Map<socketId, { roomCode, displayName }>
    this.userRooms = new Map();
  }

  /**
   * Create a new room
   */
  createRoom({ roomCode, roomName, hostSocketId, hostDisplayName, password = '', playbackMode = 'Host Only', userToken = null }) {
    const formattedCode = roomCode.toUpperCase().trim();

    if (this.rooms.has(formattedCode)) {
      return { success: false, message: 'Room code already exists. Please try again.' };
    }

    const hostUser = {
      socketId: hostSocketId,
      displayName: hostDisplayName || 'Host',
      isHost: true,
      userToken: userToken || null,
    };

    const room = {
      roomCode: formattedCode,
      roomName: (roomName || 'SyncWatch Room').trim(),
      hostSocketId,
      hostDisplayName: (hostDisplayName || 'Host').trim(),
      hostToken: userToken || null,
      creatorDisplayName: (hostDisplayName || 'Host').trim(),
      password: password ? String(password).trim() : '',
      playbackMode: playbackMode || 'Host Only',
      videoUrl: null,
      providerType: 'html5',
      currentTime: 0,
      isPlaying: false,
      lastUpdateTimestamp: Date.now(),
      connectedUsers: [hostUser],
      chatMessages: [],
      queue: [],
      nowPlaying: null,
      createdAt: Date.now(),
    };
    
    // Store in RAM
    this.rooms.set(formattedCode, room);
    this.userRooms.set(hostSocketId, { roomCode: formattedCode, displayName: hostUser.displayName });

    return { success: true, room };
  }

  /**
   * Join an existing room
   */
  joinRoom({ roomCode, socketId, displayName, password = '', userToken = null }) {
    const formattedCode = (roomCode || '').toUpperCase().trim();
    const room = this.rooms.get(formattedCode);

    if (!room) {
      return { success: false, message: 'Room not found. Please check the code and try again.' };
    }

    // Check password if set
    if (room.password && room.password !== String(password).trim()) {
      return { success: false, message: 'Incorrect room password.' };
    }

    // Cancel the 30-second room destroy timer if someone rejoins
    if (room._destroyTimer) {
      clearTimeout(room._destroyTimer);
      room._destroyTimer = null;
    }

    // Restore play state if room was playing before the last user left/refreshed
    if (room.wasPlayingWhenEmpty) {
      room.isPlaying = true;
      room.lastUpdateTimestamp = Date.now();
      delete room.wasPlayingWhenEmpty;
    }

    const joiningName = (displayName || '').trim();
    const existingUserIndex = room.connectedUsers.findIndex(u => u.socketId === socketId);

    const matchesHostToken = Boolean(userToken && room.hostToken && userToken === room.hostToken);
    const isCreator = Boolean(joiningName && (joiningName === room.creatorDisplayName || joiningName === room.hostDisplayName));
    const isRoomEmpty = room.connectedUsers.length === 0;

    const shouldBeHost = matchesHostToken || isCreator || isRoomEmpty;

    if (shouldBeHost) {
      room.hostSocketId = socketId;
      room.hostDisplayName = joiningName || room.hostDisplayName || 'Host';
      if (userToken) room.hostToken = userToken;
      // Demote all other connected users
      room.connectedUsers.forEach(u => { u.isHost = false; });
    }

    let user;

    if (existingUserIndex >= 0) {
      room.connectedUsers[existingUserIndex].displayName = joiningName || room.connectedUsers[existingUserIndex].displayName;
      room.connectedUsers[existingUserIndex].isHost = shouldBeHost;
      if (userToken) room.connectedUsers[existingUserIndex].userToken = userToken;
      user = room.connectedUsers[existingUserIndex];
    } else {
      user = {
        socketId,
        displayName: joiningName || `User_${socketId.substring(0, 4)}`,
        isHost: shouldBeHost,
        userToken: userToken || null,
      };
      room.connectedUsers.push(user);
    }

    this.userRooms.set(socketId, { roomCode: formattedCode, displayName: user.displayName });

    return { success: true, room, user };
  }

  /**
   * Update Video URL & Provider Type for a room in RAM
   */
  updateVideoUrl(roomCode, videoUrl, providerType = 'html5') {
    const formattedCode = (roomCode || '').toUpperCase().trim();
    const room = this.rooms.get(formattedCode);

    if (!room) {
      return { success: false, message: 'Room not found.' };
    }

    room.videoUrl = videoUrl ? String(videoUrl).trim() : null;
    room.providerType = providerType || 'html5';
    room.currentTime = 0;
    room.isPlaying = false;
    room.lastUpdateTimestamp = Date.now();

    return { success: true, room };
  }

  /**
   * Calculate live server currentTime taking elapsed play time into account
   */
  calculateCurrentTime(room) {
    if (!room) return 0;
    if (room.isPlaying) {
      const elapsedSeconds = (Date.now() - room.lastUpdateTimestamp) / 1000;
      return Math.max(0, room.currentTime + elapsedSeconds);
    }
    return room.currentTime;
  }

  /**
   * Permission check
   */
  canControlPlayback(room, socketId) {
    if (!room) return false;
    if (room.playbackMode === 'Everyone') return true;
    if (socketId === room.hostSocketId) return true;
    const user = (room.connectedUsers || []).find(u => u.socketId === socketId);
    return user ? Boolean(user.canControlPlayback) : false;
  }

  /**
   * Play Video event
   */
  playVideo(roomCode, socketId, currentTime) {
    const formattedCode = (roomCode || '').toUpperCase().trim();
    const room = this.rooms.get(formattedCode);

    if (!room) return { success: false, message: 'Room not found.' };
    if (!room.videoUrl) return { success: false, message: 'No video loaded.' };
    if (!this.canControlPlayback(room, socketId)) {
      return { success: false, message: 'Unauthorized: Only the host may control playback.' };
    }

    room.currentTime = typeof currentTime === 'number' ? currentTime : this.calculateCurrentTime(room);
    room.isPlaying = true;
    room.lastUpdateTimestamp = Date.now();
    room.currentStatus = 'playing';

    return { success: true, room };
  }

  /**
   * Pause Video event
   */
  pauseVideo(roomCode, socketId, currentTime) {
    const formattedCode = (roomCode || '').toUpperCase().trim();
    const room = this.rooms.get(formattedCode);

    if (!room) return { success: false, message: 'Room not found.' };
    if (!room.videoUrl) return { success: false, message: 'No video loaded.' };
    if (!this.canControlPlayback(room, socketId)) {
      return { success: false, message: 'Unauthorized: Only the host may control playback.' };
    }

    room.currentTime = typeof currentTime === 'number' ? currentTime : this.calculateCurrentTime(room);
    room.isPlaying = false;
    room.lastUpdateTimestamp = Date.now();
    room.currentStatus = 'paused';

    return { success: true, room };
  }

  /**
   * Seek Video event
   */
  seekVideo(roomCode, socketId, currentTime) {
    const formattedCode = (roomCode || '').toUpperCase().trim();
    const room = this.rooms.get(formattedCode);

    if (!room) return { success: false, message: 'Room not found.' };
    if (!room.videoUrl) return { success: false, message: 'No video loaded.' };
    if (!this.canControlPlayback(room, socketId)) {
      return { success: false, message: 'Unauthorized: Only the host may control playback.' };
    }

    room.currentTime = typeof currentTime === 'number' ? Math.max(0, currentTime) : 0;
    room.lastUpdateTimestamp = Date.now();

    return { success: true, room };
  }

  /**
   * Get formatted playback sync state for a room
   */
  getSyncState(roomCode) {
    const formattedCode = (roomCode || '').toUpperCase().trim();
    const room = this.rooms.get(formattedCode);

    if (!room) return null;

    return {
      roomCode: room.roomCode,
      videoUrl: room.videoUrl,
      providerType: room.providerType,
      currentTime: room.currentTime || 0,
      isPlaying: room.isPlaying,
      lastUpdateTimestamp: room.lastUpdateTimestamp,
      playbackMode: room.playbackMode,
      hostSocketId: room.hostSocketId,
    };
  }

  /**
   * Leave room
   */
  leaveRoom(socketId) {
    const userSession = this.userRooms.get(socketId);
    if (!userSession) return null;

    const { roomCode } = userSession;
    const room = this.rooms.get(roomCode);

    this.userRooms.delete(socketId);

    if (!room) return null;

    const leavingUser = room.connectedUsers.find(u => u.socketId === socketId);
    room.connectedUsers = room.connectedUsers.filter(u => u.socketId !== socketId);

    if (room.connectedUsers.length === 0) {
      // Freeze the playback time before everyone leaves so it can be restored on reconnect
      if (room.isPlaying) {
        room.currentTime = this.calculateCurrentTime(room);
        room.wasPlayingWhenEmpty = true;
        room.isPlaying = false;
        room.lastUpdateTimestamp = Date.now();
      }

      // Keep the room alive for 30 seconds to survive page refreshes
      if (room._destroyTimer) clearTimeout(room._destroyTimer);
      room._destroyTimer = setTimeout(() => {
        const current = this.rooms.get(roomCode);
        if (current && current.connectedUsers.length === 0) {
          this.rooms.delete(roomCode);
          console.log(`[RoomManager] Room ${roomCode} was empty for 30s. Deleted from RAM.`);
        }
      }, 30000);

      console.log(`[RoomManager] Room ${roomCode} is empty. Will auto-delete in 30s if no one rejoins.`);
      return {
        roomCode,
        roomDeleted: true,
        leavingUser,
      };
    }

    if (socketId === room.hostSocketId && room.connectedUsers.length > 0) {
      room.connectedUsers[0].isHost = true;
      room.hostSocketId = room.connectedUsers[0].socketId;
      room.hostDisplayName = room.connectedUsers[0].displayName;
      if (room.connectedUsers[0].userToken) {
        room.hostToken = room.connectedUsers[0].userToken;
      }
      console.log(`[RoomManager] Host left room ${roomCode}. New host assigned: ${room.hostDisplayName}`);
    }

    return {
      roomCode,
      roomDeleted: false,
      room,
      leavingUser,
    };
  }

  /**
   * Add a chat message to a room (capped at 200 messages)
   */
  addChatMessage(roomCode, socketId, messageText) {
    const formattedCode = (roomCode || '').toUpperCase().trim();
    const room = this.rooms.get(formattedCode);

    if (!room) return { success: false, message: 'Room not found.' };

    const text = (messageText || '').trim();
    if (!text) return { success: false, message: 'Message cannot be empty.' };

    if (!Array.isArray(room.chatMessages)) {
      room.chatMessages = [];
    }

    const user = room.connectedUsers.find(u => u.socketId === socketId);
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const messageObj = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      senderSocketId: socketId,
      senderName: user ? user.displayName : 'User',
      isHost: user ? !!user.isHost : false,
      message: text,
      timestamp: `${hours}:${minutes}`,
    };

    room.chatMessages.push(messageObj);

    // Limit chat history in RAM to 200 messages
    if (room.chatMessages.length > 200) {
      room.chatMessages.shift();
    }

    return { success: true, roomCode: formattedCode, messageObj };
  }

  /**
   * Get chat history for a room
   */
  getChatHistory(roomCode) {
    const formattedCode = (roomCode || '').toUpperCase().trim();
    const room = this.rooms.get(formattedCode);
    return room && Array.isArray(room.chatMessages) ? room.chatMessages : [];
  }

  /**
   * Helper to derive readable video title from URL and providerType
   */
  _deriveTitle(url, providerType) {
    if (!url) return 'Unknown Title';
    try {
      if (providerType === 'youtube' || url.includes('youtube') || url.includes('youtu.be')) {
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/);
        return match ? `YouTube Video (${match[1]})` : 'YouTube Video';
      }
      if (providerType === 'googledrive' || url.includes('drive.google.com')) {
        const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        return match ? `Google Drive Video (${match[1].substring(0, 8)}...)` : 'Google Drive Video';
      }
      // HTML5 file URL
      const parsed = new URL(url, 'http://localhost');
      const filename = parsed.pathname.split('/').pop();
      if (filename && filename.length > 0 && filename.includes('.')) {
        return decodeURIComponent(filename);
      }
      return 'HTML5 Video';
    } catch (e) {
      return 'Unknown Title';
    }
  }

  /**
   * Add video item to room queue (Host only)
   */
  addToQueue(roomCode, socketId, { url, providerType, title }) {
    const formattedCode = (roomCode || '').toUpperCase().trim();
    const room = this.rooms.get(formattedCode);

    if (!room) return { success: false, message: 'Room not found.' };
    if (socketId !== room.hostSocketId) {
      return { success: false, message: 'Unauthorized: Only the host may manage the queue.' };
    }
    if (!url || !url.trim()) {
      return { success: false, message: 'Video URL is required.' };
    }

    if (!Array.isArray(room.queue)) room.queue = [];

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const user = room.connectedUsers.find(u => u.socketId === socketId);

    const item = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      providerType: providerType || 'html5',
      originalUrl: url.trim(),
      displayTitle: (title || '').trim() || this._deriveTitle(url, providerType),
      addedBy: user ? user.displayName : 'Host',
      addedAt: `${hours}:${minutes}`,
    };

    room.queue.push(item);
    return { success: true, room, item };
  }

  /**
   * Remove item from queue (Host only)
   */
  removeFromQueue(roomCode, socketId, itemId) {
    const formattedCode = (roomCode || '').toUpperCase().trim();
    const room = this.rooms.get(formattedCode);

    if (!room) return { success: false, message: 'Room not found.' };
    if (socketId !== room.hostSocketId) {
      return { success: false, message: 'Unauthorized: Only the host may manage the queue.' };
    }

    if (Array.isArray(room.queue)) {
      room.queue = room.queue.filter(item => item.id !== itemId);
    }

    return { success: true, room };
  }

  /**
   * Reorder queue item up or down (Host only)
   */
  reorderQueue(roomCode, socketId, itemId, direction) {
    const formattedCode = (roomCode || '').toUpperCase().trim();
    const room = this.rooms.get(formattedCode);

    if (!room) return { success: false, message: 'Room not found.' };
    if (socketId !== room.hostSocketId) {
      return { success: false, message: 'Unauthorized: Only the host may manage the queue.' };
    }
    if (!Array.isArray(room.queue)) return { success: false, message: 'Queue is empty.' };

    const index = room.queue.findIndex(item => item.id === itemId);
    if (index === -1) return { success: false, message: 'Item not found in queue.' };

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= room.queue.length) {
      return { success: false, message: 'Cannot move item further.' };
    }

    // Swap items
    const temp = room.queue[index];
    room.queue[index] = room.queue[targetIndex];
    room.queue[targetIndex] = temp;

    return { success: true, room };
  }

  /**
   * Clear entire queue (Host only)
   */
  clearQueue(roomCode, socketId) {
    const formattedCode = (roomCode || '').toUpperCase().trim();
    const room = this.rooms.get(formattedCode);

    if (!room) return { success: false, message: 'Room not found.' };
    if (socketId !== room.hostSocketId) {
      return { success: false, message: 'Unauthorized: Only the host may manage the queue.' };
    }

    room.queue = [];
    return { success: true, room };
  }

  /**
   * Skip to next item in queue (Host only)
   */
  skipNextQueue(roomCode, socketId) {
    const formattedCode = (roomCode || '').toUpperCase().trim();
    const room = this.rooms.get(formattedCode);

    if (!room) return { success: false, message: 'Room not found.' };
    if (socketId !== room.hostSocketId) {
      return { success: false, message: 'Unauthorized: Only the host may skip queue items.' };
    }
    if (!Array.isArray(room.queue) || room.queue.length === 0) {
      return { success: false, message: 'Queue is empty.' };
    }

    const nextItem = room.queue.shift();
    room.nowPlaying = nextItem;

    // Update video URL and provider
    this.updateVideoUrl(formattedCode, nextItem.originalUrl, nextItem.providerType);

    return { success: true, room, nextItem };
  }

  /**
   * Auto next video when current video ends
   */
  autoNextQueue(roomCode) {
    const formattedCode = (roomCode || '').toUpperCase().trim();
    const room = this.rooms.get(formattedCode);

    if (!room) return { success: false, message: 'Room not found.' };
    if (!Array.isArray(room.queue) || room.queue.length === 0) {
      room.nowPlaying = null;
      return { success: false, message: 'Queue is empty.' };
    }

    const nextItem = room.queue.shift();
    room.nowPlaying = nextItem;

    // Update video URL and provider
    this.updateVideoUrl(formattedCode, nextItem.originalUrl, nextItem.providerType);

    return { success: true, room, nextItem };
  }

  /**
   * Kick a user from a room (Host only)
   */
  kickUser(roomCode, hostSocketId, targetSocketId) {
    const formattedCode = (roomCode || '').toUpperCase().trim();
    const room = this.rooms.get(formattedCode);

    if (!room) return { success: false, message: 'Room not found.' };
    if (hostSocketId !== room.hostSocketId) {
      return { success: false, message: 'Unauthorized: Only the host may remove members.' };
    }
    if (targetSocketId === room.hostSocketId) {
      return { success: false, message: 'Host cannot kick themselves.' };
    }

    const targetUser = room.connectedUsers.find(u => u.socketId === targetSocketId);
    if (!targetUser) return { success: false, message: 'User not found in room.' };

    room.connectedUsers = room.connectedUsers.filter(u => u.socketId !== targetSocketId);
    this.userRooms.delete(targetSocketId);

    return { success: true, room, targetUser };
  }

  /**
   * Toggle playback control for a specific member (Host only)
   */
  toggleUserControl(roomCode, hostSocketId, targetSocketId) {
    const formattedCode = (roomCode || '').toUpperCase().trim();
    const room = this.rooms.get(formattedCode);

    if (!room) return { success: false, message: 'Room not found.' };
    if (hostSocketId !== room.hostSocketId) {
      return { success: false, message: 'Unauthorized: Only the host may manage control permissions.' };
    }
    if (targetSocketId === room.hostSocketId) {
      return { success: false, message: 'Host already has full control.' };
    }

    const targetUser = room.connectedUsers.find(u => u.socketId === targetSocketId);
    if (!targetUser) return { success: false, message: 'User not found in room.' };

    targetUser.canControlPlayback = !targetUser.canControlPlayback;

    return { success: true, room, targetUser };
  }

  /**
   * Get room info by room code
   */
  getRoom(roomCode) {
    if (!roomCode) return null;
    return this.rooms.get(roomCode.toUpperCase().trim()) || null;
  }

  /**
   * Get room code for a socket ID
   */
  getUserRoom(socketId) {
    return this.userRooms.get(socketId) || null;
  }
}

// Export singleton instance
module.exports = new RoomManager();
