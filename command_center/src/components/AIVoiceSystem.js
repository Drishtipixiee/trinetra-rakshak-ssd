/**
 * AI Voice Alert System
 * Uses Web Speech API for text-to-speech alerts
 * Simulates an AI officer reading out critical intel
 */

class AIVoiceSystem {
    constructor() {
        this.synth = window.speechSynthesis;
        this.enabled = true;
        this.lastSpoke = 0;
        this.cooldown = 6000; // 6 seconds between voice alerts
        this.queue = [];
        this.speaking = false;
    }

    getVoice() {
        const voices = this.synth.getVoices();
        // Strictly prefer Indian Female voice as requested by user
        const indianFemale = voices.find(v => v.lang === 'en-IN' && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('heera')));
        const genericIndian = voices.find(v => v.lang === 'en-IN');
        return indianFemale || genericIndian || voices[0];
    }

    speak(text, priority = 'normal') {
        if (!this.enabled || !this.synth) return;

        if (priority === 'critical') {
            this.synth.cancel();
            this.queue = []; // Clear queue on critical to prioritize
            this._utterNow(text, priority);
        } else {
            this.queue.push({ text, priority });
            if (!this.speaking) {
                this._processQueue();
            }
        }
    }

    _processQueue() {
        if (this.queue.length === 0) {
            this.speaking = false;
            return;
        }

        this.speaking = true;
        const msg = this.queue.shift();
        this._utterNow(msg.text, msg.priority, true);
    }

    _utterNow(text, priority, fromQueue = false) {
        if (this.synth.speaking && priority === 'critical') {
            this.synth.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);

        // Prevent garbage collection by storing a reference
        this.currentUtterance = utterance;

        utterance.voice = this.getVoice();
        utterance.rate = priority === 'critical' ? 1.0 : 0.95;
        utterance.pitch = priority === 'critical' ? 1.05 : 1.0;
        utterance.volume = priority === 'critical' ? 1.0 : 0.8;

        // "Stay alive" hack for Chrome/Edge - periodically pause/resume
        const keepAlive = setInterval(() => {
            if (this.synth.speaking) {
                this.synth.pause();
                this.synth.resume();
            } else {
                clearInterval(keepAlive);
            }
        }, 5000);

        utterance.onstart = () => {
            this.speaking = true;
        };

        utterance.onend = () => {
            clearInterval(keepAlive);
            this.currentUtterance = null;
            setTimeout(() => {
                this._processQueue();
            }, 800);
        };

        utterance.onerror = (e) => {
            console.error("Voice Error", e);
            clearInterval(keepAlive);
            this.currentUtterance = null;
            this._processQueue();
        };

        this.synth.speak(utterance);
    }

    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) this.synth.cancel();
        return this.enabled;
    }

    destroy() {
        this.synth.cancel();
    }
}

// ─── Enhanced Sound System ───

export function playSiren(duration = 2000) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

        // Siren sweep
        const dur = duration / 1000;
        for (let i = 0; i < dur * 2; i++) {
            const t = i / 2;
            osc.frequency.setValueAtTime(400, ctx.currentTime + t);
            osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + t + 0.25);
            osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + t + 0.5);
        }

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + dur);
    } catch { /* silent */ }
}

export function playKlaxon() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        for (let i = 0; i < 3; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = 600;
            gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.3);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.3 + 0.15);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.3);
            osc.stop(ctx.currentTime + i * 0.3 + 0.15);
        }
    } catch { /* silent */ }
}

export function playDetectionBeep() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
    } catch { /* silent */ }
}

export function playSuccessChime() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [523, 659, 784].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.12);
            osc.stop(ctx.currentTime + i * 0.12 + 0.2);
        });
    } catch { /* silent */ }
}

export default AIVoiceSystem;
