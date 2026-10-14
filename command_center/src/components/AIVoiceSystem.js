/**
 * AI Voice Alert System — Trinetra Rakshak v2.0
 * Uses Web Speech API with automatic browser interaction unlocking
 */

let _userHasInteracted = true; // Default true in modern browsers once mounted
let _isAuthenticatedGlobal = true;

// Auto-unlock speech synthesis on any user gesture anywhere on window
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    _userHasInteracted = true;
    try {
      if (window.speechSynthesis) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }
    } catch { /* ignore */ }
  };
  window.addEventListener('click', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
  window.addEventListener('pointerdown', unlockAudio, { passive: true });
}

export function setUserInteracted() {
  _userHasInteracted = true;
  try {
    if (typeof window !== 'undefined' && window.speechSynthesis?.paused) {
      window.speechSynthesis.resume();
    }
  } catch { /* ignore */ }
}

export function setGlobalAuthState(authenticated) {
  _isAuthenticatedGlobal = !!authenticated;
  if (!authenticated) {
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
  }
}

class AIVoiceSystem {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.enabled = true; // Ready to speak when triggered
    this.queue = [];
    this.speaking = false;
    this.currentUtterance = null;
    this.cachedVoice = null;

    if (this.synth) {
      try {
        this.synth.cancel();
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.onvoiceschanged = () => {
            this.cachedVoice = this.getVoice();
          };
        }
      } catch { /* ignore */ }
    }
  }

  getVoice() {
    if (!this.synth) return null;
    try {
      const voices = this.synth.getVoices() || [];
      if (!voices || voices.length === 0) return null;

      // Prefer Indian English voices (Heera, Ravi, Neerja, en-IN)
      const indianVoice = voices.find(v =>
        v.lang?.toLowerCase().includes('en-in') ||
        v.name?.toLowerCase().includes('india') ||
        v.name?.toLowerCase().includes('heera') ||
        v.name?.toLowerCase().includes('ravi')
      );
      if (indianVoice) return indianVoice;

      // Fallback to any English voice
      const enVoice = voices.find(v => v.lang?.toLowerCase().startsWith('en'));
      return enVoice || voices[0] || null;
    } catch { return null; }
  }

  _canSpeak() {
    if (!this.enabled) return false;
    if (!this.synth) {
      if (typeof window !== 'undefined') this.synth = window.speechSynthesis;
    }
    return !!this.synth;
  }

  speak(text, priority = 'normal') {
    if (!text) return;
    setUserInteracted();

    if (!this._canSpeak()) return;

    try {
      if (this.synth.paused) {
        this.synth.resume();
      }
    } catch { /* ignore */ }

    if (priority === 'critical') {
      try { this.synth.cancel(); } catch { /* ignore */ }
      this.queue = [];
      this.speaking = false;
      this._utterNow(text, priority);
    } else {
      if (this.queue.length < 4) {
        this.queue.push({ text, priority });
      }
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
    if (!this._canSpeak()) {
      this.queue = [];
      this.speaking = false;
      return;
    }
    this.speaking = true;
    const msg = this.queue.shift();
    this._utterNow(msg.text, msg.priority, true);
  }

  _utterNow(text, priority) {
    if (!this._canSpeak()) return;

    try {
      if (this.synth.speaking && priority === 'critical') {
        this.synth.cancel();
      }
      if (this.synth.paused) {
        this.synth.resume();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      const voice = this.cachedVoice || this.getVoice();
      if (voice) utterance.voice = voice;

      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Chrome keep-alive
      const keepAlive = setInterval(() => {
        if (this.synth && this.synth.speaking) {
          this.synth.pause();
          this.synth.resume();
        } else {
          clearInterval(keepAlive);
        }
      }, 4000);

      utterance.onstart = () => {
        this.speaking = true;
      };

      utterance.onend = () => {
        clearInterval(keepAlive);
        this.currentUtterance = null;
        setTimeout(() => { this._processQueue(); }, 350);
      };

      utterance.onerror = () => {
        clearInterval(keepAlive);
        this.currentUtterance = null;
        this.speaking = false;
        setTimeout(() => { this._processQueue(); }, 350);
      };

      this.synth.speak(utterance);
    } catch {
      this.speaking = false;
    }
  }

  enable() {
    this.enabled = true;
    setUserInteracted();
    try {
      if (this.synth?.paused) this.synth.resume();
    } catch { /* ignore */ }
  }

  disable() {
    this.enabled = false;
    try { this.synth?.cancel(); } catch { /* ignore */ }
    this.queue = [];
    this.speaking = false;
  }

  toggle() {
    if (this.enabled) { this.disable(); return false; }
    else { this.enable(); return true; }
  }

  destroy() {
    this.enabled = false;
    this.queue = [];
    this.speaking = false;
    try { this.synth?.cancel(); } catch { /* ignore */ }
    this.currentUtterance = null;
  }
}

// ─── Enhanced Sound System ───

export function playSiren(duration = 2000) {
  if (!_userHasInteracted) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
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
  if (!_userHasInteracted) return;
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

export function playHighPitchAlarm() {
  if (!_userHasInteracted) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    for (let i = 0; i < 6; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 1800;
      gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.2);
      osc.stop(ctx.currentTime + i * 0.2 + 0.1);
    }
  } catch { /* silent */ }
}

export function playDetectionBeep() {
  if (!_userHasInteracted) return;
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
  if (!_userHasInteracted) return;
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
