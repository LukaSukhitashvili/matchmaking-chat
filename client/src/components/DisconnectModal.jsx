import React from 'react';

const DisconnectModal = ({ isOpen, message, onReconnect }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 max-w-sm w-full p-6 transform transition-all scale-100 animate-scale-in">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-900/30 mb-4">
                        <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Connection Lost</h3>
                    <p className="text-gray-300 mb-6">{message}</p>
                    <button
                        onClick={onReconnect}
                        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-bold text-white shadow-lg transition-transform transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Find New Match
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DisconnectModal;
