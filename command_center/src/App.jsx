import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Activity, Crosshair, AlertTriangle,
  Map as MapIcon, Terminal, Video, Target, Radio
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Subcomponents
const TypewriterText = ({ text, speed = 20, className = '' }) => {
  const [displayedText, setDisplayedText] = useState('');
  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return (
    <span className={className}>
      {displayedText}
      {displayedText.length < text.length && <span className="typewriter-cursor" />}
    </span>
  );
};

// Play short tactical ping
const playTacticalPing = () => {
  try {
    const actx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, actx.currentTime); // high pitch
    osc.frequency.exponentialRampToValueAtTime(300, actx.currentTime + 0.5); // drop pitch
    gain.gain.setValueAtTime(0.3, actx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(actx.destination);
    osc.start();
    osc.stop(actx.currentTime + 0.5);
  } catch (e) {
    console.log("Audio play failed, user interaction may be required.");
  }
};

const initialLogs = [
  { id: 1, text: "SYS: Fuzzy Logic Engine Initialized.", type: "normal" },
  { id: 2, text: "TRK: Object tracking normal in Sector 7G.", type: "normal" },
  { id: 3, text: "SENS: Atmospheric sensors operational.", type: "normal" }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [isAlert, setIsAlert] = useState(false);
  const [logs, setLogs] = useState(initialLogs);
  const logsEndRef = useRef(null);

  // Sync alert state with body class for the pulsing border effect
  useEffect(() => {
    if (isAlert) {
      document.body.classList.add('alert-mode');
    } else {
      document.body.classList.remove('alert-mode');
    }
    return () => document.body.classList.remove('alert-mode');
  }, [isAlert]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const triggerTestBreach = () => {
    playTacticalPing();
    setIsAlert(true);
    // Add critical log
    const newLog = {
      id: Date.now(),
      text: "CRITICAL: INTRUSION DETECTED - SECTOR 7",
      type: "critical"
    };
    setLogs(prev => [...prev, newLog]);

    // Auto reset alert after 8 seconds for demo purposes
    setTimeout(() => {
      setIsAlert(false);
      setLogs(prev => [...prev, { id: Date.now() + 1, text: "SYS: Alert cleared. Sector secured.", type: "safe" }]);
    }, 8000);
  };

  const threatData = [
    { time: '00:00', val: 12 }, { time: '04:00', val: 15 },
    { time: '08:00', val: 35 }, { time: '12:00', val: 22 },
    { time: '16:00', val: isAlert ? 95 : 18 }, { time: '20:00', val: isAlert ? 80 : 14 },
  ];

  return (
    <div className={`hud-container ${isAlert ? 'alert-mode' : ''}`}>

      {/* Top Navigation */}
      <motion.nav
        className="glass-panel nav-bar"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="corner-brackets" />
        <div className="hud-title">
          <Shield className="icon" size={28} />
          TRINETRA RAKSHAK
        </div>

        <div className="nav-links">
          {['DASHBOARD', 'BORDER-SENTRY', 'GEO-EYE', 'LOGS'].map(tab => (
            <button
              key={tab}
              className={`nav-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
          <button className="nav-btn btn-danger" onClick={triggerTestBreach}>
            [ TEST BREACH ]
          </button>
        </div>

        <div className="status-indicator">
          <div className="status-dot" style={{ backgroundColor: isAlert ? 'var(--danger)' : 'var(--safe)', boxShadow: `0 0 10px ${isAlert ? 'var(--danger)' : 'var(--safe)'}` }}></div>
          {isAlert ? <span style={{ color: 'var(--danger)' }}>DEFCON 1</span> : 'DEFENSE GRID ONLINE'}
        </div>
      </motion.nav>

      {/* Main Content Area */}
      <div className="main-content">

        {/* Dynamic View Area */}
        <div className="view-area">
          <AnimatePresence mode='wait'>

            {activeTab === 'DASHBOARD' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', height: '100%' }}
              >
                <div className="glass-panel">
                  <div className="corner-brackets" />
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', marginBottom: '1rem' }}><Activity size={20} /> SYSTEM STATUS</h3>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div className="stat-box">
                      <div><div className="label">ACTIVE SENSORS</div><div className="value">24/24</div></div>
                      <Radio size={32} color="var(--accent)" opacity={0.6} />
                    </div>
                    <div className="stat-box" style={{ borderColor: isAlert ? 'var(--danger)' : 'rgba(34,197,94,0.15)' }}>
                      <div><div className="label">THREAT LEVEL</div><div className="value" style={{ color: isAlert ? 'var(--danger)' : 'var(--safe)' }}>{isAlert ? 'CRITICAL' : 'LOW'}</div></div>
                      <AlertTriangle size={32} color={isAlert ? 'var(--danger)' : 'var(--safe)'} opacity={0.6} />
                    </div>
                  </div>
                </div>

                <div className="glass-panel">
                  <div className="corner-brackets" />
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', marginBottom: '1rem' }}><MapIcon size={20} /> THREAT VELOCITY</h3>
                  <div style={{ height: '200px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={threatData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 197, 94, 0.1)" />
                        <XAxis dataKey="time" stroke="var(--accent)" fontSize={11} />
                        <YAxis stroke="var(--accent)" fontSize={11} />
                        <Tooltip contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--accent)', color: 'var(--accent)' }} />
                        <Line type="stepAfter" dataKey="val" stroke={isAlert ? "var(--danger)" : "var(--accent)"} strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'BORDER-SENTRY' && (
              <motion.div
                key="bordersentry"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
                className="glass-panel"
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
              >
                <div className="corner-brackets" />
                <div style={{ position: 'absolute', top: 15, left: 15, color: 'var(--accent)', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Video size={16} /> LIVE FEED: SECTOR 7
                </div>
                <div style={{ width: '80%', height: '70%', border: '1px solid rgba(80,80,80,0.5)', position: 'relative', background: 'repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(34, 197, 94, 0.05) 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(34, 197, 94, 0.05) 20px)' }}>
                  {isAlert && (
                    <div className="crosshair-target" style={{ top: '40%', left: '50%' }}>
                      <Target size={24} color="var(--danger)" style={{ position: 'absolute', top: -30 }} />
                    </div>
                  )}
                  <Crosshair size={100} color="var(--accent)" strokeWidth={0.5} style={{ opacity: 0.2, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                </div>
              </motion.div>
            )}

            {activeTab === 'GEO-EYE' && (
              <motion.div
                key="geoeye"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="glass-panel"
                style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <div className="topo-bg" />
                <div className="corner-brackets" />
                <div style={{ position: 'absolute', top: 15, left: 15, color: 'var(--accent)', letterSpacing: '2px' }}>
                  SATELLITE TOPOGRAPHY
                </div>

                {/* Radar Container */}
                <div style={{ width: '300px', height: '300px', borderRadius: '50%', border: '1px solid rgba(34, 197, 94, 0.3)', position: 'relative', overflow: 'hidden' }}>
                  <div className="radar-sweep"></div>
                  <div style={{ position: 'absolute', width: '100%', height: '1px', background: 'rgba(34,197,94,0.3)', top: '50%' }}></div>
                  <div style={{ position: 'absolute', height: '100%', width: '1px', background: 'rgba(34,197,94,0.3)', left: '50%' }}></div>
                  {isAlert && <div style={{ position: 'absolute', width: 12, height: 12, background: 'var(--warning)', borderRadius: '50%', top: '60%', left: '70%', boxShadow: '0 0 15px var(--warning)', animation: 'pulse-crosshair 1s infinite' }} />}
                </div>
              </motion.div>
            )}

            {activeTab === 'LOGS' && (
              <motion.div key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-panel" style={{ flex: 1, overflowY: 'auto' }}>
                <div className="corner-brackets" />
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', marginBottom: '1rem' }}><Terminal size={20} /> FULL SYSTEM LOGS</h3>
                <div className="console-font">
                  {logs.map((log) => (
                    <div key={log.id} className={`log-entry ${log.type === 'critical' ? 'critical' : log.type === 'warning' ? 'warning' : ''}`}>
                      <span style={{ opacity: 0.6 }}>[{new Date(log.id).toISOString()}]</span> {log.text}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Right Alert Sidebar - Always visible, but highlights on alert */}
        <motion.div
          className="glass-panel alert-sidebar"
          animate={{
            borderColor: isAlert ? 'var(--warning)' : 'var(--glass-border)',
            boxShadow: isAlert ? '0 0 20px rgba(245, 158, 11, 0.2), inset 0 0 15px rgba(245, 158, 11, 0.1)' : '0 0 15px rgba(34, 197, 94, 0.1), inset 0 0 20px rgba(0,0,0,0.8)'
          }}
        >
          <div className="corner-brackets" />
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem', color: isAlert ? 'var(--warning)' : 'var(--accent)', textShadow: isAlert ? '0 0 5px rgba(245, 158, 11, 0.5)' : '0 0 5px var(--accent-glow)' }}>
            <Terminal size={18} /> ENGINE OUTPUT {isAlert && '- LOCK ON'}
          </h3>

          <div className="console-font" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflowY: 'auto' }}>
            <AnimatePresence>
              {logs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  className={`log-entry ${log.type === 'critical' ? 'critical' : log.type === 'warning' ? 'warning' : ''}`}
                  style={{
                    borderLeftColor: log.type === 'critical' ? 'var(--warning)' : (log.type === 'warning' ? 'var(--warning)' : 'var(--accent)'),
                    backgroundColor: log.type === 'critical' ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                    color: log.type === 'critical' ? 'var(--warning)' : 'inherit'
                  }}
                >
                  <TypewriterText text={log.text} speed={15} />
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={logsEndRef} />
          </div>
        </motion.div>

      </div>
    </div>
  );
}
