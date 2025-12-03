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
        <div className="flex flex-col h-screen bg-gray-900 text-white">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gray-800 shadow-md">
                <div>
                    <h2 className="text-xl font-bold">{partner.name}</h2>
                    <p className="text-sm text-gray-400">{partner.gender} • {partner.country}</p>
                </div>
                <div className="flex space-x-2">
                    <button onClick={onSkip} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-sm font-bold">
                        Skip
                    </button>
                    <button onClick={onStop} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-bold">
                        Stop
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => {
                    const isMe = msg.senderId === socket.id;
                    return (
                        <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg ${isMe
                                    ? 'bg-blue-600 rounded-br-none'
                                    : 'bg-gray-700 rounded-bl-none'
                                } ${msg.type === 'emoji' ? 'text-4xl bg-transparent p-0' : ''}`}>
                                {msg.text}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-gray-800">
                <div className="flex space-x-2 mb-2 justify-center">
                    {emojis.map(emoji => (
                        <button
                            key={emoji}
                            onClick={() => sendEmoji(emoji)}
                            className="text-2xl hover:scale-110 transition transform"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
                <form onSubmit={sendMessage} className="flex space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
                        placeholder="Type a message..."
                    />
                    <button
                        type="submit"
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded font-bold"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatRoom;
