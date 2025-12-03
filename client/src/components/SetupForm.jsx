import React, { useState } from 'react';

const SetupForm = ({ onJoin }) => {
    const [name, setName] = useState('');
    const [gender, setGender] = useState('Any');
    const [country, setCountry] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            onJoin({ name, gender, country: country || 'Unknown' });
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
                <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                    MatchChat
                </h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Display Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
                            placeholder="Enter your name"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Gender</label>
                        <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
                        >
                            <option value="Any">Any</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Non-binary">Non-binary</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Country</label>
                        <input
                            type="text"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
                            placeholder="Optional"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-700 rounded font-bold transition duration-200"
                    >
                        Start Chat
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SetupForm;
