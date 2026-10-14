/**
 * AI Voice Alert System — Trinetra Rakshak v2.0
 * FIXED: Voice no longer speaks before user interaction/authentication
 * Uses Web Speech API with strict guards
 */

// Global flag — only set true after a real user gesture (click/keydown)
let _userHasInteracted = false;
let _isAuthenticatedGlobal = false;

export function setUserInteracted() {
  _userHasInteracted = true;
}

export function setGlobalAuthState(authenticated) {
  _isAuthenticatedGlobal = authenticated;
  if (!authenticated) {
    // Always cancel speech when logged out
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
    _userHasInteracted = false;
  }
}

class AIVoiceSystem {
  constructor() {
    this.synth = window.speechSynthesis;
    this.enabled = false; // START DISABLED — user must explicitly enable
    this.queue = [];
    this.speaking = false;
    this.currentUtterance = null;
    // Cancel any lingering speech immediately on construction
    try { this.synth?.cancel(); } catch { /* ignore */ }
  }

  getVoice() {
    try {
      const voices = this.synth.getVoices();
      const indianFemale = voices.find(v =>
        v.lang === 'en-IN' &&
        (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('heera'))
      );
      const genericIndian = voices.find(v => v.lang === 'en-IN');
      return indianFemale || genericIndian || voices[0] || null;
    } catch { return null; }
  }

  // STRICT GUARD — must pass ALL conditions to speak
  _canSpeak() {
    if (!this.enabled) return false;
    if (!_isAuthenticatedGlobal) return false;
    if (!_userHasInteracted) return false;
    if (!this.synth) return false;
    return true;
  }

  speak(text, priority = 'normal') {
    if (!this._canSpeak()) return;

    if (priority === 'critical') {
      try { this.synth.cancel(); } catch { /* ignore */ }
      this.queue = [];
      this.speaking = false;
      this._utterNow(text, priority);
    } else {
      // Limit queue to 3 items — prevents backlog on slow systems
      if (this.queue.length < 3) {
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

  _utterNow(text, priority, fromQueue = false) {
    if (!this._canSpeak()) return;

    try {
      if (this.synth.speaking && priority === 'critical') {
        this.synth.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      utterance.voice = this.getVoice();
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = priority === 'critical' ? 1.0 : 0.8;

      // Chrome keep-alive fix
      const keepAlive = setInterval(() => {
        if (this.synth.speaking) {
          this.synth.pause();
          this.synth.resume();
        } else {
          clearInterval(keepAlive);
        }
      }, 5000);

      utterance.onstart = () => { this.speaking = true; };

      utterance.onend = () => {
        clearInterval(keepAlive);
        this.currentUtterance = null;
        setTimeout(() => { this._processQueue(); }, 600);
      };

      utterance.onerror = () => {
        clearInterval(keepAlive);
        this.currentUtterance = null;
        this.speaking = false;
      };

      this.synth.speak(utterance);
    } catch { /* silent fail */ }
  }

  enable() {
    this.enabled = true;
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
