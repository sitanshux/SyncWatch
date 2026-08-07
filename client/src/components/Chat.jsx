import React, { useState, useEffect, useRef } from 'react';

/**
 * Chat Component
 * Real-time room chat with dark luxury graphite theme and ultra-high contrast.
 */
export default function Chat({ roomCode, socket, currentSocketId }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [typingUsers, setTypingUsers] = useState({});

  const chatContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!socket || !roomCode) return;

    const handleChatHistory = (history) => {
      setMessages(history || []);
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 50);
    };

    const handleChatMessage = (newMsg) => {
      setMessages((prev) => {
        const next = [...prev, newMsg];
        if (next.length > 200) next.shift();
        return next;
      });
    };

    const handleTypingStart = (data) => {
      if (!data || !data.socketId) return;
      setTypingUsers((prev) => ({
        ...prev,
        [data.socketId]: { displayName: data.displayName, isHost: data.isHost },
      }));
    };

    const handleTypingStop = (data) => {
      if (!data || !data.socketId) return;
      setTypingUsers((prev) => {
        const copy = { ...prev };
        delete copy[data.socketId];
        return copy;
      });
    };

    socket.on('chat-history', handleChatHistory);
    socket.on('chat-message', handleChatMessage);
    socket.on('typing-start', handleTypingStart);
    socket.on('typing-stop', handleTypingStop);

    socket.emit('get-chat-history', roomCode);

    return () => {
      socket.off('chat-history', handleChatHistory);
      socket.off('chat-message', handleChatMessage);
      socket.off('typing-start', handleTypingStart);
      socket.off('typing-stop', handleTypingStop);
    };
  }, [socket, roomCode]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 80;

    if (isNearBottom) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const stopTyping = () => {
    if (isTypingRef.current && socket && roomCode) {
      socket.emit('typing-stop', { roomCode });
      isTypingRef.current = false;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputText(value);

    if (!socket || !roomCode) return;

    if (value.trim().length > 0) {
      if (!isTypingRef.current) {
        socket.emit('typing-start', { roomCode });
        isTypingRef.current = true;
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 2000);
    } else {
      stopTyping();
    }
  };

  const handleSendMessage = () => {
    const trimmed = inputText.trim();
    if (!trimmed || !socket || !roomCode) return;

    socket.emit('send-chat-message', {
      roomCode,
      message: trimmed,
    });

    setInputText('');
    stopTyping();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const typingList = Object.values(typingUsers);
  let typingText = '';
  if (typingList.length === 1) {
    typingText = `${typingList[0].displayName} is typing...`;
  } else if (typingList.length === 2) {
    typingText = `${typingList[0].displayName} and ${typingList[1].displayName} are typing...`;
  } else if (typingList.length > 2) {
    typingText = `Several people are typing...`;
  }

  return (
    <div className="w-full matte-panel-dark border border-white/[0.1] flex flex-col h-[520px] font-sans selection:bg-[#C5A059]/30">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-[#0E0E12]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <h3 className="font-grotesk text-xs font-bold tracking-[0.2em] text-white uppercase">
            Live Room Chat
          </h3>
        </div>
        <span className="font-mono text-[10px] text-[#A1A1A6] uppercase tracking-wider">
          {messages.length} MSG
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={chatContainerRef}
        className="flex-1 p-4 overflow-y-auto space-y-3.5 custom-scrollbar bg-[#08080A]/60"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 font-mono text-[#6E6E73]">
            <span className="text-xs uppercase tracking-widest"> CHAT STREAM READY</span>
            <p className="text-[11px] text-[#A1A1A6] mt-2">No messages in room transcript.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.senderSocketId === currentSocketId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
              >
                {/* Sender Header */}
                <div className="flex items-center gap-2 mb-1 px-1 font-mono text-[11px]">
                  <span className={`font-semibold ${isSelf ? 'text-[#C5A059]' : 'text-white'}`}>
                    {msg.senderName}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 uppercase tracking-wider ${
                      msg.isHost
                        ? 'border border-[#C5A059]/40 bg-[#C5A059]/10 text-[#C5A059]'
                        : 'border border-white/[0.1] bg-white/[0.04] text-[#A1A1A6]'
                    }`}
                  >
                    {msg.isHost ? 'HOST' : 'MEMBER'}
                  </span>
                  <span className="text-[9px] text-[#6E6E73]">{msg.timestamp}</span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[88%] px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap break-words border ${
                    isSelf
                      ? 'bg-[#18181E] border-[#C5A059]/30 text-[#F3F3F5]'
                      : 'bg-[#0E0E12] border-white/[0.08] text-[#F3F3F5]'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Typing Indicator */}
      <div className="h-6 px-4 font-mono text-[10px] text-[#C5A059] italic flex items-center bg-[#08080A]">
        {typingText && (
          <div className="flex items-center gap-1.5 animate-pulse">
            <span>{typingText}</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-white/[0.08] bg-[#0E0E12]">
        <div className="flex items-end gap-2">
          <textarea
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Shift+Enter for newline)"
            rows={1}
            className="flex-1 bg-[#08080A] border border-white/[0.12] focus:border-[#C5A059] text-white font-sans text-xs p-2.5 outline-none resize-none max-h-24 min-h-[38px] transition-colors placeholder:text-[#444]"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="px-4 py-2.5 bg-[#F3F3F5] hover:bg-white text-black font-grotesk font-bold text-xs uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed transition-colors h-[38px] border border-white"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
