import React from 'react';

/**
 * StatusCard Component
 * Displays a clean, minimal container indicating the Socket.io server connection state.
 */
export default function StatusCard({ status, isConnected, socketId }) {
  // Determine dot color based on connection status
  const getStatusColorClass = () => {
    switch (status) {
      case 'Connected':
        return 'bg-emerald-500';
      case 'Connecting...':
        return 'bg-amber-500';
      case 'Disconnected':
      default:
        return 'bg-rose-500';
    }
  };

  return (
    <div className="w-full max-w-md bg-secondary border border-border rounded-lg p-6 font-sans">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold tracking-wider text-mutedGray uppercase">
          System Status
        </h2>
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${getStatusColorClass()}`} />
          <span className="text-sm font-medium text-lightGray">{status}</span>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <span className="text-xs text-mutedGray block mb-1">Socket Connection ID</span>
        {isConnected ? (
          <code className="text-sm font-mono text-white block bg-background px-3 py-2 rounded border border-border select-all break-all">
            {socketId}
          </code>
        ) : (
          <span className="text-sm italic text-mutedGray block py-2">
            Not active (awaiting connection...)
          </span>
        )}
      </div>
    </div>
  );
}
