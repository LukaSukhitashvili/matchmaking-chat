import React, { useState, useEffect, useRef } from 'react';
import { countries } from '../constants/countries';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';

const SetupForm = ({ onJoin, onlineCount = 0 }) => {
    const { isDark } = useTheme();
    const [name, setName] = useState('');
    const [gender, setGender] = useState('Any');
    const [selectedCountry, setSelectedCountry] = useState(countries.find(c => c.code === 'OTHER'));
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                country: `${selectedCountry.emoji} ${selectedCountry.name}`,
                countryCode: selectedCountry.code
            });
        }
    };

    return (
        <div className={`flex flex-col items-center justify-center min-h-screen p-4 relative overflow-hidden transition-colors duration-300 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
            }`}>
            {/* Theme Toggle - Top Right */}
            <div className="absolute top-4 right-4 z-20">
                <ThemeToggle />
            </div>

            {/* Online Count Badge - Top Left */}
            <div className="absolute top-4 left-4 z-20">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${isDark ? 'bg-gray-800/80 text-gray-300' : 'bg-white/80 text-gray-600 shadow-sm'
                    }`}>
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span>{onlineCount} online</span>
                </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className={`absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob ${isDark ? 'bg-blue-600' : 'bg-blue-400'
                    }`}></div>
                <div className={`absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 ${isDark ? 'bg-purple-600' : 'bg-purple-400'
                    }`}></div>
                <div className={`absolute bottom-[-20%] left-[20%] w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000 ${isDark ? 'bg-pink-600' : 'bg-pink-400'
                    }`}></div>
            </div>

            <div className={`backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md z-10 border transition-colors duration-300 ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white/90 border-gray-200'
                }`}>
                <h1 className="text-4xl font-extrabold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    MatchChat
                </h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Display Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${isDark
                                    ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400'
                                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                                }`}
                            placeholder="How should we call you?"
                            required
                        />
                    </div>

                    <div>
                        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Gender</label>
                        <div className="relative">
                            <select
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer ${isDark
                                        ? 'bg-gray-700/50 border-gray-600 text-white'
                                        : 'bg-gray-50 border-gray-300 text-gray-900'
                                    }`}
                            >
                                <option value="Any">Any</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Non-binary">Non-binary</option>
                            </select>
                            <div className={`absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                            </div>
                        </div>
                    </div>

                    <div ref={dropdownRef} className="relative">
                        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Country</label>
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-left flex items-center justify-between ${isDark
                                    ? 'bg-gray-700/50 border-gray-600 text-white'
                                    : 'bg-gray-50 border-gray-300 text-gray-900'
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                {selectedCountry.code !== 'OTHER' ? (
                                    <img
                                        src={`https://flagcdn.com/24x18/${selectedCountry.code.toLowerCase()}.png`}
                                        srcSet={`https://flagcdn.com/48x36/${selectedCountry.code.toLowerCase()}.png 2x`}
                                        width="24"
                                        height="18"
                                        alt={selectedCountry.name}
                                        className="rounded-sm object-cover"
                                    />
                                ) : (
                                    <span className="text-xl">🌍</span>
                                )}
                                {selectedCountry.name}
                            </span>
                            <svg className={`w-4 h-4 fill-current transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                        </button>

                        {isDropdownOpen && (
                            <div className={`absolute z-20 w-full mt-2 border rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                                }`}>
                                {countries.map((country) => (
                                    <button
                                        key={country.code}
                                        type="button"
                                        onClick={() => {
                                            setSelectedCountry(country);
                                            setIsDropdownOpen(false);
                                        }}
                                        className={`w-full p-3 text-left transition-colors flex items-center gap-3 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                            }`}
                                    >
                                        {country.code !== 'OTHER' ? (
                                            <img
                                                src={`https://flagcdn.com/24x18/${country.code.toLowerCase()}.png`}
                                                srcSet={`https://flagcdn.com/48x36/${country.code.toLowerCase()}.png 2x`}
                                                width="24"
                                                height="18"
                                                alt={country.name}
                                                className="rounded-sm object-cover"
                                            />
                                        ) : (
                                            <span className="text-xl">🌍</span>
                                        )}
                                        {country.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-bold text-lg text-white shadow-lg transform transition hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Start Chatting
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SetupForm;

