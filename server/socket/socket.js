const registerRoomHandlers = require('./roomHandlers');

/**
 * Socket.io main connection handler
 */
module.exports = (io) => {
  io.on('connection', (socket) => {
    // Log when a client connects
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Attach modular room handlers
    registerRoomHandlers(io, socket);

    // Log when a client disconnects
    socket.on('disconnect', (reason) => {
      console.log(`[Socket.io] Client disconnected: ${socket.id} | Reason: ${reason}`);
    });
  });
};
