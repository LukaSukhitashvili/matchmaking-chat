import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import SetupForm from './components/SetupForm';
import ChatRoom from './components/ChatRoom';
import DisconnectModal from './components/DisconnectModal';

// Initialize socket outside component
const SOCKET_URL = import.meta.env.MODE === 'production' ? '/' : 'http://localhost:3000';
const socket = io(SOCKET_URL);

function App() {
  const [view, setView] = useState('setup'); // setup, waiting, chat
  const [partner, setPartner] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [disconnectMessage, setDisconnectMessage] = useState('');

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server:', socket.id);
    });

    socket.on('room_created', (data) => {
      setRoomId(data.roomId);
      setPartner(data.partner);
      setView('chat');
      setIsDisconnectModalOpen(false);
    });

    socket.on('partner_disconnected', () => {
      setDisconnectMessage('Your partner has disconnected.');
      setIsDisconnectModalOpen(true);
      setPartner(null);
      setRoomId(null);
      // Stay in 'chat' view but show modal, or switch to waiting?
      // Requirement: "Modal overlaid on screen". So we can stay in current view or switch to a neutral state.
      // If we switch to 'setup', the modal might look weird over the form.
      // Let's keep the view as is (or switch to waiting background) and show modal.
      // Actually, if we are in chat, we should probably clear the chat UI or keep it visible behind modal?
      // Let's keep it visible behind modal for context.
    });

    return () => {
      socket.off('connect');
      socket.off('room_created');
      socket.off('partner_disconnected');
    };
  }, []);

  const handleJoin = (data) => {
    setUserData(data);
    socket.emit('join', data);
    setView('waiting');
  };

  const handleSkip = () => {
    if (roomId) {
      socket.emit('skip_partner', { roomId });
      setPartner(null);
      setRoomId(null);
      setView('waiting');
      // Re-join automatically or wait for user?
      // Requirement: "Skip (find next)". So auto re-join.
      if (userData) {
        socket.emit('join', userData);
      }
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

  const handleReconnect = () => {
    setIsDisconnectModalOpen(false);
    setView('waiting');
    if (userData) {
      socket.emit('join', userData);
    } else {
      setView('setup');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans overflow-hidden">
      {view === 'setup' && <SetupForm onJoin={handleJoin} />}

      {view === 'waiting' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mb-6"></div>
          <h2 className="text-2xl font-bold animate-pulse text-center">Searching for a partner...</h2>
          <p className="text-gray-400 mt-2 text-center">This might take a moment.</p>
          <button
            onClick={() => setView('setup')}
            className="mt-8 px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
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
          onSkip={handleSkip}
          onStop={handleStop}
        />
      )}

      <DisconnectModal
        isOpen={isDisconnectModalOpen}
        message={disconnectMessage}
        onReconnect={handleReconnect}
        onHome={handleStop}
      />
    </div>
  );
}

export default App;
