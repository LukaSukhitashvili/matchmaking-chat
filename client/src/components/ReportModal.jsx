import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const REPORT_REASONS = [
    { id: 'harassment', label: 'Harassment or bullying' },
    { id: 'spam', label: 'Spam or advertising' },
    { id: 'inappropriate', label: 'Inappropriate content' },
    { id: 'impersonation', label: 'Impersonation' },
    { id: 'other', label: 'Other' }
];

const ReportModal = ({ isOpen, onClose, onSubmit, partnerName }) => {
    const { isDark } = useTheme();
    const [selectedReason, setSelectedReason] = useState('');
    const [details, setDetails] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedReason) return;

        setIsSubmitting(true);
        await onSubmit({ reason: selectedReason, details });
        setIsSubmitting(false);
        setSelectedReason('');
        setDetails('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className={`rounded-2xl shadow-2xl border max-w-md w-full p-6 transform transition-all scale-100 animate-scale-in ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Report User
                    </h3>
                    <button
                        onClick={onClose}
                        className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Report <span className="font-medium">{partnerName}</span> for violating our community guidelines.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-2 mb-4">
                        {REPORT_REASONS.map((reason) => (
                            <label
                                key={reason.id}
                                className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${selectedReason === reason.id
                                        ? isDark ? 'bg-blue-600/20 border-blue-500' : 'bg-blue-50 border-blue-500'
                                        : isDark ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                                    } border ${selectedReason === reason.id
                                        ? 'border-blue-500'
                                        : isDark ? 'border-gray-600' : 'border-gray-200'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="reason"
                                    value={reason.id}
                                    checked={selectedReason === reason.id}
                                    onChange={(e) => setSelectedReason(e.target.value)}
                                    className="sr-only"
                                />
                                <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {reason.label}
                                </span>
                            </label>
                        ))}
                    </div>

                    <div className="mb-4">
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Additional details (optional)
                        </label>
                        <textarea
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            placeholder="Provide more context about the issue..."
                            rows={3}
                            className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${isDark
                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                }`}
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${isDark
                                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }`}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedReason || isSubmitting}
                            className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-white transition-colors"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportModal;
