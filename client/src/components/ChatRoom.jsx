import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import ReportModal from './ReportModal';
import soundManager from '../utils/sounds';

const ChatRoom = ({ socket, roomId, partner, onSkip, onStop }) => {
    const { isDark } = useTheme();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isPartnerTyping, setIsPartnerTyping] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const lastTypingEmitRef = useRef(0);

    const emojis = ['👍', '😂', '👋', '❤️', '🤔'];

    // Generate unique message ID
    const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Mark messages as seen when component updates
    const markMessagesAsSeen = useCallback(() => {
        const unseenMessages = messages.filter(
            msg => msg.senderId !== socket.id && !msg.seen
        );

        if (unseenMessages.length > 0) {
            const messageIds = unseenMessages.map(m => m.id);
            socket.emit('messages_seen', { roomId, messageIds });

            // Update local state
            setMessages(prev => prev.map(msg =>
                messageIds.includes(msg.id) ? { ...msg, seen: true } : msg
            ));
        }
    }, [messages, roomId, socket]);

    useEffect(() => {
        markMessagesAsSeen();
    }, [messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const handleReceiveMessage = ({ message, senderId, messageId }) => {
            setMessages(prev => [...prev, {
                id: messageId,
                text: message,
                senderId,
                type: 'text',
                seen: false,
                status: 'delivered'
            }]);
            // Play sound if window not focused
            if (document.hidden) {
                soundManager.playMessage();
            }
        };

        const handleReceiveEmoji = ({ emoji, senderId, messageId }) => {
            setMessages(prev => [...prev, {
                id: messageId,
                text: emoji,
                senderId,
                type: 'emoji',
                seen: false,
                status: 'delivered'
            }]);
            if (document.hidden) {
                soundManager.playMessage();
            }
        };

        const handleReceiveImage = ({ imageData, senderId, messageId }) => {
            setMessages(prev => [...prev, {
                id: messageId,
                imageData,
                senderId,
                type: 'image',
                seen: false,
                status: 'delivered'
            }]);
            if (document.hidden) {
                soundManager.playMessage();
            }
        };

        const handlePartnerTyping = () => {
            setIsPartnerTyping(true);
        };

        const handlePartnerStopTyping = () => {
            setIsPartnerTyping(false);
        };

        const handleMessagesRead = ({ messageIds }) => {
            setMessages(prev => prev.map(msg =>
                messageIds.includes(msg.id) ? { ...msg, status: 'read' } : msg
            ));
        };

        socket.on('receive_message', handleReceiveMessage);
        socket.on('receive_emoji', handleReceiveEmoji);
        socket.on('receive_image', handleReceiveImage);
        socket.on('partner_typing', handlePartnerTyping);
        socket.on('partner_stop_typing', handlePartnerStopTyping);
        socket.on('messages_read', handleMessagesRead);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
            socket.off('receive_emoji', handleReceiveEmoji);
            socket.off('receive_image', handleReceiveImage);
            socket.off('partner_typing', handlePartnerTyping);
            socket.off('partner_stop_typing', handlePartnerStopTyping);
            socket.off('messages_read', handleMessagesRead);
        };
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isPartnerTyping]);

    // Handle typing indicator
    const handleInputChange = (e) => {
        setInput(e.target.value);

        const now = Date.now();
        // Emit typing_start at most every 2 seconds
        if (now - lastTypingEmitRef.current > 2000) {
            socket.emit('typing_start', { roomId });
            lastTypingEmitRef.current = now;
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set timeout to emit typing_stop
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing_stop', { roomId });
        }, 2000);
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (input.trim()) {
            const messageId = generateMessageId();
            socket.emit('send_message', { roomId, message: input, messageId });
            setMessages(prev => [...prev, {
                id: messageId,
                text: input,
                senderId: socket.id,
                type: 'text',
                status: 'sent'
            }]);
            setInput('');

            // Stop typing indicator
            socket.emit('typing_stop', { roomId });
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        }
    };

    const sendEmoji = (emoji) => {
        const messageId = generateMessageId();
        socket.emit('send_emoji', { roomId, emoji, messageId });
        setMessages(prev => [...prev, {
            id: messageId,
            text: emoji,
            senderId: socket.id,
            type: 'emoji',
            status: 'sent'
        }]);
    };

    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be less than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setImagePreview(event.target.result);
        };
        reader.readAsDataURL(file);
    };

    const sendImage = () => {
        if (!imagePreview) return;

        const messageId = generateMessageId();
        socket.emit('send_image', { roomId, imageData: imagePreview, messageId });
        setMessages(prev => [...prev, {
            id: messageId,
            imageData: imagePreview,
            senderId: socket.id,
            type: 'image',
            status: 'sent'
        }]);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const cancelImagePreview = () => {
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleReport = async (reportData) => {
        socket.emit('report_user', {
            roomId,
            partnerId: partner.id,
            reason: reportData.reason,
            details: reportData.details
        });
    };

    const handleBlock = () => {
        socket.emit('block_user', { partnerId: partner.id, roomId });
        // Don't call onSkip - server handles the disconnection, client will get partner_disconnected or we go to waiting
        // Instead, go back to home/setup since we blocked this person
        onStop();
    };

    // Render read receipt indicator
    const renderReadReceipt = (msg) => {
        if (msg.senderId !== socket.id) return null;

        return (
            <span className={`text-xs ml-1 ${msg.status === 'read' ? 'text-blue-400' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {msg.status === 'read' ? (
                    // Double check for read
                    <span className="read-receipt">✓✓</span>
                ) : (
                    // Single check for sent/delivered
                    <span>✓</span>
                )}
            </span>
        );
    };

    return (
        <div className={`flex flex-col h-[100dvh] font-sans overflow-hidden transition-colors duration-300 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
            }`}>
            {/* Header - Fixed Height */}
            <div className={`flex-none flex items-center justify-between p-4 backdrop-blur-md border-b shadow-lg z-10 ${isDark ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90 border-gray-200'
                }`}>
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-lg font-bold shadow-inner overflow-hidden relative">
                        {partner.countryCode && partner.countryCode !== 'OTHER' ? (
                            <img
                                src={`https://flagcdn.com/w80/${partner.countryCode.toLowerCase()}.png`}
                                alt={partner.country}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-white">{partner.name.charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold leading-tight">{partner.name}</h2>
                        <p className={`text-xs font-medium flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {isPartnerTyping ? (
                                <span className="text-blue-400 flex items-center gap-1">
                                    typing
                                    <span className="flex gap-0.5">
                                        <span className="typing-dot w-1 h-1 bg-blue-400 rounded-full"></span>
                                        <span className="typing-dot w-1 h-1 bg-blue-400 rounded-full"></span>
                                        <span className="typing-dot w-1 h-1 bg-blue-400 rounded-full"></span>
                                    </span>
                                </span>
                            ) : (
                                <>{partner.gender} • {partner.country}</>
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <ThemeToggle className="!p-1.5" />

                    {/* More options dropdown */}
                    <div className="relative group">
                        <button className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                            }`}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                        </button>
                        <div className={`absolute right-0 mt-1 w-40 rounded-lg shadow-xl border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                            }`}>
                            <button
                                onClick={() => setIsReportModalOpen(true)}
                                className={`w-full px-4 py-2 text-left text-sm transition-colors rounded-t-lg ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                                    }`}
                            >
                                Report User
                            </button>
                            <button
                                onClick={handleBlock}
                                className={`w-full px-4 py-2 text-left text-sm transition-colors rounded-b-lg text-red-500 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                                    }`}
                            >
                                Block User
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={onSkip}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors border whitespace-nowrap ${isDark
                            ? 'bg-gray-700 hover:bg-gray-600 border-gray-600'
                            : 'bg-gray-100 hover:bg-gray-200 border-gray-300'
                            }`}
                    >
                        Skip
                    </button>
                    <button
                        onClick={onStop}
                        className="px-3 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-500 hover:text-red-400 border border-red-600/50 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                    >
                        Stop
                    </button>
                </div>
            </div>

            {/* Messages - Scrollable Area */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth overscroll-contain custom-scrollbar ${isDark ? 'bg-gray-900' : 'bg-gray-50'
                }`}>
                {messages.length === 0 && (
                    <div className={`flex flex-col items-center justify-center h-full opacity-50 ${isDark ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                        <p className="text-sm">Start the conversation!</p>
                    </div>
                )}
                {messages.map((msg, index) => {
                    const isMe = msg.senderId === socket.id;
                    return (
                        <div key={msg.id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                            {msg.type === 'image' ? (
                                <div className={`image-message ${isMe ? 'ml-auto' : 'mr-auto'}`}>
                                    <img
                                        src={msg.imageData}
                                        alt="Shared"
                                        className="rounded-xl"
                                        onClick={() => window.open(msg.imageData, '_blank')}
                                    />
                                    {isMe && (
                                        <div className="flex justify-end mt-1">
                                            {renderReadReceipt(msg)}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className={`max-w-[85%] md:max-w-md px-5 py-3 rounded-2xl shadow-md break-words ${isMe
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : isDark
                                        ? 'bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700'
                                        : 'bg-white text-gray-900 rounded-bl-none border border-gray-200 shadow-sm'
                                    } ${msg.type === 'emoji' ? 'text-5xl bg-transparent border-none shadow-none p-0' : ''}`}>
                                    <span>{msg.text}</span>
                                    {msg.type !== 'emoji' && renderReadReceipt(msg)}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Typing Indicator */}
                {isPartnerTyping && (
                    <div className="flex justify-start animate-fade-in">
                        <div className={`px-4 py-3 rounded-2xl rounded-bl-none ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                            }`}>
                            <div className="flex gap-1">
                                <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full"></span>
                                <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full"></span>
                                <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full"></span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Image Preview */}
            {imagePreview && (
                <div className={`flex-none p-3 border-t ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="h-20 w-20 object-cover rounded-lg"
                            />
                            <button
                                onClick={cancelImagePreview}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
                            >
                                ✕
                            </button>
                        </div>
                        <button
                            onClick={sendImage}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
                        >
                            Send Image
                        </button>
                    </div>
                </div>
            )}

            {/* Input Area - Fixed at Bottom */}
            <div className={`flex-none p-3 backdrop-blur-md border-t pb-safe ${isDark ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90 border-gray-200'
                }`}>
                <div className="flex space-x-4 mb-3 justify-center overflow-x-auto py-1 no-scrollbar">
                    {emojis.map(emoji => (
                        <button
                            key={emoji}
                            onClick={() => sendEmoji(emoji)}
                            className="text-3xl hover:scale-125 transition-transform duration-200 active:scale-95 flex-shrink-0"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
                <form onSubmit={sendMessage} className="flex space-x-2 max-w-4xl mx-auto">
                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                    />

                    {/* Image upload button */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-3 rounded-xl transition-colors ${isDark
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                            }`}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </button>

                    <input
                        type="text"
                        value={input}
                        onChange={handleInputChange}
                        className={`flex-1 p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base ${isDark
                            ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                            }`}
                        placeholder="Type a message..."
                    />
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-white transition-colors shadow-lg whitespace-nowrap"
                    >
                        Send
                    </button>
                </form>
            </div>

            {/* Report Modal */}
            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                onSubmit={handleReport}
                partnerName={partner.name}
            />
        </div>
    );
};

export default ChatRoom;
