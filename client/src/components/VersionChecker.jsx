import React, { useEffect, useState } from 'react';

const CHECK_INTERVAL = 60 * 1000; // Check every 1 minute

const VersionChecker = () => {
    const [hasUpdate, setHasUpdate] = useState(false);
    const [currentVersion, setCurrentVersion] = useState(null);

    useEffect(() => {
        // Fetch initial version
        const fetchVersion = async () => {
            try {
                const response = await fetch('/version.json');
                const data = await response.json();
                return data.version;
            } catch (err) {
                console.error('Failed to check version:', err);
                return null;
            }
        };

        fetchVersion().then(version => {
            if (version) setCurrentVersion(version);
        });

        const interval = setInterval(async () => {
            if (!currentVersion) return;

            const newVersion = await fetchVersion();
            if (newVersion && newVersion !== currentVersion) {
                setHasUpdate(true);
            }
        }, CHECK_INTERVAL);

        return () => clearInterval(interval);
    }, [currentVersion]);

    if (!hasUpdate) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 shadow-lg animate-slide-down">
            <div className="max-w-7xl mx-auto flex items-center justify-between px-4">
                <div className="flex items-center space-x-2">
                    <svg className="h-5 w-5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="font-medium text-sm sm:text-base">New version available!</span>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-white text-blue-600 px-4 py-1 rounded-full text-sm font-bold hover:bg-gray-100 transition-colors shadow-sm"
                >
                    Refresh Now
                </button>
            </div>
        </div>
    );
};

export default VersionChecker;
