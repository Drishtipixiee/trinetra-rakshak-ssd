/* eslint-disable react/prop-types */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Activity, AlertTriangle, Fingerprint, Lock,
  Map as MapIcon, Video, Target, Radio, Scan, Train, Download, Terminal,
  BarChart3, Eye, Users, Play, Square, Volume2, VolumeX
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';

// AI Systems
import AIVoiceSystem, { playSiren, playKlaxon, playDetectionBeep, playSuccessChime } from './components/AIVoiceSystem';

// Components
import LiveClock from './components/LiveClock';
import SystemVitals from './components/SystemVitals';
import CCTVGrid from './components/CCTVGrid';
import IncidentTimeline from './components/IncidentTimeline';
import NotificationToast from './components/NotificationToast';
import PersonnelRoster from './components/PersonnelRoster';
import QuickActions from './components/QuickActions';
import WeatherWidget from './components/WeatherWidget';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import NightVisionToggle from './components/NightVisionToggle';
import WalkieTalkie from './components/WalkieTalkie';
import MobileAlert from './components/MobileAlert';

// ═══════════════════════════════════════════════════
//  SOFTWARE SIMULATION ENGINE
//  No external AI model needed — generates realistic
//  detection events based on scenario scripts
// ═══════════════════════════════════════════════════

const DETECTION_SCENARIOS = [
  // Phase 1: Calm (0-10s)
  { time: [0, 10], detections: [], label: 'SCANNING' },
  // Phase 2: First sighting (10-18s)
  {
    time: [10, 18], detections: [
      { class: 'person', confidence: 72, x: 60, y: 35, w: 12, h: 28, risk: 45 }
    ], label: 'CONTACT'
  },
  // Phase 3: Approaching (18-28s)
  {
    time: [18, 28], detections: [
      { class: 'person', confidence: 87, x: 45, y: 25, w: 15, h: 35, risk: 68 },
      { class: 'backpack', confidence: 61, x: 48, y: 30, w: 6, h: 8, risk: 30 }
    ], label: 'TRACKING'
  },
  // Phase 4: Critical zone (28-38s)
  {
    time: [28, 38], detections: [
      { class: 'person', confidence: 94, x: 35, y: 18, w: 20, h: 45, risk: 88 },
      { class: 'person', confidence: 78, x: 65, y: 30, w: 14, h: 32, risk: 72 },
    ], label: 'MULTI-TARGET'
  },
  // Phase 5: De-escalation (38-48s)
  {
    time: [38, 48], detections: [
      { class: 'person', confidence: 65, x: 70, y: 40, w: 10, h: 25, risk: 35 }
    ], label: 'RETREATING'
  },
  // Phase 6: Clear (48-60s)
  { time: [48, 60], detections: [], label: 'ALL CLEAR' },
];

const TRACK_SCENARIO = [
  { time: [0, 8], detected: false, object: 'None', trainSpeed: 80, distance: 2000, action: null },
  { time: [8, 12], detected: true, object: 'Wild Elephant', trainSpeed: 80, distance: 1200, action: 'WILDLIFE DETECTED on track KM-142. Class: Elephant.' },
  { time: [12, 18], detected: true, object: 'Wild Elephant', trainSpeed: 80, distance: 800, action: null },
  { time: [18, 22], detected: true, object: 'Wild Elephant', trainSpeed: 45, distance: 500, action: 'Auto-brake signal transmitted to Train #12042 Rajdhani Express.' },
  { time: [22, 28], detected: true, object: 'Wild Elephant', trainSpeed: 15, distance: 200, action: 'Train decelerating. Elephant moving off track.' },
  { time: [28, 35], detected: false, object: 'None (Cleared)', trainSpeed: 30, distance: 150, action: 'Track cleared. Resuming normal speed.' },
  { time: [35, 60], detected: false, object: 'None', trainSpeed: 80, distance: 2000, action: null },
];

function useSimulationEngine(isActive) {
  const [tick, setTick] = useState(0);
  const [phase, setPhase] = useState(DETECTION_SCENARIOS[0]);
  const [trackPhase, setTrackPhase] = useState(TRACK_SCENARIO[0]);

  useEffect(() => {
    if (!isActive) { setTick(0); return; }
    const timer = setInterval(() => setTick(t => (t + 1) % 60), 1000);
    return () => clearInterval(timer);
  }, [isActive]);

  useEffect(() => {
    const currentPhase = DETECTION_SCENARIOS.find(s => tick >= s.time[0] && tick < s.time[1]);
    if (currentPhase) setPhase(currentPhase);

    const currentTrack = TRACK_SCENARIO.find(s => tick >= s.time[0] && tick < s.time[1]);
    if (currentTrack) setTrackPhase(currentTrack);
  }, [tick]);

  return { tick, phase, trackPhase };
}

// ─── Canvas Renderer for simulated detections ───
function drawSimulatedDetections(canvas, detections, tick) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Subtle movement noise based on tick
  const jitter = () => (Math.sin(tick * 0.7 + Math.random()) * 2);

  detections.forEach(det => {
    const x = (det.x / 100) * W + jitter();
    const y = (det.y / 100) * H + jitter();
    const w = (det.w / 100) * W;
    const h = (det.h / 100) * H;
    const conf = det.confidence + Math.floor(Math.random() * 4 - 2);
    const label = `${det.class} ${Math.min(99, Math.max(50, conf))}%`;

    const color = det.risk > 70 ? '#ef4444' : det.risk > 40 ? '#f59e0b' : '#22c55e';

    // Main bounding box
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.strokeRect(x, y, w, h);

    // Corner brackets (tactical look)
    const cl = Math.min(w, h) * 0.25;
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
    // Top-left
    ctx.beginPath(); ctx.moveTo(x, y + cl); ctx.lineTo(x, y); ctx.lineTo(x + cl, y); ctx.stroke();
    // Top-right
    ctx.beginPath(); ctx.moveTo(x + w - cl, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + cl); ctx.stroke();
    // Bottom-left
    ctx.beginPath(); ctx.moveTo(x, y + h - cl); ctx.lineTo(x, y + h); ctx.lineTo(x + cl, y + h); ctx.stroke();
    // Bottom-right
    ctx.beginPath(); ctx.moveTo(x + w - cl, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cl); ctx.stroke();

    // Label
    ctx.font = '13px "Share Tech Mono"';
    const textW = ctx.measureText(label).width + 10;
    ctx.fillStyle = color;
    ctx.fillRect(x, y - 20, textW, 18);
    ctx.fillStyle = '#000';
    ctx.fillText(label, x + 5, y - 6);

    // Risk bar below box
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x, y + h + 4, w, 6);
    ctx.fillStyle = color;
    ctx.fillRect(x, y + h + 4, w * (det.risk / 100), 6);
  });

  // Scan line effect
  const scanY = (tick * 8) % H;
  ctx.fillStyle = 'rgba(34, 197, 94, 0.04)';
  ctx.fillRect(0, scanY, W, 4);

  // Crosshair center
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.15)';
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 4]);
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
  ctx.setLineDash([]);
}

// ─── Typewriter ───
const TypewriterText = ({ text, speed = 8 }) => {
  const [displayedText, setDisplayedText] = useState('');
  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) { setDisplayedText(prev => prev + text.charAt(i)); i++; }
      else clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return <span>{displayedText}{displayedText.length < text.length && <span className="typewriter-cursor" />}</span>;
};

// ─── Login ───
const LoginOverlay = ({ onLogin }) => {
  const [status, setStatus] = useState('AWAITING');

  const handleAuth = async () => {
    try {
      setStatus('GENERATING');
      await window.crypto.subtle.generateKey(
        { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
        true, ["encrypt", "decrypt"]
      );
      setStatus('VERIFIED');
      setTimeout(() => { setStatus('SUCCESS'); setTimeout(onLogin, 600); }, 800);
    } catch { setStatus('DENIED'); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, rgba(5,20,5,0.97) 0%, #020502 100%)',
    }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{
          width: 420, display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '2.5rem 2rem',
          background: 'rgba(5,12,5,0.8)', backdropFilter: 'blur(20px)',
          border: `1px solid ${status === 'SUCCESS' ? 'var(--safe)' : 'var(--glass-border)'}`,
          borderRadius: 16,
          boxShadow: `0 0 60px ${status === 'SUCCESS' ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.08)'}`,
          transition: 'all 0.5s ease'
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', filter: 'drop-shadow(0 0 10px var(--accent-glow))' }}>🛡️</div>

        <motion.div
          animate={status === 'GENERATING' || status === 'VERIFIED' ? { scale: [1, 1.08, 1], opacity: [0.5, 1, 0.5] } : {}}
          transition={{ repeat: Infinity, duration: 1.2 }}
          style={{ marginBottom: '0.8rem', color: status === 'SUCCESS' ? 'var(--safe)' : 'var(--accent)' }}
        >
          {status === 'SUCCESS' ? <Lock size={48} /> : <Fingerprint size={48} />}
        </motion.div>

        <h2 style={{ fontSize: '1.2rem', color: status === 'SUCCESS' ? 'var(--safe)' : 'var(--accent)', letterSpacing: 4, margin: '0 0 0.2rem' }}>
          TRINETRA COMMAND
        </h2>
        <div style={{ fontSize: '0.55rem', color: 'var(--text-dim)', letterSpacing: 3, marginBottom: '0.4rem' }}>
          MINISTRY OF DEFENCE — BHARAT
        </div>

        <div style={{ fontSize: '0.7rem', color: 'var(--accent)', opacity: 0.7, letterSpacing: 2, marginBottom: '1.5rem', height: '1rem', fontFamily: "'Share Tech Mono'" }}>
          {status === 'AWAITING' && 'BIOMETRIC GATEWAY LOCKED'}
          {status === 'GENERATING' && 'GENERATING RSA-2048 KEY...'}
          {status === 'VERIFIED' && 'PUBLIC-KEY HANDSHAKE VERIFIED'}
          {status === 'SUCCESS' && <span style={{ color: 'var(--safe)' }}>CDR. DRISHTI MISHRA — AUTHENTICATED</span>}
        </div>

        {status === 'AWAITING' && (
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleAuth}
            className="nav-btn"
            style={{ width: '100%', padding: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, fontSize: '0.8rem' }}
          >
            <Scan size={18} /> INITIATE BIOMETRIC SCAN
          </motion.button>
        )}
      </motion.div>
    </div>
  );
};

// ─── Tabs ───
const TABS = [
  { id: 'LIVE', icon: Video, label: 'LIVE FEED' },
  { id: 'CCTV', icon: Users, label: 'CCTV' },
  { id: 'GEO-EYE', icon: MapIcon, label: 'GEO-EYE' },
  { id: 'TRACK-GUARD', icon: Train, label: 'TRACK' },
  { id: 'ANALYTICS', icon: BarChart3, label: 'ANALYTICS' },
];

// ════════════════════════════════════════
//  MAIN APP
// ════════════════════════════════════════

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('LIVE');
  const [logs, setLogs] = useState([{ id: 1, text: "[SYS] All subsystems initialized. Defense grid online.", type: "normal" }]);
  const logsEndRef = useRef(null);

  const canvasRef = useRef(null);

  // Modes
  const [isNightMode, setIsNightMode] = useState(false);
  const [walkieOpen, setWalkieOpen] = useState(false);
  const [simActive, setSimActive] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // AI Voice
  const voiceRef = useRef(null);
  useEffect(() => {
    voiceRef.current = new AIVoiceSystem();
    return () => voiceRef.current?.destroy();
  }, []);

  // Simulation engine
  const { tick, phase, trackPhase } = useSimulationEngine(simActive);

  // Detection state
  const [detectionData, setDetectionData] = useState({
    objectCount: 0, personCount: 0, maxConfidence: 0,
    primaryClass: 'None', threatLevel: 'LOW', riskScore: 0, label: 'IDLE'
  });

  // Track data from simulation
  const [trackData, setTrackData] = useState({ detected: false, object: 'None', trainSpeed: 80, distance: 2000, timeToImpact: 99 });
  const [geoData, setGeoData] = useState({ changes: [], scanning: false });
  const [threatHistory, setThreatHistory] = useState([{ time: '00:00', val: 0 }]);

  const prevThreatRef = useRef('LOW');
  const prevTrackRef = useRef(false);

  const isAlert = detectionData.threatLevel === 'CRITICAL';

  // ─── Night Vision ───
  useEffect(() => {
    document.body.classList.toggle('night-mode', isNightMode);
    return () => document.body.classList.remove('night-mode');
  }, [isNightMode]);

  // ─── Alert Mode ───
  useEffect(() => {
    document.body.classList.toggle('alert-mode', isAlert);
    return () => document.body.classList.remove('alert-mode');
  }, [isAlert]);

  // ─── Auto-scroll ───
  useEffect(() => {
    if (logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = useCallback((text, type = 'normal') => {
    setLogs(prev => [...prev.slice(-30), { id: Date.now() + Math.random(), text, type }]);
  }, []);

  // ═══ MAIN SIMULATION EFFECT ═══
  useEffect(() => {
    if (!simActive) return;

    const dets = phase.detections;
    const maxRisk = dets.length > 0 ? Math.max(...dets.map(d => d.risk)) : 0;
    const personCount = dets.filter(d => d.class === 'person').length;
    const maxConf = dets.length > 0 ? Math.max(...dets.map(d => d.confidence)) : 0;
    const primary = personCount > 0 ? 'PERSON' : dets.length > 0 ? dets[0].class.toUpperCase() : 'None';
    const threatLevel = maxRisk > 70 ? 'CRITICAL' : maxRisk > 35 ? 'WARNING' : 'LOW';

    setDetectionData({
      objectCount: dets.length, personCount, maxConfidence: maxConf,
      primaryClass: primary, threatLevel, riskScore: maxRisk, label: phase.label
    });

    // Log + AI Voice on threat level change
    if (threatLevel !== prevThreatRef.current) {
      if (threatLevel === 'CRITICAL') {
        playSiren(1500);
        addLog(`[SEC-7] ⚠ CRITICAL: ${personCount} hostile(s) detected | Risk: ${maxRisk}% | AI Confidence: ${maxConf}%`, 'critical');
        if (voiceRef.current && voiceEnabled) {
          voiceRef.current.speak(`Critical alert. ${personCount} hostile detected in Sector 7 Alpha. Risk score ${maxRisk} percent. Quick Reaction Force has been alerted. All units respond immediately.`, 'critical');
        }
      } else if (threatLevel === 'WARNING') {
        playDetectionBeep();
        addLog(`[SEC-7] WARNING: Movement detected — ${primary} | Risk: ${maxRisk}% | Tracking...`, 'warning');
        if (voiceRef.current && voiceEnabled) {
          voiceRef.current.speak(`Warning. Unidentified ${primary.toLowerCase()} detected approaching perimeter. Risk level ${maxRisk} percent. Tracking in progress.`);
        }
      } else if (prevThreatRef.current !== 'LOW') {
        playSuccessChime();
        addLog(`[SEC-7] ✓ Threat cleared. Sector secure. Resuming surveillance.`, 'normal');
        if (voiceRef.current && voiceEnabled) {
          voiceRef.current.speak('All clear. Threat has been neutralized. Resuming normal surveillance operations.');
        }
      }
      prevThreatRef.current = threatLevel;
    }

    // Track guard updates
    const tp = trackPhase;
    const speedMs = tp.trainSpeed * (5 / 18);
    const eti = speedMs > 0 ? Math.round(tp.distance / speedMs) : 99;
    setTrackData({ detected: tp.detected, object: tp.object, trainSpeed: tp.trainSpeed, distance: tp.distance, timeToImpact: eti });

    if (tp.action && tp.detected !== prevTrackRef.current) {
      addLog(`[TRK-2] ${tp.action}`, tp.detected ? 'warning' : 'normal');
      if (tp.detected && voiceRef.current && voiceEnabled) {
        playKlaxon();
        voiceRef.current.speak(`Track Guard alert. ${tp.object} detected on railway track Kilo Mike 142. Auto brake signal transmitted to Train 12042 Rajdhani Express.`, 'critical');
      }
    }
    prevTrackRef.current = tp.detected;

    // Update threat history every 3 ticks
    if (tick % 3 === 0) {
      const timeStr = new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }).slice(3, 8);
      setThreatHistory(prev => {
        const h = [...prev, { time: timeStr, val: maxRisk }];
        return h.length > 20 ? h.slice(1) : h;
      });
    }

    // Draw detections on canvas
    if (canvasRef.current) {
      canvasRef.current.width = canvasRef.current.parentElement?.clientWidth || 960;
      canvasRef.current.height = canvasRef.current.parentElement?.clientHeight || 540;
      drawSimulatedDetections(canvasRef.current, dets, tick);
    }

  }, [tick, simActive, phase, trackPhase, addLog]);

  // Reset when sim stops
  useEffect(() => {
    if (!simActive) {
      setDetectionData({ objectCount: 0, personCount: 0, maxConfidence: 0, primaryClass: 'None', threatLevel: 'LOW', riskScore: 0, label: 'IDLE' });
      prevThreatRef.current = 'LOW';
      prevTrackRef.current = false;
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, [simActive]);

  // ─── Geo Scan ───
  const triggerGeoScan = () => {
    setGeoData({ changes: [], scanning: true });
    addLog('[GEO-EYE] Terrain subtraction scan initiated on Jharkhand mining corridor [23.6102, 85.2799]...', 'normal');
    setTimeout(() => {
      setGeoData({
        changes: [
          { lat: 23.6152, lng: 85.2859, radius: 400, risk: 85 },
          { lat: 23.6052, lng: 85.2719, radius: 250, risk: 60 },
          { lat: 23.6200, lng: 85.2900, radius: 180, risk: 45 }
        ], scanning: false
      });
      addLog(`[GEO-EYE] 3 terrain anomalies detected — suspected illegal mining & deforestation.`, 'warning');
    }, 2500);
  };

  // ─── Pre-auth ───
  if (!isAuthenticated) {
    return <LoginOverlay onLogin={() => {
      setIsAuthenticated(true);
      addLog("[SYS] ✓ Officer Drishti Mishra authenticated — Sector 7 access granted.", "safe");
      addLog("[SYS] Software simulation engine ready. Press START to begin live scenario.", "normal");
    }} />;
  }

  // ════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════

  return (
    <div className={`hud-container ${isAlert ? 'alert-mode' : ''}`}>

      {/* Floating elements */}
      <NotificationToast logs={logs} />
      <MobileAlert threatLevel={detectionData.threatLevel} riskScore={detectionData.riskScore} threatClass={detectionData.primaryClass} />
      <WalkieTalkie isOpen={walkieOpen} onToggle={() => setWalkieOpen(!walkieOpen)} threatLevel={detectionData.threatLevel} detectedClass={detectionData.primaryClass} />

      {/* Classification Banner */}
      <div className="classification-banner">
        CONFIDENTIAL — MINISTRY OF DEFENCE — GOVT OF INDIA — AUTHORIZED PERSONNEL ONLY
      </div>

      {/* Header */}
      <div className="top-header">
        <div className="header-left">
          <div className="header-emblem">🛡️</div>
          <div className="header-title-group">
            <div className="header-title"><Shield size={16} /> TRINETRA RAKSHAK</div>
            <div className="header-subtitle">INTEGRATED COMMAND & CONTROL — SECTOR 7</div>
          </div>
        </div>
        <div className="header-right">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="status-pulse-ring" style={{ backgroundColor: isAlert ? 'var(--danger)' : 'var(--safe)', color: isAlert ? 'var(--danger)' : 'var(--safe)' }} />
            <span style={{ fontFamily: "'Share Tech Mono'", fontSize: '0.65rem', color: isAlert ? 'var(--danger)' : 'var(--safe)', letterSpacing: 1 }}>
              {isAlert ? 'THREAT DETECTED' : 'ALL CLEAR'}
            </span>
          </div>
          <LiveClock />
        </div>
      </div>

      {/* ── 2-Column Grid ── */}
      <div className="main-grid">

        {/* ═══ MAIN VIEWPORT ═══ */}
        <div className="main-viewport">
          {/* Tab bar */}
          <div className="tab-bar">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                  <Icon size={12} /> {tab.label}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">

            {/* ── LIVE FEED ── */}
            {activeTab === 'LIVE' && (
              <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="live-feed-container"
              >
                {/* Simulated camera background */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: simActive
                    ? 'radial-gradient(ellipse at 40% 50%, rgba(15,25,15,0.95), rgba(5,10,5,1))'
                    : 'radial-gradient(ellipse at center, rgba(10,15,10,0.7), rgba(3,5,3,1))',
                  transition: 'background 1s ease'
                }}>
                  {/* Grid overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'linear-gradient(rgba(34,197,94,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.03) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                  }} />
                </div>

                {/* Detection canvas */}
                <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2 }} />
                <div className="video-scanlines" />

                {/* HUD Overlay */}
                <div className="video-hud">
                  <div className="video-hud-top">
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div className={`hud-badge ${simActive ? 'live' : 'info'}`}>
                        {simActive ? <><div className="rec-dot" /> LIVE — SEC-7</> : <><Eye size={12} /> STANDBY</>}
                      </div>
                      {simActive && <div className="hud-badge info">SIM: {tick}s | {phase.label}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {detectionData.objectCount > 0 && (
                        <div className="hud-badge warning">{detectionData.objectCount} OBJECT{detectionData.objectCount > 1 ? 'S' : ''}</div>
                      )}
                      {detectionData.personCount > 0 && (
                        <div className={`hud-badge ${detectionData.riskScore > 70 ? 'critical' : 'warning'}`}>
                          ⚠ {detectionData.personCount} HOSTILE{detectionData.personCount > 1 ? 'S' : ''}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="video-hud-bottom">
                    <div className="detection-stats">
                      <div className="detection-stat" style={{ color: 'var(--text-main)' }}>
                        <Target size={12} /> RISK: <span style={{ color: isAlert ? 'var(--danger)' : detectionData.threatLevel === 'WARNING' ? 'var(--warning)' : 'var(--safe)', fontWeight: 'bold', fontSize: '1rem' }}>{detectionData.riskScore}%</span>
                      </div>
                      {detectionData.primaryClass !== 'None' && (
                        <div className="detection-stat" style={{ color: 'rgba(255,255,255,0.6)' }}>
                          <Eye size={12} /> {detectionData.primaryClass} — CONF: {detectionData.maxConfidence}%
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className={`threat-level-pill ${detectionData.threatLevel.toLowerCase()}`}>
                        <Shield size={12} /> {detectionData.threatLevel}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Center start button when not active */}
                {!simActive && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                    <div style={{ color: 'var(--accent)', fontFamily: "'Share Tech Mono'", fontSize: '0.8rem', letterSpacing: 2, marginBottom: 16, opacity: 0.6 }}>
                      SOFTWARE SIMULATION ENGINE
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSimActive(true);
                        addLog("[SYS] ▶ Live simulation started. Scenario: Border intrusion + Railway wildlife alert.", "safe");
                      }}
                      style={{
                        background: 'rgba(34,197,94,0.15)', border: '2px solid var(--accent)',
                        borderRadius: 16, padding: '16px 32px', cursor: 'pointer',
                        color: 'var(--accent)', fontFamily: "'Share Tech Mono'", fontSize: '0.9rem',
                        letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 10,
                        boxShadow: '0 0 30px rgba(34,197,94,0.15)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <Play size={20} /> START LIVE SIMULATION
                    </motion.button>
                    <div style={{ color: 'var(--text-dim)', fontFamily: "'Share Tech Mono'", fontSize: '0.55rem', marginTop: 12, textAlign: 'center', maxWidth: 300 }}>
                      60-second scenario: Border intrusion detection → threat escalation → wildlife on railway tracks → auto-brake → all clear
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── CCTV ── */}
            {activeTab === 'CCTV' && <CCTVGrid />}

            {/* ── GEO-EYE ── */}
            {activeTab === 'GEO-EYE' && (
              <motion.div key="geoeye" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: 0, borderRadius: 0 }}>
                <div className="topo-bg" />
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent)', letterSpacing: 2, fontSize: '0.75rem' }}>
                  <span><Scan size={13} style={{ verticalAlign: 'middle' }} /> GIS: JHARKHAND MINING CORRIDOR</span>
                  <button onClick={triggerGeoScan} disabled={geoData.scanning}
                    style={{ background: geoData.scanning ? 'var(--warning)' : 'transparent', border: '1px solid var(--accent)', color: geoData.scanning ? '#000' : 'var(--accent)', padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.65rem', borderRadius: 4 }}>
                    {geoData.scanning ? 'SCANNING...' : 'RUN SCAN'}
                  </button>
                </div>
                <div style={{ flex: 1, borderRadius: 6, overflow: 'hidden', border: `1px solid ${geoData.scanning ? 'var(--warning)' : 'var(--glass-border)'}`, position: 'relative' }}>
                  <MapContainer center={[23.75, 86.41]} zoom={13} style={{ height: '100%', width: '100%', backgroundColor: '#0a0a0a' }}>
                    <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Tiles © Esri" />
                    {geoData.changes.map((c, i) => (
                      <Circle key={i} center={[c.lat, c.lng]} radius={c.radius} pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.5 }}>
                        <Popup><strong>RISK: {c.risk}%</strong><br />Suspected illegal mining.</Popup>
                      </Circle>
                    ))}
                  </MapContainer>
                  {geoData.scanning && <div className="radar-overlay" />}
                </div>
              </motion.div>
            )}

            {/* ── TRACK GUARD ── */}
            {activeTab === 'TRACK-GUARD' && (
              <motion.div key="track" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', margin: 0, borderRadius: 0 }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontSize: '0.85rem', marginBottom: '0.5rem' }}><Train size={16} /> TRACK-GUARD — RAILWAY SAFETY OVERWATCH</h3>
                <div style={{ flex: 1, display: 'flex', gap: '0.5rem' }}>
                  <div style={{ flex: 2, background: 'repeating-linear-gradient(90deg, #111, #111 40px, #1a1a1a 40px, #1a1a1a 42px)', position: 'relative', border: '1px solid rgba(80,80,80,0.3)', overflow: 'hidden', borderRadius: 8 }}>
                    <div style={{ position: 'absolute', top: '50%', width: '100%', height: '3px', background: '#333' }} />
                    <div style={{ position: 'absolute', top: '55%', width: '100%', height: '3px', background: '#333' }} />
                    {trackData.detected && (
                      <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        style={{ position: 'absolute', left: '70%', top: '44%', background: 'var(--warning)', padding: '4px 12px', borderRadius: 8, color: '#000', fontWeight: 'bold', zIndex: 10, fontSize: '0.7rem', boxShadow: '0 0 20px rgba(245,158,11,0.4)' }}>
                        ⚠ {trackData.object}
                      </motion.div>
                    )}
                    <motion.div
                      animate={{ left: trackData.detected ? `${Math.max(10, 50 - tick)}%` : '110%' }}
                      transition={{ duration: 1, ease: 'linear' }}
                      style={{ position: 'absolute', top: '44%', width: 55, height: 28, background: 'var(--accent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold', fontSize: 9, boxShadow: '0 0 12px var(--accent-glow)' }}>
                      🚂 12042
                    </motion.div>
                    {!simActive && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontFamily: "'Share Tech Mono'", fontSize: '0.7rem' }}>
                        Start simulation to see railway scenario
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div className="stat-box" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <div className="label">OBSTRUCTION</div>
                      <div className="value" style={{ color: trackData.detected ? 'var(--warning)' : 'var(--safe)', fontSize: '1rem' }}>{trackData.object}</div>
                    </div>
                    <div className="stat-box" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <div className="label">DISTANCE / SPEED</div>
                      <div className="value" style={{ color: 'var(--warning)', fontSize: '1rem' }}>{Math.round(trackData.distance)}m / {trackData.trainSpeed}km/h</div>
                    </div>
                    <div className="stat-box" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <div className="label">TIME TO IMPACT</div>
                      <div className="value" style={{ color: trackData.timeToImpact < 30 ? 'var(--danger)' : 'var(--safe)' }}>{trackData.timeToImpact}s</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── ANALYTICS ── */}
            {activeTab === 'ANALYTICS' && <AnalyticsDashboard />}

          </AnimatePresence>
        </div>

        {/* ═══ CONTROL PANEL ═══ */}
        <div className="control-panel">

          {/* Simulation Control */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            className={`nav-btn ${simActive ? 'btn-danger' : ''}`}
            style={{
              width: '100%', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontSize: '0.7rem',
              borderColor: simActive ? 'var(--danger)' : 'var(--safe)',
              color: simActive ? 'var(--danger)' : 'var(--safe)',
              background: simActive ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)'
            }}
            onClick={() => {
              if (simActive) {
                setSimActive(false);
                addLog("[SYS] ■ Simulation stopped.", "normal");
              } else {
                setSimActive(true);
                setActiveTab('LIVE');
                addLog("[SYS] ▶ Live simulation started.", "safe");
              }
            }}
          >
            {simActive ? <><Square size={12} /> STOP SIM ({tick}s)</> : <><Play size={12} /> START SIMULATION</>}
          </motion.button>

          {/* Threat Graph */}
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '8px', border: '1px solid var(--glass-border)' }}>
            <div className="section-label" style={{ marginBottom: 4 }}>
              <Activity size={11} style={{ verticalAlign: 'middle' }} /> THREAT TIMELINE
            </div>
            <div style={{ height: 80 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={threatHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,197,94,0.06)" />
                  <XAxis dataKey="time" stroke="var(--accent)" fontSize={8} tick={{ fill: 'var(--text-dim)' }} />
                  <YAxis domain={[0, 100]} stroke="var(--accent)" fontSize={8} tick={{ fill: 'var(--text-dim)' }} width={25} />
                  <Line type="monotone" dataKey="val" stroke={isAlert ? "var(--danger)" : "var(--accent)"} strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="sidebar-divider" />
          <SystemVitals />
          <div className="sidebar-divider" />
          <QuickActions addLog={addLog} playPing={playKlaxon} />
          <div className="sidebar-divider" />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <NightVisionToggle isNightMode={isNightMode} onToggle={() => setIsNightMode(!isNightMode)} />
            <button
              className={`nav-btn ${voiceEnabled ? '' : 'btn-danger'}`}
              style={{ width: '100%', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, borderColor: voiceEnabled ? 'var(--accent)' : 'rgba(255,255,255,0.2)', color: voiceEnabled ? 'var(--accent)' : 'var(--text-dim)' }}
              onClick={() => {
                const newState = !voiceEnabled;
                setVoiceEnabled(newState);
                if (voiceRef.current) voiceRef.current.enabled = newState;
                addLog(`[SYS] AI Voice ${newState ? 'ENABLED' : 'MUTED'}`, 'normal');
              }}>
              {voiceEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
              {voiceEnabled ? 'AI VOICE: ON' : 'AI VOICE: OFF'}
            </button>
            <button className="nav-btn btn-danger" style={{ width: '100%', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
              onClick={() => {
                setDetectionData(prev => ({ ...prev, threatLevel: 'CRITICAL', riskScore: 98, primaryClass: 'TEST_HOSTILE', personCount: 1, label: 'TEST' }));
                addLog("[SYS] ⚠ TEST BREACH initiated. Alert state active.", "critical");
                playSiren(2000);
                if (voiceRef.current && voiceEnabled) voiceRef.current.speak('Alert. Test breach protocol activated. All units standby.', 'critical');
              }}>
              <AlertTriangle size={12} /> TEST BREACH
            </button>
          </div>
          <div className="sidebar-divider" />
          <PersonnelRoster />
          <div className="sidebar-divider" />
          <WeatherWidget />
          <div className="sidebar-divider" />
          <IncidentTimeline logs={logs} />

          <div style={{ maxHeight: 100, overflowY: 'auto' }}>
            <div className="console-font" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <AnimatePresence initial={false}>
                {logs.slice(-6).map(log => (
                  <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className={`log-entry ${log.type === 'critical' ? 'critical' : log.type === 'warning' ? 'warning' : ''}`}>
                    <TypewriterText text={log.text} />
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
