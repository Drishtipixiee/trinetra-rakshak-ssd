import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Mic, MicOff, Volume2 } from 'lucide-react';

const INCOMING_TRANSMISSIONS = [
    { from: 'COMMAND', msg: 'Alpha-7, hostile detected at Grid Reference 42. Confirm visual. Over.', priority: 'high' },
    { from: 'ALPHA-7', msg: 'Copy Command. Visual confirmed. One PAX, moving west. Engaging observation. Over.', priority: 'normal' },
    { from: 'COMMAND', msg: 'Alpha-7, maintain distance. QRF is en route, ETA 4 minutes. Hold position. Over.', priority: 'high' },
    { from: 'BRAVO-3', msg: 'Command, Bravo-3. Perimeter north all clear. No movement. Over.', priority: 'normal' },
    { from: 'COMMAND', msg: 'All units, switch to secure channel. Repeat — go encrypted. Over.', priority: 'high' },
    { from: 'WATCHTOWER', msg: 'Command, Watchtower-3. Thermal signature detected bearing 270. Tracking. Over.', priority: 'normal' },
    { from: 'COMMAND', msg: 'Alpha team, stand down. Threat neutralized. Resume patrol pattern. Over.', priority: 'normal' },
];

const AudioWaveform = ({ isTalking }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 20 }}>
        {[...Array(8)].map((_, i) => (
            <motion.div
                key={i}
                animate={isTalking ? {
                    height: [4, 15 + Math.random() * 10, 4],
                } : { height: 4 }}
                transition={{
                    repeat: Infinity,
                    duration: 0.4 + Math.random() * 0.3,
                    ease: "easeInOut",
                    delay: i * 0.05
                }}
                style={{
                    width: 3,
                    backgroundColor: 'var(--accent)',
                    borderRadius: 2
                }}
            />
        ))}
    </div>
);

const playRadioStatic = (duration = 300) => {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const bufferSize = ctx.sampleRate * (duration / 1000);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.08;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2000;
        filter.Q.value = 0.5;
        const gain = ctx.createGain();
        gain.gain.value = 0.15;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        source.start();
        source.stop(ctx.currentTime + duration / 1000);
    } catch (e) { /* silent fail */ }
};

const playBeep = () => {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 1200;
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
    } catch (e) { /* silent fail */ }
};

export default function WalkieTalkie({ isOpen, onToggle, threatLevel = 'LOW', detectedClass = '' }) {
    const [messages, setMessages] = useState([]);
    const [isTalking, setIsTalking] = useState(false);
    const [channelActive, setChannelActive] = useState(true);
    const msgEndRef = useRef(null);
    const lastThreatRef = useRef('LOW');
    const transmissionIdx = useRef(0);

    // Auto-transmit when threat level changes
    useEffect(() => {
        if (threatLevel !== lastThreatRef.current && threatLevel !== 'LOW') {
            lastThreatRef.current = threatLevel;

            playRadioStatic(400);
            setTimeout(() => {
                playBeep();
                const transmission = INCOMING_TRANSMISSIONS[transmissionIdx.current % INCOMING_TRANSMISSIONS.length];
                transmissionIdx.current += 1;

                setMessages(prev => [...prev.slice(-12), {
                    id: Date.now(),
                    from: transmission.from,
                    text: detectedClass
                        ? transmission.msg.replace('hostile', detectedClass.toLowerCase())
                        : transmission.msg,
                    time: new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }),
                    priority: transmission.priority
                }]);
            }, 500);
        }

        if (threatLevel === 'LOW' && lastThreatRef.current !== 'LOW') {
            lastThreatRef.current = 'LOW';
            setTimeout(() => {
                setMessages(prev => [...prev.slice(-12), {
                    id: Date.now(),
                    from: 'COMMAND',
                    text: 'All clear. Resume normal operations. Over.',
                    time: new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }),
                    priority: 'normal'
                }]);
            }, 2000);
        }
    }, [threatLevel, detectedClass]);

    useEffect(() => {
        if (msgEndRef.current) msgEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handlePTT = useCallback(() => {
        setIsTalking(true);
        playRadioStatic(200);
        setTimeout(() => {
            setIsTalking(false);
            playBeep();
            setMessages(prev => [...prev.slice(-12), {
                id: Date.now(),
                from: 'YOU',
                text: 'Copy that, Command. Eyes on target. Holding position. Over.',
                time: new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }),
                priority: 'normal'
            }]);
        }, 1500);
    }, []);

    return (
        <>
            {/* Toggle Button */}
            <button
                className={`walkie-toggle ${isOpen ? 'open' : ''} ${messages.length > 0 && !isOpen ? 'has-messages' : ''}`}
                onClick={onToggle}
            >
                <Radio size={18} />
                {messages.length > 0 && !isOpen && <span className="walkie-badge">{messages.length}</span>}
            </button>

            {/* Radio Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="walkie-panel"
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    >
                        {/* Header */}
                        <div className="walkie-header">
                            <div className="walkie-freq">
                                <Radio size={14} />
                                <span>FREQ 47.5 MHz</span>
                                <span className={`walkie-status-dot ${channelActive ? 'active' : ''}`} />
                            </div>
                            <span className="walkie-channel">SEC-7 TACTICAL</span>
                        </div>

                        {/* Messages */}
                        <div className="walkie-messages">
                            {messages.length === 0 && (
                                <div className="walkie-empty">
                                    <Radio size={24} style={{ opacity: 0.2 }} />
                                    <span>Channel quiet. Waiting for transmissions...</span>
                                </div>
                            )}
                            {messages.map(msg => (
                                <div key={msg.id} className={`walkie-msg ${msg.priority} ${msg.from === 'YOU' ? 'outgoing' : ''}`}>
                                    <div className="walkie-msg-header">
                                        <span className="walkie-msg-from">{msg.from}</span>
                                        <span className="walkie-msg-time">{msg.time}</span>
                                    </div>
                                    <div className="walkie-msg-text">{msg.text}</div>
                                </div>
                            ))}
                            <div ref={msgEndRef} />
                        </div>

                        {/* PTT Button */}
                        <div className="walkie-controls" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <button
                                className={`walkie-ptt ${isTalking ? 'talking' : ''}`}
                                onMouseDown={handlePTT}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                    background: isTalking ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
                                    border: `1px solid ${isTalking ? 'var(--safe)' : 'var(--glass-border)'}`,
                                    color: isTalking ? 'var(--safe)' : 'var(--text-main)'
                                }}
                            >
                                {isTalking ? <AudioWaveform isTalking={true} /> : <MicOff size={16} />}
                                <span>{isTalking ? 'TRANSMITTING...' : 'HOLD DOWN TO TALK'}</span>
                            </button>
                            <div className="walkie-signal">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className={`signal-bar ${channelActive && i <= 3 ? 'active' : ''}`} />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
