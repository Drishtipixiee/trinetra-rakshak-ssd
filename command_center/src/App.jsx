import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Activity, Crosshair, AlertTriangle, Globe,
  Map as MapIcon, Terminal, Video, Target, Radio, Train, Mountain, Scan, Download
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

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

const translateToHindi = (text) => {
  if (!text) return "";
  let translated = text;
  translated = translated.replace("CRITICAL", "गंभीर");
  translated = translated.replace("WARNING", "चेतावनी");
  translated = translated.replace("SAFE", "सुरक्षित");
  translated = translated.replace("High-speed entity", "तेज गति वाली वस्तु");
  translated = translated.replace("critical proximity to Danger Zone", "खतरे के क्षेत्र के बेहद करीब");
  translated = translated.replace("approaching perimeter", "सीमा के पास आ रहा है");
  translated = translated.replace("low-visibility/stealth conditions", "कम दृश्यता/चुपके से");
  translated = translated.replace("Calculated Risk:", "अनुमानित जोखिम:");
  return translated;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [logs, setLogs] = useState([{ id: 1, text: "[SYS] Backend API Initialized. All subsystems green.", type: "normal" }]);
  const logsEndRef = useRef(null);

  // States
  const [isHindi, setIsHindi] = useState(false);
  const [simActive, setSimActive] = useState(false);
  const [simTick, setSimTick] = useState(0);

  // ROI State
  const [roiBox, setRoiBox] = useState(null);
  const [isDrawingROI, setIsDrawingROI] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });

  // Sensors
  const [borderData, setBorderData] = useState({ distance: 100, speed: 0, riskScore: 0, level: 'LOW', xai: '', threat: 'Unknown' });
  const [trackData, setTrackData] = useState({ detected: false, object: 'None', trainSpeed: 80, distance: 1000, timeToImpact: 99 });
  const [geoData, setGeoData] = useState({ changes: [], scanning: false });
  const [threatHistory, setThreatHistory] = useState([{ time: '0s', val: 0 }]);

  // Global Alert
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

  const handleGenerateReport = async () => {
    try {
      addLog("[SYS] Generating Official Incident Report...", "normal");
      const res = await axios.post('http://localhost:5000/api/generate_report', {
        threat_info: borderData.threat,
        sector: "SEC-7 (Border-Sentry)",
        risk_score: borderData.riskScore,
        gps: "Lat: 28.6139, Lon: 77.2090"
      }, { responseType: 'blob' });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `incident_report_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      addLog("[SYS] Report Downloaded Successfully.", "safe");
    } catch (err) {
      addLog(`[ERR] Failed to generate report: ${err.message}`, "critical");
    }
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

    // Simulate approaching threat in Border-Sentry over 20 ticks
    if (simTick >= 2 && simTick <= 20) {
      const newSpeed = Math.min(85, borderData.speed + 4 + Math.random() * 5); // Accelerates
      const newDistance = Math.max(10, borderData.distance - (newSpeed / 5)); // Distance drops

      // Call Backend API
      axios.post('http://localhost:5000/api/evaluate_threat', {
        velocity: newSpeed,
        proximity: newDistance,
        visibility: 30, // Low visibility for higher risk
        sensor: "Border-Sentry"
      }).then(res => {
        const { risk_score, xai_reasoning, threat_class } = res.data;
        const level = risk_score >= 70 ? 'CRITICAL' : risk_score >= 40 ? 'WARNING' : 'LOW';

        setBorderData({
          distance: newDistance.toFixed(1),
          speed: newSpeed.toFixed(1),
          riskScore: risk_score,
          level: level,
          xai: xai_reasoning,
          threat: threat_class
        });

        setThreatHistory(prev => {
          const h = [...prev, { time: `${simTick}s`, val: risk_score }];
          return h.length > 10 ? h.slice(1) : h;
        });

        // Logs based on level triggers
        if (level === 'CRITICAL' && borderData.level !== 'CRITICAL') {
          playTacticalPing();
          addLog(`[SEC-7] CRITICAL THREAT: ${threat_class} | Risk: ${risk_score}%`, 'critical');
        } else if (level === 'WARNING' && borderData.level === 'LOW') {
          addLog(`[SEC-7] UNKNOWN THREAT | Conf: 92% | Risk: ${risk_score}% | Spd: ${newSpeed.toFixed(0)}km/h`, 'warning');
        } else if (simTick % 5 === 0 && level === 'LOW') {
          addLog(`[SEC-7] Auto-Scan | Conf: 88% | Risk: ${risk_score}% (LOW)`, 'normal');
        }
      }).catch(err => {
        console.error("API Error", err);
      });
    }

    // Simulate Track Guard Obstruction at tick 5
    if (simTick === 5) {
      // Train is at 1000m, speed 80km/h = ~22 m/s. ETI = Distance / Speed
      const speedMs = 80 * (5 / 18);
      const eti = Math.round(1000 / speedMs);

      setTrackData({ detected: true, object: 'Wild Elephant', trainSpeed: 80, distance: 1000, timeToImpact: eti });
      addLog(`[TRK-2] WILDLIFE DETECTED | Class: Elephant | Distance: 1000m`, 'warning');
    }

    // Track Guard ETI updates
    if (simTick > 5 && trackData.detected) {
      setTrackData(prev => {
        const speedMs = prev.trainSpeed * (5 / 18);
        const newDist = Math.max(0, prev.distance - speedMs);
        const currentEti = Math.round(newDist / speedMs);

        if (simTick === 12) addLog(`[TRK-2] Auto-Brake Signal Sent to Train #12042`, 'normal');
        if (simTick === 15) {
          // Train slowing down
          return { ...prev, trainSpeed: 30, distance: newDist, timeToImpact: Math.round(newDist / (30 * (5 / 18))) };
        }
        return { ...prev, distance: newDist, timeToImpact: currentEti };
      });
    }

    // End simulation
    if (simTick > 25) {
      setSimActive(false);
      addLog("[SYS] Simulation complete. Resetting sensors.", "normal");
      setTimeout(() => {
        setSimTick(0);
        setBorderData({ distance: 100, speed: 0, riskScore: 0, level: 'LOW', xai: '', threat: 'Unknown' });
        setTrackData({ detected: false, object: 'None', trainSpeed: 80, distance: 1000, timeToImpact: 99 });
        setGeoData({ changes: [], scanning: false });
        setThreatHistory([{ time: '0s', val: 0 }]);
        setRoiBox(null);
      }, 3000);
    }
  }, [simTick, simActive]);

  // --- Handlers for ROI Drawing ---
  const startDrawROI = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDrawStart({ x, y });
    setIsDrawingROI(true);
    setRoiBox({ x, y, w: 0, h: 0 });
  };

  const drawROI = (e) => {
    if (!isDrawingROI) return;
    const rect = e.target.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    setRoiBox({
      x: Math.min(drawStart.x, currentX),
      y: Math.min(drawStart.y, currentY),
      w: Math.abs(currentX - drawStart.x),
      h: Math.abs(currentY - drawStart.y)
    });
  };

  const endDrawROI = () => {
    setIsDrawingROI(false);
    if (roiBox && roiBox.w > 20) {
      addLog(`[SEC-7] Virtual ROI Zone Established at [${roiBox.x.toFixed(0)}, ${roiBox.y.toFixed(0)}]`, "safe");
    } else {
      setRoiBox(null); // Too small
    }
  };

  // Handlers for Geo-Eye Scan
  const triggerGeoScan = () => {
    setGeoData({ changes: [], scanning: true });
    addLog('[GEO-EYE] Image Subtraction algorithm started...', 'normal');

    // Mocking terrain changes detection over 2 seconds
    setTimeout(() => {
      const changes = [
        { top: '30%', left: '40%', size: '40px', risk: 85 }, // Illegal Mining pit
        { top: '60%', left: '70%', size: '20px', risk: 60 }
      ];
      setGeoData({ changes, scanning: false });
      addLog(`[GEO-EYE] Scan Complete. Detected ${changes.length} irregular terrain variances (Suspected Mining).`, 'warning');
    }, 2000);
  };


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
            className={`nav-btn btn-safe`}
            style={{ padding: '0.2rem 0.5rem', marginLeft: '1rem', borderColor: isHindi ? 'var(--accent)' : 'gray', color: isHindi ? 'var(--accent)' : 'gray' }}
            onClick={() => setIsHindi(!isHindi)}
          >
            {isHindi ? 'हिंदी' : 'ENG'}
          </button>

          <button
            className={`nav-btn ${simActive ? 'btn-danger' : 'btn-safe'}`}
            style={{ borderColor: simActive ? 'var(--warning)' : 'var(--safe)', color: simActive ? 'var(--warning)' : 'var(--safe)', marginLeft: '1rem' }}
            onClick={() => !simActive && setSimActive(true)}
          >
            {simActive ? `[ SIM RUNNING: ${simTick}s ]` : '[ START SIMULATION ]'}
          </button>
        </div>

        <div className="status-indicator" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isAlert && (
            <button onClick={handleGenerateReport} className="nav-btn btn-danger" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Download size={14} /> DISPATCH PDF
            </button>
          )}
          <div className="status-dot" style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: isAlert ? 'var(--danger)' : 'var(--safe)', boxShadow: `0 0 10px ${isAlert ? 'var(--danger)' : 'var(--safe)'}` }}></div>
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

                  {borderData.xai && (
                    <div style={{ marginTop: 'auto', padding: '1rem', background: 'rgba(0,0,0,0.5)', borderLeft: `3px solid ${isAlert ? 'var(--danger)' : 'var(--warning)'}` }}>
                      <div className="label" style={{ fontSize: '0.7rem', color: 'gray', marginBottom: '0.5rem' }}>EXPLAINABLE AI REASONING (XAI):</div>
                      <div style={{ fontStyle: 'italic', fontSize: '1rem', color: 'var(--text-main)' }}>
                        {isHindi ? translateToHindi(borderData.xai) : borderData.xai}
                      </div>
                    </div>
                  )}
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
                  <div style={{ fontSize: '0.8rem', color: 'gray' }}>[ DRAG MOUSE ON VIDEO TO DRAW VIRTUAL R.O.I ]</div>
                  {isAlert && <div className="blink-text" style={{ color: 'var(--danger)' }}>CRITICAL THREAT: {borderData.threat}</div>}
                </div>

                <div
                  style={{ flex: 1, position: 'relative', border: '1px solid rgba(80,80,80,0.5)', backgroundColor: '#000', overflow: 'hidden', cursor: 'crosshair' }}
                  onMouseDown={startDrawROI}
                  onMouseMove={drawROI}
                  onMouseUp={endDrawROI}
                  onMouseLeave={endDrawROI}
                >
                  <video
                    src="https://assets.mixkit.co/videos/preview/mixkit-curvy-road-on-a-tree-covered-hill-41537-large.mp4"
                    autoPlay loop muted playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6, filter: isAlert ? 'sepia(1) hue-rotate(-50deg) saturate(3)' : 'grayscale(0.5) contrast(1.2)', pointerEvents: 'none' }}
                  />

                  {/* Manual ROI Rendering */}
                  {roiBox && (
                    <div style={{
                      position: 'absolute',
                      top: roiBox.y, left: roiBox.x,
                      width: roiBox.w, height: roiBox.h,
                      border: '2px dashed var(--safe)',
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      pointerEvents: 'none'
                    }}>
                      <span style={{ position: 'absolute', top: '-20px', left: 0, color: 'var(--safe)', fontSize: '0.7rem', fontWeight: 'bold' }}>NO-GO ZONE</span>
                    </div>
                  )}

                  {/* Inference Target Overlay */}
                  {simActive && simTick > 2 && (
                    <motion.div
                      className="bounding-box"
                      animate={{
                        width: 50 + (100 - borderData.distance) * 2,
                        height: 50 + (100 - borderData.distance) * 2,
                        x: 100 + (simTick * 15),
                        y: 100 + (simTick * 6)
                      }}
                      transition={{ type: 'tween', ease: 'linear', duration: 1 }}
                      style={{
                        position: 'absolute',
                        top: 0, left: 0,
                        border: `2px solid ${isAlert ? 'var(--danger)' : borderData.level === 'WARNING' ? 'var(--warning)' : 'var(--safe)'}`,
                        backgroundColor: isAlert ? 'rgba(220, 38, 38, 0.2)' : 'transparent',
                        display: 'flex', flexDirection: 'column',
                        pointerEvents: 'none'
                      }}
                    >
                      <div style={{ position: 'absolute', top: -25, left: -2, background: isAlert ? 'var(--danger)' : borderData.level === 'WARNING' ? 'var(--warning)' : 'var(--safe)', color: '#000', fontSize: '0.7rem', padding: '2px 6px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                        {borderData.threat} | {borderData.speed}km/h
                      </div>
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
                  <span><Scan size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> SATELLITE TERRAIN HEATMAP (MINING DETECTION)</span>
                  <button onClick={triggerGeoScan} disabled={geoData.scanning} style={{ background: geoData.scanning ? 'var(--warning)' : 'transparent', border: '1px solid var(--accent)', color: geoData.scanning ? 'black' : 'var(--accent)', padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {geoData.scanning ? '[ SCANNING... ]' : '[ RUN SUBTRACTION SCAN ]'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flex: 1 }}>
                  <div style={{ border: '1px solid rgba(34,197,94,0.3)', position: 'relative', background: 'url(https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800) center/cover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,10,0,0.6)' }} />
                    <span style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.8)', padding: '2px 5px', fontSize: '0.7rem' }}>T-0 (BASE)</span>
                  </div>

                  <div style={{ border: `1px solid ${geoData.scanning ? 'var(--warning)' : 'rgba(34,197,94,0.3)'}`, position: 'relative', background: 'url(https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800) center/cover', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,10,0,0.6)' }} />

                    <span style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.8)', padding: '2px 5px', fontSize: '0.7rem' }}>T-1 (WITH HEATMAP)</span>

                    {/* Overlay Heatmap Changes */}
                    {geoData.changes.map((change, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [1, 1.2, 1], opacity: 0.8 }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        style={{
                          position: 'absolute',
                          top: change.top, left: change.left,
                          width: change.size, height: change.size,
                          borderRadius: '50%',
                          backgroundColor: 'red',
                          filter: 'blur(10px)',
                          boxShadow: '0 0 20px 10px red'
                        }}
                      />
                    ))}

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

                    <div style={{ position: 'absolute', top: '50%', width: '100%', height: '4px', background: '#444' }}></div>
                    <div style={{ position: 'absolute', top: '55%', width: '100%', height: '4px', background: '#444' }}></div>

                    {trackData.detected && (
                      <div style={{ position: 'absolute', left: '70%', top: '48%', background: 'var(--warning)', padding: '2px 8px', borderRadius: '4px', color: 'black', fontWeight: 'bold', zIndex: 10, animation: 'pulse 1s infinite' }}>
                        OBSTRUCTION ({trackData.object})
                      </div>
                    )}

                    {/* Train approaching */}
                    <motion.div
                      animate={{ left: trackData.detected ? '50%' : '110%' }}
                      transition={{ duration: 15, ease: 'linear' }}
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
                      <div className="label">TRAIN DISTANCE / SPEED</div>
                      <div className="value" style={{ color: 'var(--warning)', fontSize: '1.2rem' }}>{Math.round(trackData.distance)}m / {trackData.trainSpeed}km/h</div>
                    </div>
                    <div className="stat-box" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <div className="label">EST. TIME TO IMPACT (ETI)</div>
                      <div className="value" style={{ color: trackData.timeToImpact < 20 ? 'var(--danger)' : 'var(--safe)' }}>{trackData.timeToImpact}s</div>
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
