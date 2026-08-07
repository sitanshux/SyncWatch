import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { socket } from '../socket/socket';
import UserList from '../components/UserList';
import VideoPlayer from '../components/VideoPlayer';
import Chat from '../components/Chat';
import Queue from '../components/Queue';
import SyncWatchLogo from '../components/SyncWatchLogo';

/**
 * Room Page Component
 * High-contrast dark graphite workspace with visual focus on video player.
 */
export default function Room() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const formattedCode = (roomCode || '').toUpperCase();

  const [room, setRoom] = useState(location.state?.room || null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(!location.state?.room);

  useEffect(() => {
    let isMounted = true;

    if (formattedCode) {
      localStorage.setItem('syncwatch_active_room', formattedCode);
    }

    const syncRoomState = () => {
      const storedDisplayName =
        localStorage.getItem(`room_user_${formattedCode}`) ||
        sessionStorage.getItem(`room_user_${formattedCode}`) ||
        localStorage.getItem('last_displayName') ||
        sessionStorage.getItem('last_displayName') ||
        'User';
      const storedPassword =
        localStorage.getItem(`room_pass_${formattedCode}`) ||
        sessionStorage.getItem(`room_pass_${formattedCode}`) || '';
      let storedUserToken =
        localStorage.getItem(`room_token_${formattedCode}`) ||
        sessionStorage.getItem(`room_token_${formattedCode}`);

      if (!storedUserToken) {
        storedUserToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem(`room_token_${formattedCode}`, storedUserToken);
        sessionStorage.setItem(`room_token_${formattedCode}`, storedUserToken);
      }

      socket.emit(
        'join-room',
        {
          roomCode: formattedCode,
          displayName: storedDisplayName,
          password: storedPassword,
          userToken: storedUserToken,
        },
        (response) => {
          if (!isMounted) return;
          setIsLoading(false);

          if (response && response.success) {
            setRoom(response.room);
          } else {
            setError(response?.message || 'Room not found or no longer active.');
          }
        }
      );
    };

    if (!room) {
      syncRoomState();
    }

    const handleConnect = () => {
      syncRoomState();
    };

    const handleRoomUpdated = (updatedRoom) => {
      if (isMounted && updatedRoom && updatedRoom.roomCode === formattedCode) {
        setRoom(updatedRoom);
      }
    };

    const handleUserJoined = (data) => {
      if (isMounted && data?.room && data.room.roomCode === formattedCode) {
        setRoom(data.room);
      }
    };

    const handleUserLeft = (data) => {
      if (isMounted && data?.room && data.room.roomCode === formattedCode) {
        setRoom(data.room);
      }
    };

    const handleVideoLoaded = (data) => {
      if (isMounted && data?.room && data.room.roomCode === formattedCode) {
        setRoom(data.room);
      }
    };

    const handleKicked = (data) => {
      alert(data?.message || 'You have been removed from the room by the host.');
      navigate('/');
    };

    socket.on('connect', handleConnect);
    socket.on('room-updated', handleRoomUpdated);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('video-loaded', handleVideoLoaded);
    socket.on('kicked-from-room', handleKicked);

    return () => {
      isMounted = false;
      socket.off('connect', handleConnect);
      socket.off('room-updated', handleRoomUpdated);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('video-loaded', handleVideoLoaded);
      socket.off('kicked-from-room', handleKicked);
    };
  }, [formattedCode, navigate]);

  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(formattedCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/join/${formattedCode}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    }
  };

  const handleLeaveRoom = () => {
    localStorage.removeItem('syncwatch_active_room');
    socket.emit('leave-room', { roomCode: formattedCode }, () => {
      navigate('/');
    });
    navigate('/');
  };

  const handleLoadVideo = (newUrl, providerType) => {
    socket.emit('load-video', { roomCode: formattedCode, videoUrl: newUrl, providerType });
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#08080A] text-[#F3F3F5] flex items-center justify-center p-6 font-sans">
        <div className="font-mono text-xs text-[#A1A1A6] animate-pulse flex items-center gap-3">
          <SyncWatchLogo iconSize={22} showText={false} />
          <span>CONNECTING TO THEATER ROOM [{formattedCode}]...</span>
        </div>
      </main>
    );
  }

  if (error || !room) {
    return (
      <main className="min-h-screen bg-[#08080A] text-[#F3F3F5] flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md matte-panel-dark border border-white/[0.1] p-10 text-center space-y-6">
          <div className="font-mono text-xs text-[#C5A059] tracking-widest uppercase">
            // CONNECTION ERROR
          </div>
          <h2 className="font-grotesk text-2xl font-bold text-white uppercase">
            Unable to Join Room
          </h2>
          <p className="font-mono text-xs text-[#A1A1A6]">{error || 'This room does not exist or has ended.'}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3.5 bg-[#F3F3F5] text-black font-grotesk font-bold text-xs uppercase tracking-widest hover:bg-white transition-colors"
          >
            RETURN TO LANDING
          </button>
        </div>
      </main>
    );
  }

  const isHost = room.hostSocketId === socket.id;
  const currentUserObj = (room.connectedUsers || []).find(u => u.socketId === socket.id);
  const canControl = isHost || room.playbackMode === 'Everyone' || Boolean(currentUserObj?.canControlPlayback);

  return (
    <main className="min-h-screen bg-[#08080A] text-[#F3F3F5] flex flex-col justify-between p-4 sm:p-6 font-sans selection:bg-[#C5A059]/30">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Top Section Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 matte-panel-dark border border-white/[0.1]">
          <div className="flex items-center gap-4">
            <SyncWatchLogo iconSize={26} showText={false} />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-grotesk text-lg sm:text-xl font-bold text-white tracking-tight uppercase">
                  {room.roomName}
                </h1>
                <span className="font-mono text-[10px] px-2.5 py-0.5 border border-[#C5A059]/40 bg-[#C5A059]/10 text-[#C5A059] uppercase tracking-wider">
                  MODE: {room.playbackMode}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 font-mono text-xs text-[#A1A1A6]">
                <span>KEY:</span>
                <strong className="text-white tracking-widest">{room.roomCode}</strong>
                {isHost && <span className="ml-2 text-[#C5A059]">[ HOST VIEW ]</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap font-grotesk text-xs">
            <button
              onClick={handleCopyInviteLink}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-[#F3F3F5] text-black font-bold uppercase tracking-wider hover:bg-white transition-colors border border-white"
              title="Copy direct join link to share"
            >
              {copiedInvite ? '✓ LINK COPIED' : '🔗 INVITE FRIENDS'}
            </button>

            <button
              onClick={handleCopyCode}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white/[0.05] border border-white/[0.12] hover:border-white text-white font-semibold uppercase tracking-wider transition-colors"
            >
              {copiedCode ? '✓ COPIED' : 'COPY CODE'}
            </button>

            <button
              onClick={handleLeaveRoom}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-rose-950/40 border border-rose-900/60 hover:bg-rose-900/60 text-rose-300 font-semibold uppercase tracking-wider transition-colors"
            >
              LEAVE
            </button>
          </div>
        </header>

        {/* Main Content Layout: Video Player + Queue + Users on Left, Chat on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column - Video Player (Visual Focus), Queue & User Management */}
          <div className="lg:col-span-2 space-y-6 w-full">
            <section className="w-full">
              <VideoPlayer
                videoUrl={room.videoUrl}
                roomCode={formattedCode}
                isHost={isHost}
                canControl={canControl}
                playbackMode={room.playbackMode}
                socket={socket}
                onLoadVideo={handleLoadVideo}
              />
            </section>

            <section className="w-full">
              <Queue
                roomCode={formattedCode}
                socket={socket}
                isHost={isHost}
                currentVideoUrl={room.videoUrl}
                providerType={room.providerType}
              />
            </section>

            <section className="w-full">
              <UserList
                users={room.connectedUsers || []}
                currentSocketId={socket.id}
                isHost={isHost}
                roomCode={formattedCode}
                socket={socket}
              />
            </section>
          </div>

          {/* Right Column - Real-time High Contrast Room Chat */}
          <div className="lg:col-span-1 w-full lg:sticky lg:top-6">
            <Chat
              roomCode={formattedCode}
              socket={socket}
              currentSocketId={socket.id}
            />
          </div>
        </div>
      </div>

      {/* Minimal Footer */}
      <footer className="w-full max-w-7xl mx-auto text-center pt-8 font-mono text-[11px] text-[#6E6E73] tracking-widest uppercase">
        SYNCWATCH ROOM SESSION  KEY: {room.roomCode}
      </footer>
    </main>
  );
}
