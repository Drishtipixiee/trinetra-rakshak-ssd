class SpeechQueue {
    constructor() {
        this.queue = [];
        this.isSpeaking = false;
        this.synth = window.speechSynthesis;
    }

    speak(text) {
        if (!this.synth) {
            console.warn("Speech Synthesis not supported");
            return;
        }

        this.queue.push(text);
        if (!this.isSpeaking) {
            this._processQueue();
        }
    }

    _processQueue() {
        if (this.queue.length === 0) {
            this.isSpeaking = false;
            return;
        }

        this.isSpeaking = true;
        const text = this.queue.shift();
        const utterance = new SpeechSynthesisUtterance(text);

        // Configure voice to sound authoritative/systematic
        utterance.rate = 0.95;
        utterance.pitch = 0.8;

        // Try to find an English (UK/US) voice that sounds professional
        const voices = this.synth.getVoices();
        const preferredVoice = voices.find(v => v.lang.includes('en-GB') || v.name.includes('Google UK English Female') || v.name.includes('Microsoft Hazel'));
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.onend = () => {
            // Small pause between announcements to avoid "hectic pressure"
            setTimeout(() => {
                this._processQueue();
            }, 500);
        };

        utterance.onerror = (e) => {
            console.error("Speech error", e);
            this.isSpeaking = false;
            this._processQueue();
        };

        this.synth.speak(utterance);
    }

    clear() {
        this.queue = [];
        if (this.synth) this.synth.cancel();
        this.isSpeaking = false;
    }
}

export const aiVoice = new SpeechQueue();
