import { useState, useEffect } from 'react';
import { socket } from '../socket/socket';

/**
 * Custom hook to manage Socket.io connection state and status messages.
 * Tracks connect, disconnect, and connection errors.
 */
export function useSocket() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [socketId, setSocketId] = useState(socket.id || '');
  const [status, setStatus] = useState(socket.connected ? 'Connected' : 'Connecting...');

  useEffect(() => {
    // If already connected on mount, update immediately
    if (socket.connected) {
      setIsConnected(true);
      setSocketId(socket.id);
      setStatus('Connected');
    }

    const handleConnect = () => {
      setIsConnected(true);
      setSocketId(socket.id);
      setStatus('Connected');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setSocketId('');
      setStatus('Disconnected');
    };

    const handleConnectError = () => {
      setIsConnected(false);
      setSocketId('');
      setStatus('Disconnected');
    };

    // Attach listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    // Clean up listeners on unmount
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
    };
  }, []);

  return { isConnected, socketId, status };
}
