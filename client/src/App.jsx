import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import SetupForm from './components/SetupForm';
import ChatRoom from './components/ChatRoom';
import DisconnectModal from './components/DisconnectModal';
import VersionChecker from './components/VersionChecker';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import soundManager from './utils/sounds';

// Initialize socket outside component
const SOCKET_URL = import.meta.env.MODE === 'production' ? '/' : 'http://localhost:3000';
const socket = io(SOCKET_URL);

function AppContent() {
  const { isDark } = useTheme();
  const [view, setView] = useState('setup'); // setup, waiting, chat
  const [partner, setPartner] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [disconnectMessage, setDisconnectMessage] = useState('');
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server:', socket.id);
    });

    socket.on('online_count', (data) => {
      setOnlineCount(data.count);
    });

    socket.on('room_created', (data) => {
      setRoomId(data.roomId);
      setPartner(data.partner);
      setView('chat');
      setIsDisconnectModalOpen(false);
      // Play match sound
      soundManager.playMatch();
    });

    socket.on('partner_disconnected', () => {
      setDisconnectMessage('Your partner has disconnected.');
      setIsDisconnectModalOpen(true);
      setPartner(null);
      setRoomId(null);
    });

    socket.on('report_submitted', (data) => {
      console.log('Report submitted:', data.message);
    });

    socket.on('user_blocked', (data) => {
      console.log('User blocked:', data.blockedId);
    });

    return () => {
      socket.off('connect');
      socket.off('online_count');
      socket.off('room_created');
      socket.off('partner_disconnected');
      socket.off('report_submitted');
      socket.off('user_blocked');
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
    setIsDisconnectModalOpen(false);
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
    <div className={`min-h-screen font-sans overflow-hidden transition-colors duration-300 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}>
      <VersionChecker />
      {view === 'setup' && <SetupForm onJoin={handleJoin} onlineCount={onlineCount} />}

      {view === 'waiting' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mb-6"></div>
          <h2 className="text-2xl font-bold animate-pulse text-center">Searching for a partner...</h2>
          <p className={`mt-2 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>This might take a moment.</p>
          <p className={`mt-1 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{onlineCount} users online</p>
          <button
            onClick={() => setView('setup')}
            className={`mt-8 px-6 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
              }`}
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

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;

