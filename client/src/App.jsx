import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import SetupForm from './components/SetupForm';
import ChatRoom from './components/ChatRoom';

// Initialize socket outside component to prevent multiple connections
// In production, it connects to the same origin. In dev, we might need to specify URL if different.
// For this setup, we'll assume proxy or same origin.
// If running dev separately, we need URL.
const SOCKET_URL = import.meta.env.MODE === 'production' ? '/' : 'http://localhost:3000';
const socket = io(SOCKET_URL);

function App() {
  const [view, setView] = useState('setup'); // setup, waiting, chat
  const [partner, setPartner] = useState(null);
  const [roomId, setRoomId] = useState(null);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server:', socket.id);
    });

    socket.on('room_created', (data) => {
      setRoomId(data.roomId);
      setPartner(data.partner);
      setView('chat');
    });

    socket.on('partner_disconnected', () => {
      alert('Partner disconnected!');
      setPartner(null);
      setRoomId(null);
      // Automatically go back to waiting or setup?
      // Requirement says "skip_partner" finds new. "stop_chat" returns home.
      // If partner disconnects, maybe ask user what to do?
      // For MVP, let's go back to setup or waiting.
      // Let's go to setup for simplicity, or waiting if we want to auto-match.
      // Let's go to setup.
      setView('setup');
    });

    return () => {
      socket.off('connect');
      socket.off('room_created');
      socket.off('partner_disconnected');
    };
  }, []);

  const handleJoin = (userData) => {
    socket.emit('join', userData);
    setView('waiting');
  };

  const handleSkip = () => {
    if (roomId) {
      socket.emit('skip_partner', { roomId });
      setPartner(null);
      setRoomId(null);
      setView('waiting');
      // We need to re-join the queue. The server 'skip_partner' just leaves room.
      // We need to emit 'join' again with same data?
      // We didn't save userData. We should save it.
      // Actually, server doesn't store user data after disconnect/leave room unless we re-send it.
      // So we need to store userData in state.
    }
  };

  const handleStop = () => {
    if (roomId) {
      socket.emit('stop_chat', { roomId });
    }
    setPartner(null);
    setRoomId(null);
    setView('setup');
  };

  // We need to store user data to re-join on skip
  const [userData, setUserData] = useState(null);

  const onJoinWrapper = (data) => {
    setUserData(data);
    handleJoin(data);
  };

  const onSkipWrapper = () => {
    handleSkip();
    // Re-join logic
    if (userData) {
      socket.emit('join', userData);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {view === 'setup' && <SetupForm onJoin={onJoinWrapper} />}

      {view === 'waiting' && (
        <div className="flex flex-col items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mb-4"></div>
          <h2 className="text-2xl font-bold animate-pulse">Searching for a partner...</h2>
          <button
            onClick={() => setView('setup')}
            className="mt-8 px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded"
          >
            Cancel
          </button>
        </div>
      )}

      {view === 'chat' && partner && (
        <ChatRoom
          socket={socket}
          roomId={roomId}
          partner={partner}
          onSkip={onSkipWrapper}
          onStop={handleStop}
        />
      )}
    </div>
  );
}

export default App;
