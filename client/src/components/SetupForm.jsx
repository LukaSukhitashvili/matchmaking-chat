import React, { useState, useEffect } from 'react';
import { countries } from '../constants/countries';

const SetupForm = ({ onJoin }) => {
    const [name, setName] = useState('');
    const [gender, setGender] = useState('Any');
    const [selectedCountry, setSelectedCountry] = useState(countries.find(c => c.code === 'OTHER'));

    // Load from localStorage on mount
    useEffect(() => {
        const savedData = localStorage.getItem('matchchat_user');
        if (savedData) {
            const { name, gender, countryCode } = JSON.parse(savedData);
            if (name) setName(name);
            if (gender) setGender(gender);
            if (countryCode) {
                const country = countries.find(c => c.code === countryCode);
                if (country) setSelectedCountry(country);
            }
        }
    }, []);

    // Save to localStorage on change
    useEffect(() => {
        const dataToSave = {
            name,
            gender,
            countryCode: selectedCountry.code
        };
        localStorage.setItem('matchchat_user', JSON.stringify(dataToSave));
    }, [name, gender, selectedCountry]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            onJoin({
                name,
                gender,
                country: `${selectedCountry.emoji} ${selectedCountry.name}`
            });
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <div className="bg-gray-800/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md z-10 border border-gray-700">
                <h1 className="text-4xl font-extrabold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    MatchChat
                </h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">Display Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-3 rounded-xl bg-gray-700/50 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder-gray-400"
                            placeholder="How should we call you?"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">Gender</label>
                        <div className="relative">
                            <select
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                className="w-full p-3 rounded-xl bg-gray-700/50 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white appearance-none cursor-pointer"
                            >
                                <option value="Any">Any</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Non-binary">Non-binary</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">Country</label>
                        <div className="relative">
                            <select
                                value={selectedCountry.code}
                                onChange={(e) => setSelectedCountry(countries.find(c => c.code === e.target.value))}
                                className="w-full p-3 rounded-xl bg-gray-700/50 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white appearance-none cursor-pointer"
                            >
                                {countries.map((country) => (
                                    <option key={country.code} value={country.code}>
                                        {country.emoji} {country.name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-bold text-lg shadow-lg transform transition hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Start Chatting
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SetupForm;
