const roomManager = require('./roomManager');

/**
 * Socket handlers for room & video management
 */
module.exports = (io, socket) => {

  /**
   * Event: create-room
   */
  socket.on('create-room', (payload, callback) => {
    try {
      const { roomCode, roomName, displayName, password, playbackControl, userToken } = payload || {};

      if (!roomCode) {
        const errorResp = { success: false, message: 'Room code is required.' };
        if (typeof callback === 'function') callback(errorResp);
        return socket.emit('create-room-response', errorResp);
      }

      const previousRoom = roomManager.leaveRoom(socket.id);
      if (previousRoom) {
        socket.leave(previousRoom.roomCode);
        if (!previousRoom.roomDeleted) {
          io.to(previousRoom.roomCode).emit('user-left', { user: previousRoom.leavingUser, room: previousRoom.room });
          io.to(previousRoom.roomCode).emit('room-updated', previousRoom.room);
        }
      }

      const result = roomManager.createRoom({
        roomCode,
        roomName,
        hostSocketId: socket.id,
        hostDisplayName: displayName,
        password,
        playbackMode: playbackControl,
        userToken,
      });

      if (!result.success) {
        if (typeof callback === 'function') callback(result);
        return socket.emit('create-room-response', result);
      }

      const room = result.room;
      socket.join(room.roomCode);
      console.log(`[Socket] Client ${socket.id} created room ${room.roomCode} ("${room.roomName}")`);

      const successResp = { success: true, room };

      if (typeof callback === 'function') callback(successResp);
      socket.emit('create-room-response', successResp);
      socket.emit('chat-history', []);
      io.to(room.roomCode).emit('room-updated', room);
    } catch (err) {
      console.error('[Socket Error] create-room:', err);
      const errResp = { success: false, message: 'Server error creating room.' };
      if (typeof callback === 'function') callback(errResp);
      socket.emit('create-room-response', errResp);
    }
  });

  /**
   * Event: join-room
   */
  socket.on('join-room', (payload, callback) => {
    try {
      const { roomCode, displayName, password, userToken } = payload || {};

      if (!roomCode) {
        const errorResp = { success: false, message: 'Room code is required.' };
        if (typeof callback === 'function') callback(errorResp);
        return socket.emit('join-room-response', errorResp);
      }

      const previousRoom = roomManager.leaveRoom(socket.id);
      if (previousRoom) {
        socket.leave(previousRoom.roomCode);
        if (!previousRoom.roomDeleted) {
          io.to(previousRoom.roomCode).emit('user-left', { user: previousRoom.leavingUser, room: previousRoom.room });
          io.to(previousRoom.roomCode).emit('room-updated', previousRoom.room);
        }
      }

      const result = roomManager.joinRoom({
        roomCode,
        socketId: socket.id,
        displayName,
        password,
        userToken,
      });

      if (!result.success) {
        if (typeof callback === 'function') callback(result);
        return socket.emit('join-room-response', result);
      }

      const { room, user } = result;
      socket.join(room.roomCode);
      console.log(`[Socket] Client ${socket.id} (${user.displayName}) joined room ${room.roomCode}`);

      const syncState = roomManager.getSyncState(room.roomCode);
      const successResp = { success: true, room, user, syncState };

      if (typeof callback === 'function') callback(successResp);
      socket.emit('join-room-response', successResp);

      socket.emit('sync-state', syncState);
      socket.emit('chat-history', roomManager.getChatHistory(room.roomCode));

      io.to(room.roomCode).emit('user-joined', { user, room });
      io.to(room.roomCode).emit('room-updated', room);
    } catch (err) {
      console.error('[Socket Error] join-room:', err);
      const errResp = { success: false, message: 'Server error joining room.' };
      if (typeof callback === 'function') callback(errResp);
      socket.emit('join-room-response', errResp);
    }
  });

  /**
   * Event: load-video
   */
  socket.on('load-video', (payload, callback) => {
    try {
      const { roomCode, videoUrl, providerType } = payload || {};

      if (!roomCode || !videoUrl) {
        const errResp = { success: false, message: 'Room code and video URL are required.' };
        if (typeof callback === 'function') callback(errResp);
        return socket.emit('load-video-response', errResp);
      }

      const result = roomManager.updateVideoUrl(roomCode, videoUrl, providerType);

      if (!result.success) {
        if (typeof callback === 'function') callback(result);
        return socket.emit('load-video-response', result);
      }

      const room = result.room;
      console.log(`[Socket] Room ${room.roomCode} video URL updated: ${room.videoUrl} (provider: ${room.providerType})`);

      const successResp = { success: true, videoUrl: room.videoUrl, providerType: room.providerType, room };

      if (typeof callback === 'function') callback(successResp);
      socket.emit('load-video-response', successResp);

      io.to(room.roomCode).emit('video-loaded', { videoUrl: room.videoUrl, providerType: room.providerType, room });
      io.to(room.roomCode).emit('room-updated', room);
    } catch (err) {
      console.error('[Socket Error] load-video:', err);
      const errResp = { success: false, message: 'Server error updating video URL.' };
      if (typeof callback === 'function') callback(errResp);
      socket.emit('load-video-response', errResp);
    }
  });

  /**
   * Event: video-play
   */
  socket.on('video-play', (payload, callback) => {
    try {
      const { roomCode, currentTime } = payload || {};
      const result = roomManager.playVideo(roomCode, socket.id, currentTime);

      if (!result.success) {
        if (typeof callback === 'function') callback(result);
        return;
      }

      const room = result.room;
      const syncData = {
        roomCode: room.roomCode,
        currentTime: room.currentTime,
        isPlaying: true,
        lastUpdateTimestamp: room.lastUpdateTimestamp,
        issuer: socket.id,
      };

      if (typeof callback === 'function') callback({ success: true, syncData });

      io.to(room.roomCode).emit('video-play', syncData);
    } catch (err) {
      console.error('[Socket Error] video-play:', err);
    }
  });

  /**
   * Event: video-pause
   */
  socket.on('video-pause', (payload, callback) => {
    try {
      const { roomCode, currentTime } = payload || {};
      const result = roomManager.pauseVideo(roomCode, socket.id, currentTime);

      if (!result.success) {
        if (typeof callback === 'function') callback(result);
        return;
      }

      const room = result.room;
      const syncData = {
        roomCode: room.roomCode,
        currentTime: room.currentTime,
        isPlaying: false,
        lastUpdateTimestamp: room.lastUpdateTimestamp,
        issuer: socket.id,
      };

      if (typeof callback === 'function') callback({ success: true, syncData });

      io.to(room.roomCode).emit('video-pause', syncData);
    } catch (err) {
      console.error('[Socket Error] video-pause:', err);
    }
  });

  /**
   * Event: video-seek
   */
  socket.on('video-seek', (payload, callback) => {
    try {
      const { roomCode, currentTime } = payload || {};
      const result = roomManager.seekVideo(roomCode, socket.id, currentTime);

      if (!result.success) {
        if (typeof callback === 'function') callback(result);
        return;
      }

      const room = result.room;
      const syncData = {
        roomCode: room.roomCode,
        currentTime: room.currentTime,
        isPlaying: room.isPlaying,
        lastUpdateTimestamp: room.lastUpdateTimestamp,
        issuer: socket.id,
      };

      if (typeof callback === 'function') callback({ success: true, syncData });

      io.to(room.roomCode).emit('video-seek', syncData);
    } catch (err) {
      console.error('[Socket Error] video-seek:', err);
    }
  });

  /**
   * Event: request-sync
   */
  socket.on('request-sync', (payload, callback) => {
    try {
      const { roomCode } = payload || {};
      const syncState = roomManager.getSyncState(roomCode);

      if (typeof callback === 'function') callback({ success: true, syncState });
      if (syncState) {
        socket.emit('sync-state', syncState);
      }
    } catch (err) {
      console.error('[Socket Error] request-sync:', err);
    }
  });

  /**
   * Event: leave-room
   */
  socket.on('leave-room', (payload, callback) => {
    try {
      const result = roomManager.leaveRoom(socket.id);

      if (result) {
        socket.leave(result.roomCode);
        console.log(`[Socket] Client ${socket.id} left room ${result.roomCode}`);

        if (!result.roomDeleted) {
          io.to(result.roomCode).emit('user-left', { user: result.leavingUser, room: result.room });
          io.to(result.roomCode).emit('room-updated', result.room);
        }
      }

      const successResp = { success: true };
      if (typeof callback === 'function') callback(successResp);
      socket.emit('leave-room-response', successResp);
    } catch (err) {
      console.error('[Socket Error] leave-room:', err);
    }
  });

  /**
   * Event: send-chat-message
   */
  socket.on('send-chat-message', (payload, callback) => {
    try {
      const { roomCode, message } = payload || {};
      if (!roomCode || !message || !String(message).trim()) return;

      const result = roomManager.addChatMessage(roomCode, socket.id, message);
      if (!result.success) {
        if (typeof callback === 'function') callback(result);
        return;
      }

      if (typeof callback === 'function') callback({ success: true, messageObj: result.messageObj });
      io.to(result.roomCode).emit('chat-message', result.messageObj);
    } catch (err) {
      console.error('[Socket Error] send-chat-message:', err);
    }
  });

  /**
   * Event: get-chat-history
   */
  socket.on('get-chat-history', (roomCode, callback) => {
    try {
      const history = roomManager.getChatHistory(roomCode);
      if (typeof callback === 'function') callback({ success: true, history });
      socket.emit('chat-history', history);
    } catch (err) {
      console.error('[Socket Error] get-chat-history:', err);
    }
  });

  /**
   * Event: typing-start
   */
  socket.on('typing-start', (payload) => {
    try {
      const { roomCode } = payload || {};
      if (!roomCode) return;
      const formattedCode = String(roomCode).toUpperCase().trim();
      const room = roomManager.getRoom(formattedCode);
      if (!room) return;
      const user = room.connectedUsers.find(u => u.socketId === socket.id);
      if (user) {
        socket.to(formattedCode).emit('typing-start', {
          socketId: socket.id,
          displayName: user.displayName,
          isHost: user.isHost,
        });
      }
    } catch (err) {
      console.error('[Socket Error] typing-start:', err);
    }
  });

  /**
   * Queue Event: add-to-queue
   */
  socket.on('add-to-queue', (payload, callback) => {
    try {
      const { roomCode, url, providerType, title } = payload || {};
      const result = roomManager.addToQueue(roomCode, socket.id, { url, providerType, title });

      if (!result.success) {
        if (typeof callback === 'function') callback(result);
        return;
      }

      if (typeof callback === 'function') callback({ success: true, room: result.room, item: result.item });
      io.to(result.room.roomCode).emit('room-updated', result.room);
      io.to(result.room.roomCode).emit('queue-updated', { queue: result.room.queue, nowPlaying: result.room.nowPlaying });
    } catch (err) {
      console.error('[Socket Error] add-to-queue:', err);
    }
  });

  /**
   * Queue Event: remove-from-queue
   */
  socket.on('remove-from-queue', (payload, callback) => {
    try {
      const { roomCode, itemId } = payload || {};
      const result = roomManager.removeFromQueue(roomCode, socket.id, itemId);

      if (!result.success) {
        if (typeof callback === 'function') callback(result);
        return;
      }

      if (typeof callback === 'function') callback({ success: true, room: result.room });
      io.to(result.room.roomCode).emit('room-updated', result.room);
      io.to(result.room.roomCode).emit('queue-updated', { queue: result.room.queue, nowPlaying: result.room.nowPlaying });
    } catch (err) {
      console.error('[Socket Error] remove-from-queue:', err);
    }
  });

  /**
   * Queue Event: reorder-queue
   */
  socket.on('reorder-queue', (payload, callback) => {
    try {
      const { roomCode, itemId, direction } = payload || {};
      const result = roomManager.reorderQueue(roomCode, socket.id, itemId, direction);

      if (!result.success) {
        if (typeof callback === 'function') callback(result);
        return;
      }

      if (typeof callback === 'function') callback({ success: true, room: result.room });
      io.to(result.room.roomCode).emit('room-updated', result.room);
      io.to(result.room.roomCode).emit('queue-updated', { queue: result.room.queue, nowPlaying: result.room.nowPlaying });
    } catch (err) {
      console.error('[Socket Error] reorder-queue:', err);
    }
  });

  /**
   * Queue Event: clear-queue
   */
  socket.on('clear-queue', (payload, callback) => {
    try {
      const { roomCode } = payload || {};
      const result = roomManager.clearQueue(roomCode, socket.id);

      if (!result.success) {
        if (typeof callback === 'function') callback(result);
        return;
      }

      if (typeof callback === 'function') callback({ success: true, room: result.room });
      io.to(result.room.roomCode).emit('room-updated', result.room);
      io.to(result.room.roomCode).emit('queue-updated', { queue: result.room.queue, nowPlaying: result.room.nowPlaying });
    } catch (err) {
      console.error('[Socket Error] clear-queue:', err);
    }
  });

  /**
   * Queue Event: skip-next-queue
   */
  socket.on('skip-next-queue', (payload, callback) => {
    try {
      const { roomCode } = payload || {};
      const result = roomManager.skipNextQueue(roomCode, socket.id);

      if (!result.success) {
        if (typeof callback === 'function') callback(result);
        return;
      }

      const room = result.room;
      if (typeof callback === 'function') callback({ success: true, room, nextItem: result.nextItem });

      io.to(room.roomCode).emit('video-loaded', { videoUrl: room.videoUrl, providerType: room.providerType, room });
      io.to(room.roomCode).emit('room-updated', room);
      io.to(room.roomCode).emit('queue-updated', { queue: room.queue, nowPlaying: room.nowPlaying });
    } catch (err) {
      console.error('[Socket Error] skip-next-queue:', err);
    }
  });

  /**
   * Queue Event: auto-next-queue (triggered when current video finishes playing)
   */
  socket.on('auto-next-queue', (payload, callback) => {
    try {
      const { roomCode } = payload || {};
      const result = roomManager.autoNextQueue(roomCode);

      if (!result.success) {
        if (typeof callback === 'function') callback(result);
        return;
      }

      const room = result.room;
      if (typeof callback === 'function') callback({ success: true, room, nextItem: result.nextItem });

      io.to(room.roomCode).emit('video-loaded', { videoUrl: room.videoUrl, providerType: room.providerType, room });
      io.to(room.roomCode).emit('room-updated', room);
      io.to(room.roomCode).emit('queue-updated', { queue: room.queue, nowPlaying: room.nowPlaying });
    } catch (err) {
      console.error('[Socket Error] auto-next-queue:', err);
    }
  });

  /**
   * Event: kick-user (Host only)
   */
  socket.on('kick-user', (payload, callback) => {
    try {
      const { roomCode, targetSocketId } = payload || {};
      const result = roomManager.kickUser(roomCode, socket.id, targetSocketId);

      if (!result.success) {
        if (typeof callback === 'function') callback(result);
        return;
      }

      const { room, targetUser } = result;

      // Notify the target user socket that they were kicked
      const targetSocket = io.sockets.sockets.get(targetSocketId);
      if (targetSocket) {
        targetSocket.emit('kicked-from-room', { message: 'You have been removed from the room by the host.' });
        targetSocket.leave(room.roomCode);
      }

      if (typeof callback === 'function') callback({ success: true, room });

      io.to(room.roomCode).emit('user-left', { user: targetUser, room });
      io.to(room.roomCode).emit('room-updated', room);
    } catch (err) {
      console.error('[Socket Error] kick-user:', err);
    }
  });

  /**
   * Event: toggle-user-control (Host only)
   */
  socket.on('toggle-user-control', (payload, callback) => {
    try {
      const { roomCode, targetSocketId } = payload || {};
      const result = roomManager.toggleUserControl(roomCode, socket.id, targetSocketId);

      if (!result.success) {
        if (typeof callback === 'function') callback(result);
        return;
      }

      const { room, targetUser } = result;

      if (typeof callback === 'function') callback({ success: true, room, targetUser });

      io.to(room.roomCode).emit('room-updated', room);
    } catch (err) {
      console.error('[Socket Error] toggle-user-control:', err);
    }
  });

  /**
   * Event: get-room-data
   */
  socket.on('get-room-data', (roomCode, callback) => {
    const room = roomManager.getRoom(roomCode);
    if (typeof callback === 'function') {
      callback(room ? { success: true, room } : { success: false, message: 'Room not found' });
    }
  });

  /**
   * On socket disconnect
   */
  socket.on('disconnect', () => {
    const result = roomManager.leaveRoom(socket.id);
    if (result && !result.roomDeleted) {
      io.to(result.roomCode).emit('typing-stop', { socketId: socket.id });
      io.to(result.roomCode).emit('user-left', { user: result.leavingUser, room: result.room });
      io.to(result.roomCode).emit('room-updated', result.room);
    }
  });
};
