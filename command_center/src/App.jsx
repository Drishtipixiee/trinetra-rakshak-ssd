import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Activity, Crosshair, AlertTriangle,
  Map as MapIcon, Terminal, Video, Target, Radio, Train, Mountain, Scan
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Fuzzy Logic Engine (JS Simulation) ---
const calculateFuzzyRisk = (speed, distance) => {
  let risk = 0;
  // Distance Rules (closer = higher risk)
  if (distance <= 5) risk += 50;
  else if (distance <= 15) risk += 30;
  else if (distance <= 30) risk += 10;

  // Speed Rules (faster = higher risk)
  if (speed >= 60) risk += 50;
  else if (speed >= 40) risk += 30;
  else if (speed >= 20) risk += 10;

  risk = Math.min(100, Math.max(0, risk));

  let level = 'LOW';
  if (risk >= 80) level = 'CRITICAL';
  else if (risk >= 50) level = 'WARNING';

  return { score: risk, level };
};

// --- Subcomponents ---
const TypewriterText = ({ text, speed = 10, className = '' }) => {
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

const playTacticalPing = () => {
  try {
    const actx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, actx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, actx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.2, actx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(actx.destination);
    osc.start();
    osc.stop(actx.currentTime + 0.5);
  } catch (e) {
    console.log("Audio play failed");
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [logs, setLogs] = useState([{ id: 1, text: "[SYS] Fuzzy Engine Initialized. All subsystems green.", type: "normal" }]);
  const logsEndRef = useRef(null);

  // Simulation States
  const [simActive, setSimActive] = useState(false);
  const [simTick, setSimTick] = useState(0);

  // Sensors
  const [borderData, setBorderData] = useState({ distance: 50, speed: 10, riskScore: 0, level: 'LOW' });
  const [trackData, setTrackData] = useState({ detected: false, object: 'None', timeToImpact: 99 });
  const [geoData, setGeoData] = useState({ changedPixels: 0, scanning: false });
  const [threatHistory, setThreatHistory] = useState([{ time: '0s', val: 0 }]);

  // Global Alert State derived from Border Data
  const isAlert = borderData.level === 'CRITICAL';

  useEffect(() => {
    if (isAlert) document.body.classList.add('alert-mode');
    else document.body.classList.remove('alert-mode');
    return () => document.body.classList.remove('alert-mode');
  }, [isAlert]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const addLog = (text, type = 'normal') => {
    setLogs(prev => [...prev.slice(-49), { id: Date.now() + Math.random(), text, type }]);
  };

  // --- Main Simulation Loop ---
  useEffect(() => {
    let interval;
    if (simActive) {
      interval = setInterval(() => {
        setSimTick(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [simActive]);

  useEffect(() => {
    if (!simActive) return;

    // Simulate an approaching threat in Border-Sentry over 20 seconds
    if (simTick >= 2 && simTick <= 20) {
      const newSpeed = Math.min(85, borderData.speed + 4 + Math.random() * 5); // Accelerates up to 85km/h
      const newDistance = Math.max(2, borderData.distance - (newSpeed / 10)); // Distance drops

      const risk = calculateFuzzyRisk(newSpeed, newDistance);
      setBorderData({ distance: newDistance.toFixed(1), speed: newSpeed.toFixed(1), riskScore: risk.score, level: risk.level });

      setThreatHistory(prev => {
        const h = [...prev, { time: `${simTick}s`, val: risk.score }];
        return h.length > 10 ? h.slice(1) : h;
      });

      // Status logging
      if (simTick % 3 === 0 && risk.level === 'LOW') {
        addLog(`[SEC-7] Auto-Vehicle | Conf: 88% | Risk: ${risk.score} (LOW)`, 'normal');
      }

      if (risk.level === 'WARNING' && borderData.level === 'LOW') {
        addLog(`[SEC-7] UNKNOWN VEHICLE | Conf: 92% | Risk: ${risk.score} (WARNING) | Spd: ${newSpeed.toFixed(0)}km/h`, 'warning');
      }

      if (risk.level === 'CRITICAL' && borderData.level !== 'CRITICAL') {
        playTacticalPing();
        addLog(`[SEC-7] CRITICAL THREAT | Spd > 60 AND Dist < 5m | Risk: ${risk.score}`, 'critical');
      }
    }

    // Simulate Track Guard Obstruction at tick 8
    if (simTick === 8) {
      setTrackData({ detected: true, object: 'Wild Elephant', timeToImpact: 45 });
      addLog(`[TRK-2] WILDLIFE DETECTED | Class: Elephant | TTC: 45s | Conf: 96%`, 'warning');
    }
    if (simTick > 8 && trackData.detected) {
      setTrackData(prev => ({ ...prev, timeToImpact: Math.max(0, prev.timeToImpact - 1) }));
      if (simTick === 15) addLog(`[TRK-2] Auto-Brake Signal Sent to Train #12042`, 'normal');
    }

    // End simulation
    if (simTick > 25) {
      setSimActive(false);
      addLog("[SYS] Simulation complete. Resetting sensors.", "normal");
      setTimeout(() => {
        setSimTick(0);
        setBorderData({ distance: 50, speed: 10, riskScore: 0, level: 'LOW' });
        setTrackData({ detected: false, object: 'None', timeToImpact: 99 });
        setGeoData({ changedPixels: 0, scanning: false });
        setThreatHistory([{ time: '0s', val: 0 }]);
      }, 3000);
    }

  }, [simTick, simActive]);


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
          TRINETRA :: COMMAND
        </div>

        <div className="nav-links">
          {['DASHBOARD', 'BORDER-SENTRY', 'GEO-EYE', 'TRACK-GUARD'].map(tab => (
            <button
              key={tab}
              className={`nav-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
          <button
            className={`nav-btn ${simActive ? 'btn-danger' : 'btn-safe'}`}
            style={{ borderColor: simActive ? 'var(--warning)' : 'var(--safe)', color: simActive ? 'var(--warning)' : 'var(--safe)' }}
            onClick={() => !simActive && setSimActive(true)}
          >
            {simActive ? `[ SIM RUNNING: ${simTick}s ]` : '[ START SIMULATION ]'}
          </button>
        </div>

        <div className="status-indicator">
          <div className="status-dot" style={{ backgroundColor: isAlert ? 'var(--danger)' : 'white', boxShadow: `0 0 10px ${isAlert ? 'var(--danger)' : 'white'}` }}></div>
          {isAlert ? <span style={{ color: 'var(--danger)' }}>DEFCON 1 INTERVENTION REQUIRED</span> : 'DEFENSE GRID ONLINE'}
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
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="corner-brackets" />
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)' }}><Activity size={20} /> LOGIC ENGINE METRICS</h3>

                  <div className="stat-box" style={{ borderColor: isAlert ? 'var(--danger)' : 'rgba(34,197,94,0.15)' }}>
                    <div><div className="label">FUZZY RISK SCORE</div><div className="value" style={{ color: isAlert ? 'var(--danger)' : (borderData.level === 'WARNING' ? 'var(--warning)' : 'var(--accent)') }}>{borderData.riskScore}%</div></div>
                    <Activity size={32} color={isAlert ? 'var(--danger)' : 'var(--accent)'} />
                  </div>

                  <div className="stat-box">
                    <div><div className="label">TARGET SPEED</div><div className="value">{borderData.speed} KM/H</div></div>
                    <Target size={32} color="var(--accent)" />
                  </div>

                  <div className="stat-box">
                    <div><div className="label">TARGET DISTANCE</div><div className="value">{borderData.distance} M</div></div>
                    <Radio size={32} color="var(--accent)" />
                  </div>
                </div>

                <div className="glass-panel">
                  <div className="corner-brackets" />
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', marginBottom: '1rem' }}><MapIcon size={20} /> THREAT RISK GRAPH (0-100)</h3>
                  <div style={{ height: 'calc(100% - 3rem)' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={threatHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 197, 94, 0.1)" />
                        <XAxis dataKey="time" stroke="var(--accent)" fontSize={11} />
                        <YAxis domain={[0, 100]} stroke="var(--accent)" fontSize={11} />
                        <Tooltip contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--accent)', color: 'var(--accent)' }} />
                        <Line type="monotone" dataKey="val" stroke={isAlert ? "var(--danger)" : "var(--accent)"} strokeWidth={2} isAnimationActive={!!simActive} />
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
                style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
              >
                <div className="corner-brackets" />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--accent)', letterSpacing: '2px', zIndex: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Video size={16} /> LIVE INFERENCE: SEC-7</div>
                  {isAlert && <div className="blink-text" style={{ color: 'var(--danger)' }}>{"CRITICAL THREAT (SPEED > 60 & DIST < 5)"}</div>}
                </div>

                <div style={{ flex: 1, position: 'relative', border: '1px solid rgba(80,80,80,0.5)', backgroundColor: '#000', overflow: 'hidden' }}>
                  {/* Simulated Video Placeholder */}
                  <video
                    src="https://assets.mixkit.co/videos/preview/mixkit-curvy-road-on-a-tree-covered-hill-41537-large.mp4"
                    autoPlay loop muted playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6, filter: isAlert ? 'sepia(1) hue-rotate(-50deg) saturate(3)' : 'grayscale(0.5) contrast(1.2)' }}
                  />

                  {/* Inference Overlay: Bounding Box tracking a target */}
                  {simActive && simTick > 2 && (
                    <motion.div
                      className="bounding-box"
                      animate={{
                        width: 50 + (20 - borderData.distance) * 5,
                        height: 50 + (20 - borderData.distance) * 5,
                        x: 100 + (simTick * 10),
                        y: 100 + (simTick * 5)
                      }}
                      transition={{ type: 'tween', ease: 'linear', duration: 1 }}
                      style={{
                        position: 'absolute',
                        top: 0, left: 0,
                        border: `2px solid ${isAlert ? 'var(--danger)' : borderData.level === 'WARNING' ? 'var(--warning)' : 'var(--safe)'}`,
                        backgroundColor: isAlert ? 'rgba(220, 38, 38, 0.2)' : 'transparent',
                        display: 'flex', flexDirection: 'column'
                      }}
                    >
                      <div style={{ position: 'absolute', top: -25, left: -2, background: isAlert ? 'var(--danger)' : borderData.level === 'WARNING' ? 'var(--warning)' : 'var(--safe)', color: '#000', fontSize: '0.7rem', padding: '2px 6px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                        VEHICLE | {borderData.speed}km/h | Conf: 92%
                      </div>
                      {/* SVG Crosshairs inside the box */}
                      <div className="corner-brackets-inner" style={{ borderColor: isAlert ? 'var(--danger)' : 'var(--safe)' }}></div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'GEO-EYE' && (
              <motion.div
                key="geoeye"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="glass-panel"
                style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                <div className="topo-bg" />
                <div className="corner-brackets" />
                <div style={{ color: 'var(--accent)', letterSpacing: '2px', display: 'flex', justifyContent: 'space-between' }}>
                  <span><Scan size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> SATELLITE TOPOGRAPHY (MINING DETECTION)</span>
                  <button onClick={() => { setGeoData({ changedPixels: 14.5, scanning: true }); addLog('[GEO-EYE] Image Subtraction algorithm executed. 14.5% terrain change detected.', 'warning'); }} style={{ background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>[ RUN SCAN ]</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flex: 1 }}>
                  <div style={{ border: '1px solid rgba(34,197,94,0.3)', position: 'relative', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.8)', padding: '2px 5px', fontSize: '0.7rem' }}>T-0 (BASE)</span>
                    {/* Simulated terrain map SVG */}
                    <svg width="80%" height="80%" viewBox="0 0 100 100">
                      <path d="M10,50 Q30,20 50,50 T90,50" fill="transparent" stroke="var(--accent)" strokeWidth="2" opacity="0.5" />
                      <circle cx="40" cy="60" r="15" fill="none" stroke="#555" strokeWidth="2" />
                    </svg>
                  </div>
                  <div style={{ border: `1px solid ${geoData.scanning ? 'var(--warning)' : 'rgba(34,197,94,0.3)'}`, position: 'relative', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <span style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.8)', padding: '2px 5px', fontSize: '0.7rem' }}>T-1 (CURRENT)</span>
                    <svg width="80%" height="80%" viewBox="0 0 100 100">
                      <path d="M10,50 Q30,20 50,50 T90,50" fill="transparent" stroke="var(--accent)" strokeWidth="2" opacity="0.5" />
                      <circle cx="40" cy="60" r="25" fill="none" stroke="#555" strokeWidth="2" />
                      {geoData.scanning && (
                        <motion.circle initial={{ r: 0, opacity: 0 }} animate={{ r: 25, opacity: 0.6 }} transition={{ duration: 1 }} cx="40" cy="60" fill="var(--danger)" style={{ mixBlendMode: 'screen' }} />
                      )}
                    </svg>
                    {geoData.scanning && <div style={{ position: 'absolute', bottom: 10, right: 10, color: 'var(--danger)', fontWeight: 'bold' }}>{geoData.changedPixels}% CHANGE DETECTED</div>}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'TRACK-GUARD' && (
              <motion.div
                key="trackguard"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="glass-panel"
                style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
              >
                <div className="corner-brackets" />
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', marginBottom: '1rem' }}><Train size={20} /> TRACK-GUARD RAILWAY OVERWATCH</h3>

                <div style={{ flex: 1, display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 2, background: 'repeating-linear-gradient(90deg, #111, #111 40px, #222 40px, #222 42px)', position: 'relative', border: '1px solid rgba(80,80,80,0.5)', overflow: 'hidden' }}>
                    {/* Railway tracks simulation */}
                    <div style={{ position: 'absolute', top: '50%', width: '100%', height: '4px', background: '#444' }}></div>
                    <div style={{ position: 'absolute', top: '55%', width: '100%', height: '4px', background: '#444' }}></div>

                    {trackData.detected && (
                      <div style={{ position: 'absolute', left: '60%', top: '48%', background: 'var(--warning)', padding: '2px 8px', borderRadius: '4px', color: 'black', fontWeight: 'bold', zIndex: 10, animation: 'pulse 1s infinite' }}>
                        WILDLIFE ({trackData.object})
                      </div>
                    )}

                    {/* Train approaching */}
                    <motion.div
                      initial={{ left: '-10%' }}
                      animate={{ left: trackData.detected ? '40%' : '110%' }}
                      transition={{ duration: trackData.detected ? 8 : 15, ease: 'linear' }}
                      style={{ position: 'absolute', top: '45%', width: '60px', height: '30px', background: 'var(--accent)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', fontWeight: 'bold', fontSize: '10px' }}
                    >
                      TRN-12042
                    </motion.div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="stat-box" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <div className="label">OBSTRUCTION CLASS</div>
                      <div className="value" style={{ color: trackData.detected ? 'var(--warning)' : 'var(--safe)', fontSize: '1.2rem' }}>{trackData.object}</div>
                    </div>
                    <div className="stat-box" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <div className="label">TIME TO IMPACT</div>
                      <div className="value" style={{ color: trackData.timeToImpact < 50 ? 'var(--danger)' : 'var(--safe)' }}>{trackData.timeToImpact}s</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Right Alert Sidebar */}
        <motion.div
          className="glass-panel alert-sidebar"
          animate={{
            borderColor: isAlert ? 'var(--danger)' : 'var(--glass-border)',
            boxShadow: isAlert ? '0 0 20px rgba(220, 38, 38, 0.2), inset 0 0 15px rgba(220, 38, 38, 0.1)' : '0 0 15px rgba(34, 197, 94, 0.1), inset 0 0 20px rgba(0,0,0,0.8)'
          }}
        >
          <div className="corner-brackets" />
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem', color: isAlert ? 'var(--danger)' : 'var(--accent)', textShadow: isAlert ? '0 0 5px rgba(220, 38, 38, 0.5)' : '0 0 5px var(--accent-glow)' }}>
            <Terminal size={18} /> LIVE SYSTEM LOGS
          </h3>

          <div className="console-font" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
            <AnimatePresence initial={false}>
              {logs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20, height: 0 }} animate={{ opacity: 1, x: 0, height: 'auto' }}
                  className={`log-entry ${log.type === 'critical' ? 'critical' : log.type === 'warning' ? 'warning' : ''}`}
                  style={{ fontSize: '0.75rem', wordBreak: 'break-word' }}
                >
                  <TypewriterText text={log.text} speed={10} />
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
