// Sound notification utility
// Uses Web Audio API with fallback to Audio element

class SoundManager {
    constructor() {
        this.enabled = this.loadPreference();
        this.sounds = {};
        this.audioContext = null;
    }

    loadPreference() {
        const saved = localStorage.getItem('matchchat_sounds');
        return saved === null ? true : saved === 'true';
    }

    savePreference() {
        localStorage.setItem('matchchat_sounds', this.enabled.toString());
    }

    toggle() {
        this.enabled = !this.enabled;
        this.savePreference();
        return this.enabled;
    }

    isEnabled() {
        return this.enabled;
    }

    setEnabled(value) {
        this.enabled = value;
        this.savePreference();
    }

    // Generate a simple notification sound using Web Audio API
    generateTone(frequency = 440, duration = 0.15, type = 'sine') {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = type;

            // Envelope for smooth sound
            const now = this.audioContext.currentTime;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

            oscillator.start(now);
            oscillator.stop(now + duration);
        } catch (e) {
            console.warn('Could not play sound:', e);
        }
    }

    playMatch() {
        if (!this.enabled) return;
        // Play ascending tones for match
        this.generateTone(523, 0.1, 'sine'); // C5
        setTimeout(() => this.generateTone(659, 0.1, 'sine'), 100); // E5
        setTimeout(() => this.generateTone(784, 0.2, 'sine'), 200); // G5
    }

    playMessage() {
        if (!this.enabled) return;
        // Simple ping sound for new message
        this.generateTone(880, 0.08, 'sine'); // A5
    }

    playNotification() {
        if (!this.enabled) return;
        // Generic notification
        this.generateTone(660, 0.1, 'triangle');
    }
}

// Singleton instance
const soundManager = new SoundManager();

export default soundManager;
