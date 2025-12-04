import React, { useState, useEffect, useRef } from 'react';

const ChatRoom = ({ socket, roomId, partner, onSkip, onStop }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const emojis = ['👍', '😂', '👋', '❤️', '🤔'];

    useEffect(() => {
        const handleReceiveMessage = ({ message, senderId }) => {
            setMessages(prev => [...prev, { text: message, senderId, type: 'text' }]);
        };

        const handleReceiveEmoji = ({ emoji, senderId }) => {
            setMessages(prev => [...prev, { text: emoji, senderId, type: 'emoji' }]);
        };

        socket.on('receive_message', handleReceiveMessage);
        socket.on('receive_emoji', handleReceiveEmoji);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
            socket.off('receive_emoji', handleReceiveEmoji);
        };
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (input.trim()) {
            socket.emit('send_message', { roomId, message: input });
            setMessages(prev => [...prev, { text: input, senderId: socket.id, type: 'text' }]);
            setInput('');
        }
    };

    const sendEmoji = (emoji) => {
        socket.emit('send_emoji', { roomId, emoji });
        setMessages(prev => [...prev, { text: emoji, senderId: socket.id, type: 'emoji' }]);
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-gray-900 text-white font-sans overflow-hidden">
            {/* Header - Fixed Height */}
            <div className="flex-none flex items-center justify-between p-4 bg-gray-800/90 backdrop-blur-md border-b border-gray-700 shadow-lg z-10">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-lg font-bold shadow-inner">
                        {partner.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold leading-tight">{partner.name}</h2>
                        <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                            {partner.gender} • {partner.country}
                        </p>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button onClick={onSkip} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-semibold transition-colors border border-gray-600 whitespace-nowrap">
                        Skip
                    </button>
                    <button onClick={onStop} className="px-3 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-500 hover:text-red-400 border border-red-600/50 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap">
                        Stop
                    </button>
                </div>
            </div>

            {/* Messages - Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900 scroll-smooth overscroll-contain">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
                        <p className="text-sm">Start the conversation!</p>
                    </div>
                )}
                {messages.map((msg, index) => {
                    const isMe = msg.senderId === socket.id;
                    return (
                        <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                            <div className={`max-w-[85%] md:max-w-md px-5 py-3 rounded-2xl shadow-md break-words ${isMe
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700'
                                } ${msg.type === 'emoji' ? 'text-5xl bg-transparent border-none shadow-none p-0' : ''}`}>
                                {msg.text}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Fixed at Bottom */}
            <div className="flex-none p-3 bg-gray-800/90 backdrop-blur-md border-t border-gray-700 pb-safe">
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
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 p-3 rounded-xl bg-gray-700/50 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white placeholder-gray-400 text-base"
                        placeholder="Type a message..."
                    />
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold transition-colors shadow-lg whitespace-nowrap"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatRoom;
