/* eslint-disable react/prop-types */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Activity, AlertTriangle, Fingerprint, Lock,
  Map as MapIcon, Video, Target, Radio, Scan, Train, Download, Terminal,
  BarChart3, Eye, Users, Play, Square, Volume2, VolumeX, LayoutDashboard, Cpu, Wifi, MapPin, Clock, Loader2 as Loader2Icon
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, Circle, Popup, useMap } from 'react-leaflet';

// AI Systems
import AIVoiceSystem, { playSiren, playKlaxon, playDetectionBeep, playSuccessChime, playHighPitchAlarm } from './components/AIVoiceSystem';

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
import AIThreatAnalyst from './components/AIThreatAnalyst';
import FlowSimulationDashboard from './components/FlowSimulationDashboard';

// ═══════════════════════════════════════════════════
//  CONFIGURATION & CONSTANTS
// ═══════════════════════════════════════════════════
const API_URL = import.meta.env.PROD
  ? 'https://backend-ten-fawn-25.vercel.app'
  : 'http://127.0.0.1:5000';

function MapController({ scanning }) {
  const map = useMap();
  useEffect(() => {
    if (scanning) {
      map.flyTo([23.6202, 85.2899], 14, { duration: 2.5 });
    } else {
      map.flyTo([23.6102, 85.2799], 13, { duration: 1.5 });
    }
  }, [scanning, map]);
  return null;
}

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

function useSimulationEngine(liveActive, trackActive) {
  const [liveTick, setLiveTick] = useState(0);
  const [trackTick, setTrackTick] = useState(0);
  const [phase, setPhase] = useState(DETECTION_SCENARIOS[0]);
  const [trackPhase, setTrackPhase] = useState(TRACK_SCENARIO[0]);

  useEffect(() => {
    if (!liveActive) { setLiveTick(0); return; }
    const timer = setInterval(() => setLiveTick(t => (t + 1) % 60), 1000);
    return () => clearInterval(timer);
  }, [liveActive]);

  useEffect(() => {
    if (!trackActive) { setTrackTick(0); return; }
    const timer = setInterval(() => setTrackTick(t => (t + 1) % 60), 1000);
    return () => clearInterval(timer);
  }, [trackActive]);

  useEffect(() => {
    const currentPhase = DETECTION_SCENARIOS.find(s => liveTick >= s.time[0] && liveTick < s.time[1]);
    if (currentPhase) setPhase(currentPhase);
  }, [liveTick]);

  useEffect(() => {
    const currentTrack = TRACK_SCENARIO.find(s => trackTick >= s.time[0] && trackTick < s.time[1]);
    if (currentTrack) setTrackPhase(currentTrack);
  }, [trackTick]);

  return { tick: liveTick, trackTick, phase, trackPhase };
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

    // Human Figure Drawing (Dots and Lines inside the box)
    if (det.class === 'person') {
      ctx.strokeStyle = `rgba(${color === '#ef4444' ? '239,68,68' : '34,197,94'}, 0.8)`;
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = 2;

      const cx = x + w / 2;     // Center X
      const top = y + 4;        // Top padding
      const bot = y + h - 4;    // Bottom padding
      const headR = w * 0.15;   // Head radius

      // Head (dot)
      ctx.beginPath();
      ctx.arc(cx, top + headR, headR, 0, Math.PI * 2);
      ctx.fill();

      // Spine (line)
      const neckY = top + headR * 2 + 2;
      const pelvisY = y + h * 0.55;
      ctx.beginPath(); ctx.moveTo(cx, neckY); ctx.lineTo(cx, pelvisY); ctx.stroke();

      // Arms (lines)
      const shoulderY = neckY + 4;
      ctx.beginPath();
      ctx.moveTo(cx, shoulderY); ctx.lineTo(cx - w * 0.35, shoulderY + h * 0.2 + (Math.sin(tick) * 4)); // Left Arm (swinging)
      ctx.moveTo(cx, shoulderY); ctx.lineTo(cx + w * 0.35, shoulderY + h * 0.2 - (Math.sin(tick) * 4)); // Right Arm (swinging)
      ctx.stroke();

      // Legs (lines)
      ctx.beginPath();
      ctx.moveTo(cx, pelvisY); ctx.lineTo(cx - w * 0.25, bot - (Math.cos(tick) * 4)); // Left Leg (walking)
      ctx.moveTo(cx, pelvisY); ctx.lineTo(cx + w * 0.25, bot + (Math.cos(tick) * 4)); // Right Leg (walking)
      ctx.stroke();
    }

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

// ─── Login & Registration ───
const LoginOverlay = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('AWAITING');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      setError('ENTER CREDENTIALS');
      return;
    }
    setError('');
    setStatus('AUTHENTICATING');

    const endpoint = isRegistering ? `${API_URL}/api/register` : `${API_URL}/api/login`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setStatus('VERIFIED');
        if (isRegistering) {
          // After successful registration, switch back to login mode automatically
          setTimeout(() => {
            setStatus('SUCCESS');
            setTimeout(() => {
              setIsRegistering(false);
              setStatus('AWAITING');
              setError('REGISTRATION SUCCESSFUL. LOGIN NOW.');
              setTimeout(() => setError(''), 3000);
            }, 1000);
          }, 800);
          return;
        }

        // Generate RSA keys (Simulation of secure connection handshake for visual effect)
        setTimeout(async () => {
          try {
            await window.crypto.subtle.generateKey(
              { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
              true, ["encrypt", "decrypt"]
            );
          } catch { /* ignore */ }

          setStatus('SUCCESS');
          // Store session
          sessionStorage.setItem('trinetra_auth', JSON.stringify({ user: username, time: Date.now() }));
          setTimeout(() => onLogin(username), 1000);
        }, 800);
      } else {
        setStatus('DENIED');
        setError(data.message || 'ACCESS DENIED');
        setTimeout(() => {
          setStatus('AWAITING');
          setError('');
        }, 1500);
      }
    } catch (err) {
      console.error("Server Error:", err);
      setStatus('DENIED');
      setError('CONNECTION FAILED');
      setTimeout(() => {
        setStatus('AWAITING');
        setError('');
      }, 1500);
    }
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
          padding: '2rem 2rem',
          background: 'rgba(5,12,5,0.8)', backdropFilter: 'blur(20px)',
          border: `1px solid ${status === 'SUCCESS' ? 'var(--safe)' : 'var(--glass-border)'}`,
          borderRadius: 16,
          boxShadow: `0 0 60px ${status === 'SUCCESS' ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.08)'}`,
          transition: 'all 0.5s ease'
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: '0.3rem', filter: 'drop-shadow(0 0 10px var(--accent-glow))' }}>🛡️</div>

        <motion.div
          animate={status === 'AUTHENTICATING' || status === 'VERIFIED' ? { scale: [1, 1.08, 1], opacity: [0.5, 1, 0.5] } : {}}
          transition={{ repeat: Infinity, duration: 1.2 }}
          style={{ marginBottom: '0.5rem', color: status === 'SUCCESS' ? 'var(--safe)' : 'var(--accent)' }}
        >
          {status === 'SUCCESS' ? <Lock size={40} /> : <Fingerprint size={40} />}
        </motion.div>

        <h2 style={{ fontSize: '1.1rem', color: status === 'SUCCESS' ? 'var(--safe)' : 'var(--accent)', letterSpacing: 4, margin: '0 0 0.1rem' }}>
          TRINETRA COMMAND
        </h2>
        <div style={{ fontSize: '0.5rem', color: 'var(--text-dim)', letterSpacing: 3, marginBottom: '0.4rem' }}>
          MINISTRY OF DEFENCE — BHARAT
        </div>

        <div style={{ fontSize: '0.65rem', color: 'var(--accent)', opacity: 0.7, letterSpacing: 2, marginBottom: '1rem', height: '1rem', fontFamily: "'Share Tech Mono'" }}>
          {status === 'AWAITING' && 'SECURE LOGIN REQUIRED'}
          {status === 'AUTHENTICATING' && 'VERIFYING CREDENTIALS + RSA-2048...'}
          {status === 'VERIFIED' && 'IDENTITY CONFIRMED — GENERATING SESSION'}
          {status === 'SUCCESS' && <span style={{ color: 'var(--safe)' }}>{username.toUpperCase()} — AUTHENTICATED ✓</span>}
        </div>

        {(status === 'AWAITING' || status === 'DENIED') && (
          <>
            <div className="login-input-group">
              <label className="login-label">{isRegistering ? "NEW OFFICER ID" : "OFFICER ID"}</label>
              <input
                className="login-input"
                type="text"
                placeholder={isRegistering ? "Choose officer ID..." : "Enter officer ID..."}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                autoFocus
              />
            </div>
            <div className="login-input-group">
              <label className="login-label">ACCESS KEY</label>
              <input
                className="login-input"
                type="password"
                placeholder={isRegistering ? "Create access key..." : "Enter access key..."}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              className="nav-btn"
              style={{ width: '100%', padding: '0.7rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, fontSize: '0.75rem', marginTop: '0.3rem' }}
            >
              <Scan size={16} /> {isRegistering ? 'REGISTER CREDENTIALS' : 'AUTHENTICATE'}
            </motion.button>

            {error && <div className={error.includes("SUCCESSFUL") ? "login-error safe" : "login-error"} style={{ color: error.includes("SUCCESSFUL") ? 'var(--safe)' : 'var(--danger)' }}>⚠ {error}</div>}

            <div
              onClick={() => { setIsRegistering(!isRegistering); setError(''); setUsername(''); setPassword(''); }}
              style={{ fontSize: '0.55rem', color: 'var(--accent)', marginTop: '0.8rem', textAlign: 'center', fontFamily: "'Share Tech Mono'", cursor: 'pointer', textDecoration: 'underline' }}>
              {isRegistering ? "Return to Officer Login" : "New Officer Registration"}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

// ─── Tabs ───
const TABS = [
  { id: 'DASHBOARD', icon: LayoutDashboard, label: 'DASHBOARD' },
  { id: 'LIVE', icon: Video, label: 'LIVE FEED' },
  { id: 'SIMULATION', icon: Play, label: 'SIMULATIONS' },
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
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [logs, setLogs] = useState([{ id: 1, text: "[SYS] All subsystems initialized. Defense grid online.", type: "normal" }]);
  const logsEndRef = useRef(null);

  const canvasRef = useRef(null);

  // Modes
  const [isNightMode, setIsNightMode] = useState(false);
  const [walkieOpen, setWalkieOpen] = useState(false);
  const [simActive, setSimActive] = useState(false);
  const [trackActive, setTrackActive] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [analystOpen, setAnalystOpen] = useState(false);

  // AI Chat & DB States
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([{ text: "Trinetra AI online. Connected to DB. Awaiting commands.", sender: 'ai' }]);
  const [dbLogs, setDbLogs] = useState([]);

  // Telemetry & SMS State
  const [telemetry, setTelemetry] = useState({ signal: 98, latency: 12, aiConf: 94, uptime: 99.7 });
  const [smsVisible, setSmsVisible] = useState(false);
  const [smsText, setSmsText] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
        setTelemetry(prev => ({
            signal: Math.max(80, Math.min(100, prev.signal + (Math.random() * 4 - 2))),
            latency: Math.max(5, Math.min(50, prev.latency + (Math.random() * 6 - 3))),
            aiConf: Math.max(85, Math.min(99, prev.aiConf + (Math.random() * 4 - 2))),
            uptime: prev.uptime
        }));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Fetch from Real Backend DB
  const isInitialLoad = useRef(true);
  useEffect(() => {
    const fetchDBLogs = async () => {
      try {
        const res = await fetch(`${API_URL}/api/incidents?limit=10`);
        const data = await res.json();
        if (data.incidents) {
          const newAlerts = data.incidents.filter(inc => !dbLogs.find(d => d.id === inc.id));

          if (!isInitialLoad.current) {
            newAlerts.forEach(inc => {
              if (inc.severity === 'CRITICAL' && voiceRef.current && voiceEnabled) {
                // Only speak global alerts if NOT in isolated CCTV tab
                if (activeTab !== 'CCTV') {
                  voiceRef.current.speak(`Database trigger. Critical threat in ${inc.sector}. ${inc.description}`, 'critical');
                }
              }
            });
          }

          setDbLogs(data.incidents);
          isInitialLoad.current = false;
        }
      } catch (err) { }
    };
    const initPoller = setInterval(fetchDBLogs, 3000);
    return () => clearInterval(initPoller);
  }, [dbLogs, voiceEnabled, activeTab]);

  const triggerBackendSim = async (scenario) => {
    try {
      addLog(`[SYSTEM] Starting ${scenario} simulation sequence...`, 'warning');
      await fetch(`${API_URL}/api/simulation/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, count: 3 })
      });
    } catch (err) { }
  };

  // AI Voice
  const voiceRef = useRef(null);
  useEffect(() => {
    voiceRef.current = new AIVoiceSystem();
    return () => voiceRef.current?.destroy();
  }, []);

  // Simulation engine
  const { tick, trackTick, phase, trackPhase } = useSimulationEngine(simActive, trackActive);

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

  // ═══ MAIN LIVE SIMULATION EFFECT ═══
  useEffect(() => {
    // Strict separation: If CCTV is open, do not run global LIVE sim interactions
    if (!simActive || activeTab === 'CCTV') return;

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
          const criticalMessages = [
            `Critical alert. ${personCount} hostile targets confirmed in Sector 7 Alpha. Fuzzy risk score ${maxRisk} percent. Quick Reaction Force has been dispatched. All units respond immediately.`,
            `Red alert. Perimeter breach detected. ${personCount} intruders at northeast fence line. Risk assessment ${maxRisk} percent critical. Initiating emergency protocol Bravo 7.`,
            `Attention all stations. Multiple hostiles identified by Border Sentry AI. Threat classification ${primary}. Confidence ${maxConf} percent. Sector 7 lockdown recommended.`,
            `Emergency. AI sensors confirm ${personCount} unauthorized individuals in restricted zone. Velocity and proximity analysis indicates hostile intent. Risk ${maxRisk} percent. QRF Team Alpha scrambled.`,
            `Critical threat in Sector 7. ${personCount} targets detected carrying suspicious objects. Alerting Regional Command on frequency 47.5 megahertz. All personnel to defensive positions.`
          ];
          voiceRef.current.speak(criticalMessages[Math.floor(Math.random() * criticalMessages.length)], 'critical');
        }
        setSmsText(`ALERT: Intruders at Sector 7 (${personCount} Pax). Evacuate / Deploy QRF.`);
        setSmsVisible(true);
        setTimeout(() => setSmsVisible(false), 6000);
      } else if (threatLevel === 'WARNING') {
        playDetectionBeep();
        addLog(`[SEC-7] WARNING: Movement detected — ${primary} | Risk: ${maxRisk}% | Tracking...`, 'warning');
        if (voiceRef.current && voiceEnabled) {
          const warningMessages = [
            `Warning. Unidentified ${primary.toLowerCase()} detected approaching perimeter. Risk level ${maxRisk} percent. AI is tracking movement pattern.`,
            `Attention. Motion sensors triggered in Sector 7 Alpha. Possible ${primary.toLowerCase()} contact at medium range. Increasing camera zoom for identification.`,
            `Advisory. Border Sentry detects movement at northeast quadrant. Classification pending. Current risk assessment ${maxRisk} percent. Monitoring closely.`,
            `Caution. Thermal signature detected near perimeter fence. AI confidence building. Object classified as ${primary.toLowerCase()}. Tracking has begun.`,
            `Warning. New contact detected at ${Math.floor(200 + Math.random() * 300)} meters from fence line. Running AI pattern analysis. Stand by for threat update.`
          ];
          voiceRef.current.speak(warningMessages[Math.floor(Math.random() * warningMessages.length)]);
        }
      } else if (prevThreatRef.current !== 'LOW') {
        playSuccessChime();
        addLog(`[SEC-7] ✓ Threat cleared. Sector secure. Resuming surveillance.`, 'normal');
        if (voiceRef.current && voiceEnabled) {
          const clearMessages = [
            'All clear. Threat has been neutralized. Sector 7 returning to green status. Resuming normal surveillance operations.',
            'Situation resolved. No further hostile activity detected. All cameras back to routine scan mode. Force readiness downgraded to normal.',
            'Stand down. Threat has retreated beyond perimeter range. Sector 7 is now secure. Logging incident for pattern analysis.',
            'All clear confirmed. AI sensors show no remaining targets in restricted zone. Patrol teams may resume normal routes.',
            'Threat eliminated from sector. Risk level now zero. Excellent response from all units. Next scheduled patrol at usual rotation.'
          ];
          voiceRef.current.speak(clearMessages[Math.floor(Math.random() * clearMessages.length)]);
        }
      }
      prevThreatRef.current = threatLevel;
    }

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

  }, [tick, simActive, phase, activeTab, addLog, voiceEnabled]);

  // ═══ TRACK GUARD SIMULATION EFFECT ═══
  useEffect(() => {
    if (!trackActive || activeTab === 'CCTV') return;

    // Track guard updates
    const tp = trackPhase;
    const speedMs = tp.trainSpeed * (5 / 18);
    const eti = speedMs > 0 ? Math.round(tp.distance / speedMs) : 99;
    setTrackData({ detected: tp.detected, object: tp.object, trainSpeed: tp.trainSpeed, distance: tp.distance, timeToImpact: eti });

    if (tp.action && tp.detected !== prevTrackRef.current) {
      addLog(`[TRK-2] ${tp.action}`, tp.detected ? 'warning' : 'normal');
      if (tp.detected && voiceRef.current && voiceEnabled) {
        playKlaxon();
        const trackMessages = [
          `Track Guard alert. ${tp.object} detected on railway track Kilo Mike 142. Auto brake signal transmitted to Train 12042 Rajdhani Express. Estimated time to impact ${eti} seconds.`,
          `Railway safety warning. Obstruction confirmed on track section. ${tp.object} at ${tp.distance} meters. Emergency brake command sent. Indian Railways control room notified.`,
          `Attention. Track Guard AI has identified a ${tp.object} crossing the track ahead. Speed of approaching train ${tp.trainSpeed} kilometers per hour. Auto brake engaged. Distance ${tp.distance} meters.`,
          `Rail corridor alert. Wildlife incursion detected. ${tp.object} on active track near Kilo Mike 142. Brake signal dispatched. All trains in sector slowing to safety speed.`,
          `Emergency track alert. ${tp.object} confirmed on railway line. AI confidence high. Auto brake protocol activated for approaching Rajdhani Express. Control room standing by.`
        ];
        voiceRef.current.speak(trackMessages[Math.floor(Math.random() * trackMessages.length)], 'critical');
      } else if (!tp.detected && prevTrackRef.current && voiceRef.current && voiceEnabled) {
        const trackClear = [
          'Track Guard all clear. Obstruction has cleared the railway line. Track is safe for train passage. Resuming normal monitoring.',
          'Railway corridor clear. Wildlife has moved away from track. Brake signal released. Trains may proceed at normal speed.',
          'Track section clear. No further obstructions detected. Indian Railways control room notified. Normal operations resumed.'
        ];
        voiceRef.current.speak(trackClear[Math.floor(Math.random() * trackClear.length)]);
      }
    }
    prevTrackRef.current = tp.detected;

  }, [trackTick, trackActive, activeTab, trackPhase, addLog, voiceEnabled]);

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
    if (voiceRef.current && voiceEnabled) {
      const scanStartMessages = [
        'Geo Eye satellite scan initiated. Analyzing terrain changes in Jharkhand mining corridor. Processing satellite imagery comparison.',
        'Commencing GIS terrain analysis. Scanning Ranchi district coordinates for illegal mining activity. Satellite data loading.',
        'Geo Eye module activated. Running pixel level terrain change detection on Jharkhand corridor. This analysis covers 50 square kilometers.'
      ];
      voiceRef.current.speak(scanStartMessages[Math.floor(Math.random() * scanStartMessages.length)]);
    }
    setTimeout(() => {
      const anomalies = [
        { lat: 23.6152, lng: 85.2859, radius: 400, risk: 85 },
        { lat: 23.6052, lng: 85.2719, radius: 250, risk: 60 },
        { lat: 23.6200, lng: 85.2900, radius: 180, risk: 45 }
      ];
      setGeoData({ changes: anomalies, scanning: false });
      addLog(`[GEO-EYE] 3 terrain anomalies detected — suspected illegal mining & deforestation.`, 'warning');
      playDetectionBeep();
      if (voiceRef.current && voiceEnabled) {
        const scanResultMessages = [
          'Geo Eye scan complete. 3 terrain anomalies identified. Highest risk zone at 85 percent. Suspected illegal mining activity in Ranchi district. Coordinates forwarded to District Mining Officer.',
          'Satellite analysis finished. Detected significant terrain changes at 3 locations. Evidence of unauthorized excavation and deforestation. Alert sent to Jharkhand Mining Department.',
          'Scan results ready. 3 anomalies found in mining corridor. Large scale terrain modification detected, risk 85 percent. This matches patterns of illegal coal extraction. Report generated for authorities.'
        ];
        voiceRef.current.speak(scanResultMessages[Math.floor(Math.random() * scanResultMessages.length)], 'critical');
      }
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
      <div className="digital-rain-bg" />

      {/* Floating elements */}
      <NotificationToast logs={logs} />
      <MobileAlert threatLevel={detectionData.threatLevel} riskScore={detectionData.riskScore} threatClass={detectionData.primaryClass} />
      <WalkieTalkie isOpen={walkieOpen} onToggle={() => setWalkieOpen(!walkieOpen)} threatLevel={detectionData.threatLevel} detectedClass={detectionData.primaryClass} />
      <AIThreatAnalyst isOpen={analystOpen} onToggle={() => setAnalystOpen(!analystOpen)} detectionData={detectionData} />

      <AnimatePresence>
        {smsVisible && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 20, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            style={{
              position: 'fixed', top: '10px', right: '20px', zIndex: 99999,
              background: '#fff', color: '#000', padding: '12px 18px',
              borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', gap: '12px',
              fontFamily: 'sans-serif', minWidth: '300px'
            }}
          >
            <div style={{ background: '#22c55e', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              💬
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>Messages • Now</div>
              <div style={{ fontSize: '14px', fontWeight: '600', marginTop: '2px' }}>{smsText}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

            {/* ── DASHBOARD (default — overview) ── */}
            {activeTab === 'DASHBOARD' && (
              <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, padding: 10, overflowY: 'auto' }}>

                {/* Welcome Banner - Restored & Enhanced */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(5,20,5,0.95) 100%)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 12,
                  padding: '24px 28px',
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <div style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 0 15px var(--accent-glow))' }}>🛡️</div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ fontFamily: "'Share Tech Mono'", fontSize: '1rem', color: 'var(--accent)', letterSpacing: 3, marginBottom: 4, fontWeight: 'bold' }}>
                            TRINETRA RAKSHAK — COMMAND OVERVIEW
                          </div>
                          <div style={{ fontSize: '0.5rem', background: 'rgba(34,197,94,0.2)', color: 'var(--accent)', padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(34,197,94,0.3)', marginBottom: 4 }}>
                            v5.4.10 - LIVE
                          </div>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', lineHeight: 1.6, maxWidth: '600px' }}>
                          AI-powered Integrated Surveillance System for India's border security, railway safety, and mining surveillance.
                          <br />
                          <span style={{ color: 'var(--accent)', opacity: 0.8 }}>Sector 7 — Jharkhand Mining Corridor — All subsystems operational.</span>
                        </div>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(34,197,94,0.3)' }} whileTap={{ scale: 0.95 }}
                      onClick={() => { setActiveTab('LIVE'); setSimActive(true); addLog("[SYS] ▶ Simulation started from Dashboard.", "safe"); }}
                      style={{
                        background: 'rgba(34,197,94,0.15)',
                        border: '2px solid var(--accent)',
                        borderRadius: 10,
                        padding: '14px 28px',
                        cursor: 'pointer',
                        color: 'var(--accent)',
                        fontFamily: "'Share Tech Mono'",
                        fontSize: '0.9rem',
                        letterSpacing: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        whiteSpace: 'nowrap',
                        fontWeight: 'bold'
                      }}
                    >
                      <Play size={20} fill="currentColor" /> GO LIVE
                    </motion.button>
                  </div>

                  {/* Headlines / Ticker Row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'stretch',
                    background: 'rgba(0,0,0,0.9)',
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: '1px solid rgba(34,197,94,0.3)',
                    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
                  }}>
                    <div className="pulse-red" style={{
                      background: 'var(--accent)',
                      color: '#000',
                      padding: '8px 20px',
                      fontSize: '0.75rem',
                      fontWeight: '900',
                      letterSpacing: 1,
                      whiteSpace: 'nowrap',
                      zIndex: 2,
                      display: 'flex',
                      alignItems: 'center',
                      fontFamily: "'Share Tech Mono'"
                    }}>
                      ⚡ HEADLINES
                    </div>
                    <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
                      <marquee scrollamount="5" style={{ color: 'var(--text-main)', fontFamily: "'Share Tech Mono'", fontSize: '0.85rem', display: 'flex', gap: '50px', alignItems: 'center', padding: '10px 0' }}>
                        <span style={{ marginRight: '100px' }}>
                          <span style={{ color: 'var(--accent)' }}>[STATUS]</span> • GENERAL SURVEILLANCE ACTIVE • ALL SECTORS REPORTING NORMAL
                        </span>
                        <span style={{ marginRight: '100px' }}>
                          <span style={{ color: 'var(--accent)' }}>[PATROL]</span> • UNIT ALPHA CHECK-IN AT SEC-7A • PERIMETER INTEGRITY 100%
                        </span>
                        <span style={{ marginRight: '100px' }}>
                          <span style={{ color: 'var(--accent)' }}>[SYSTEM]</span> • AI ENGINE OPERATING AT 99.8% EFFICIENCY • DB SYNCED
                        </span>
                        <span style={{ marginRight: '100px' }}>
                          <span style={{ color: 'var(--accent)' }}>[PATROL]</span> • UNIT BRAVO COMMENCING ROUTINE SCAN OF RAILWAY CORRIDOR KM-142
                        </span>
                        <span style={{ marginRight: '100px' }}>
                          <span style={{ color: 'var(--accent)' }}>[WEATHER]</span> • CLEAR VISIBILITY REPORTED ACROSS JHARKHAND MINING SECTOR
                        </span>
                      </marquee>
                    </div>
                  </div>
                </div>

                {/* Status Cards Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {[
                    { icon: Shield, label: 'THREAT LEVEL', value: detectionData.threatLevel, color: detectionData.threatLevel === 'CRITICAL' ? 'var(--danger)' : detectionData.threatLevel === 'WARNING' ? 'var(--warning)' : 'var(--safe)' },
                    { icon: Video, label: 'CCTV FEEDS', value: '4/4 ONLINE', color: 'var(--safe)' },
                    { icon: Cpu, label: 'AI ENGINE', value: 'ACTIVE', color: '#a855f7' },
                    { icon: Users, label: 'PERSONNEL', value: '5/6 ON DUTY', color: 'var(--accent)' },
                  ].map((card, i) => (
                    <div key={i} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.55rem', color: 'var(--text-dim)', letterSpacing: 1 }}>
                        <card.icon size={11} /> {card.label}
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: card.color, fontFamily: "'Share Tech Mono'" }}>{card.value}</div>
                    </div>
                  ))}
                </div>

                {/* System Health Telemetry Overlay */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 4 }}>
                    <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>SIGNAL</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--safe)', fontWeight: 'bold' }}>{telemetry.signal.toFixed(0)}%</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>LATENCY</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--warning)', fontWeight: 'bold' }}>{telemetry.latency.toFixed(0)}ms</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>AI CONFIDENCE</div>
                        <div style={{ fontSize: '0.8rem', color: '#a855f7', fontWeight: 'bold' }}>{telemetry.aiConf.toFixed(0)}%</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>UPTIME</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--safe)', fontWeight: 'bold' }}>{telemetry.uptime}%</div>
                    </div>
                </div>

                {/* Real-World Modules Section */}
                <div style={{ fontSize: '0.6rem', color: 'var(--accent)', letterSpacing: 2, fontFamily: "'Share Tech Mono'", marginTop: 4 }}>
                  ACTIVE DEFENCE MODULES
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {[
                    { title: 'BORDER-SENTRY', desc: 'Perimeter intrusion detection using AI object recognition. Monitors SEC-7A, 7B, 7C fences 24/7.', status: 'OPERATIONAL', color: 'var(--safe)', tab: 'LIVE' },
                    { title: 'GEO-EYE', desc: 'Satellite GIS terrain analysis for illegal mining detection in Jharkhand corridor. Weekly scans.', status: 'STANDBY', color: '#f59e0b', tab: 'GEO-EYE' },
                    { title: 'TRACK-GUARD', desc: 'Railway safety overwatch — detects wildlife & obstructions on tracks. Auto-brake via Indian Railways API.', status: 'MONITORING', color: 'var(--safe)', tab: 'TRACK-GUARD' },
                  ].map((mod, i) => (
                    <div key={i} onClick={() => setActiveTab(mod.tab)} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '10px 12px', cursor: 'pointer', transition: 'border-color 0.3s' }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>{mod.title}</div>
                      <div style={{ fontSize: '0.55rem', color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 6 }}>{mod.desc}</div>
                      <div style={{ fontSize: '0.5rem', fontFamily: "'Share Tech Mono'", color: mod.color, letterSpacing: 1 }}>● {mod.status}</div>
                    </div>
                  ))}
                </div>

                {/* Trinetra Interactive Deployment Flows */}
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--accent)', letterSpacing: 2, fontFamily: "'Share Tech Mono'" }}>
                      ACTIVE SIMULATION FLOWS
                    </div>
                  </div>
                  <FlowSimulationDashboard
                    setActiveTab={setActiveTab}
                    setSimActive={setSimActive}
                    setTrackActive={setTrackActive}
                    triggerGeoScan={triggerGeoScan}
                    triggerBackendSim={triggerBackendSim}
                    addLog={addLog}
                  />
                </div>

                {/* Threat History mini */}
                <div style={{ flex: 1, minHeight: 100, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '8px 12px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '0.55rem', color: 'var(--text-dim)', letterSpacing: 1, marginBottom: 4 }}>RECENT ACTIVITY LOG</div>
                  <div style={{ flex: 1, overflowY: 'auto', fontSize: '0.55rem', color: 'var(--text-dim)', lineHeight: 1.8 }}>
                    {logs.slice(-20).map((log, i) => (
                      <div key={i} style={{ color: log.type === 'critical' ? 'var(--danger)' : log.type === 'warning' ? 'var(--warning)' : log.type === 'safe' ? 'var(--safe)' : 'var(--text-dim)' }}>
                        {log.text}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── LIVE FEED ── */}
            {activeTab === 'LIVE' && (
              <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="live-feed-container"
              >
                {/* Simulated camera background */}
                <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                    {simActive ? (
                        <>
                            <div className="loading-spinner" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--accent)', zIndex: 0 }}>
                                <Loader2Icon size={32} style={{ animation: 'spin 2s linear infinite' }} />
                                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                            </div>
                            <video
                                autoPlay
                                loop
                                muted
                                playsInline
                                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isNightMode ? 0.4 : 0.8, filter: isNightMode ? 'grayscale(100%) contrast(150%) hue-rotate(90deg)' : 'none', position: 'relative', zIndex: 1 }}
                                src={simActive ? "https://assets.mixkit.co/videos/preview/mixkit-fence-with-barbed-wire-39853-large.mp4" : ""}
                            />
                        </>
                    ) : (
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'radial-gradient(ellipse at center, rgba(10,15,10,0.7), rgba(3,5,3,1))',
                        }}>
                             <div style={{
                                position: 'absolute', inset: 0,
                                backgroundImage: 'linear-gradient(rgba(34,197,94,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.03) 1px, transparent 1px)',
                                backgroundSize: '40px 40px'
                             }} />
                        </div>
                    )}
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
                      {isNightMode && <div className="hud-badge" style={{ background: 'none', border: '1px solid #10b981', color: '#10b981' }}>THERMAL CAM READY</div>}
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
                        addLog("[SYS] ▶ Live simulation started. Scenario: Border intrusion alert.", "safe");
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
                      60-second scenario: Border intrusion detection → threat escalation → all clear
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── REAL BACKEND SIMULATIONS (NEW) ── */}
            {activeTab === 'SIMULATION' && (
              <motion.div key="sim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, padding: '20px', overflowY: 'auto' }}>
                <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: 20 }}>
                  <div className="glitch-text" data-text="ACTIVE SIMULATION MODULES" style={{ fontSize: '1.2rem', fontFamily: "'Share Tech Mono'", marginBottom: 6, color: 'var(--accent)' }}>ACTIVE SIMULATION MODULES</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: 20 }}>Trigger real database-backed scenarios to demonstrate system scalability and AI responsiveness.</div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                    <div className="cyber-border" style={{ padding: 16, background: 'rgba(239, 68, 68, 0.05)', borderRadius: 8, cursor: 'pointer' }} onClick={() => triggerBackendSim('INTRUSION')}>
                      <div style={{ color: 'var(--danger)', fontSize: '1rem', fontFamily: "'Share Tech Mono'", marginBottom: 8 }}><Lock size={16} /> BORDER INTRUSION</div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.65rem' }}>Simulates hostile intruders jumping the perimeter fence. Syncs immediately to database and triggers QRF.</div>
                    </div>

                    <div className="cyber-border" style={{ padding: 16, background: 'rgba(245, 158, 11, 0.05)', borderRadius: 8, cursor: 'pointer' }} onClick={() => triggerBackendSim('WILDLIFE')}>
                      <div style={{ color: 'var(--warning)', fontSize: '1rem', fontFamily: "'Share Tech Mono'", marginBottom: 8 }}><MapPin size={16} /> WILDLIFE TRACKING</div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.65rem' }}>Simulates animal crossing over critical railway tracks. Invokes collision risk AI.</div>
                    </div>

                    <div className="cyber-border" style={{ padding: 16, background: 'rgba(168, 85, 247, 0.05)', borderRadius: 8, cursor: 'pointer' }} onClick={() => triggerBackendSim('DRONE')}>
                      <div style={{ color: '#a855f7', fontSize: '1rem', fontFamily: "'Share Tech Mono'", marginBottom: 8 }}><Radio size={16} /> UAV DRONE DETECTION</div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.65rem' }}>Simulates unidentified aerial vehicle over restricted airspace. Radar anomaly generation.</div>
                    </div>

                    <div className="cyber-border" style={{ padding: 16, background: 'rgba(34, 197, 94, 0.05)', borderRadius: 8, cursor: 'pointer' }} onClick={() => triggerBackendSim('MINING')}>
                      <div style={{ color: 'var(--safe)', fontSize: '1rem', fontFamily: "'Share Tech Mono'", marginBottom: 8 }}><MapIcon size={16} /> ILLEGAL MINING</div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.65rem' }}>Simulates GIS satellite terrain differences in the Jharkhand mining corridor. Extracts heatmap changes.</div>
                    </div>

                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', borderLeft: '3px solid var(--accent)', borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: '0.9rem', fontFamily: "'Share Tech Mono'", marginBottom: 12, color: 'var(--text-main)' }}>LIVE DATABASE EVENT STREAM</div>
                  <div style={{ flex: 1, minHeight: 200, overflowY: 'auto', background: 'rgba(0,0,0,0.8)', padding: 12, borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {dbLogs.length === 0 && <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Listening to SQLite DB... Awaiting queries.</div>}
                    {dbLogs.map((log, i) => (
                      <div key={i} style={{ fontSize: '0.65rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 6 }}>
                        <span style={{ color: 'var(--accent)', fontFamily: "'Share Tech Mono'" }}>[{log.timestamp}]</span>
                        <span style={{ color: log.severity === 'CRITICAL' ? 'var(--danger)' : log.severity === 'WARNING' ? 'var(--warning)' : 'var(--safe)', marginLeft: 8 }}>{log.type} // {log.sector} // {log.severity}</span>
                        <div style={{ color: 'var(--text-dim)', marginTop: 4 }}>{log.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── CCTV ── */}
            {activeTab === 'CCTV' && <CCTVGrid active={true} voiceRef={voiceRef} voiceEnabled={voiceEnabled} />}

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
                  <MapContainer center={[23.6102, 85.2799]} zoom={13} style={{ height: '100%', width: '100%', backgroundColor: '#0a0a0a' }}>
                    <MapController scanning={geoData.scanning} />
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
                      animate={{ left: trackData.detected ? `${Math.min(60, 20 + trackTick)}%` : '-10%' }}
                      transition={{ duration: 1, ease: 'linear' }}
                      style={{ position: 'absolute', top: '44%', width: 55, height: 28, background: 'var(--accent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold', fontSize: 9, boxShadow: '0 0 12px var(--accent-glow)' }}>
                      🚂 12042
                    </motion.div>
                    {!trackActive && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 20 }}>
                        <motion.button
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setTrackActive(true);
                            addLog("[SYS] ▶ Track Guard simulation started.", "safe");
                          }}
                          style={{
                            background: 'rgba(34,197,94,0.15)', border: '1px solid var(--accent)',
                            borderRadius: 8, padding: '10px 20px', cursor: 'pointer',
                            color: 'var(--accent)', fontFamily: "'Share Tech Mono'", fontSize: '0.8rem',
                            letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8
                          }}
                        >
                          <Play size={16} /> START RAILWAY SIM
                        </motion.button>
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
        </div >

        {/* ═══ CONTROL PANEL ═══ */}
        < div className="control-panel" >

          {/* Simulation Control */}
          <div style={{ display: 'flex', gap: 6 }}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className={`nav-btn ${simActive ? 'btn-danger' : ''}`}
              style={{
                flex: 1, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontSize: '0.65rem',
                borderColor: simActive ? 'var(--danger)' : 'var(--safe)',
                color: simActive ? 'var(--danger)' : 'var(--safe)',
                background: simActive ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)'
              }}
              onClick={() => {
                if (simActive) {
                  setSimActive(false);
                  addLog("[SYS] ■ Border Sentry stopped.", "normal");
                } else {
                  setSimActive(true);
                  setActiveTab('LIVE');
                  addLog("[SYS] ▶ Border Sentry started.", "safe");
                }
              }}
            >
              {simActive ? <><Square size={12} /> STOP BORDER</> : <><Play size={12} /> BORDER SIM</>}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              className={`nav-btn ${trackActive ? 'btn-danger' : ''}`}
              style={{
                flex: 1, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontSize: '0.65rem',
                borderColor: trackActive ? 'var(--danger)' : 'var(--safe)',
                color: trackActive ? 'var(--danger)' : 'var(--safe)',
                background: trackActive ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)'
              }}
              onClick={() => {
                if (trackActive) {
                  setTrackActive(false);
                  addLog("[SYS] ■ Track Guard stopped.", "normal");
                } else {
                  setTrackActive(true);
                  setActiveTab('TRACK-GUARD');
                  addLog("[SYS] ▶ Track Guard started.", "safe");
                }
              }}
            >
              {trackActive ? <><Square size={12} /> STOP TRACK</> : <><Play size={12} /> TRACK SIM</>}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className={`nav-btn ${activeTab === 'CCTV' ? 'btn-danger' : ''}`}
              style={{
                flex: 1, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontSize: '0.65rem',
                borderColor: activeTab === 'CCTV' ? 'var(--danger)' : 'var(--safe)',
                color: activeTab === 'CCTV' ? 'var(--danger)' : 'var(--safe)',
                background: activeTab === 'CCTV' ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)'
              }}
              onClick={() => {
                if (activeTab === 'CCTV') {
                  setActiveTab('DASHBOARD');
                  addLog("[SYS] ■ CCTV Simulation stopped.", "normal");
                } else {
                  setActiveTab('CCTV');
                  addLog("[SYS] ▶ CCTV Simulation started.", "safe");
                }
              }}
            >
              {activeTab === 'CCTV' ? <><Square size={12} /> STOP CCTV</> : <><Play size={12} /> CCTV SIM</>}
            </motion.button>
          </div>

          {/* Threat Graph */}
          < div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '8px', border: '1px solid var(--glass-border)' }}>
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
          </div >

          <div className="sidebar-divider" />
          <SystemVitals />
          <div className="sidebar-divider" />
          <QuickActions addLog={addLog} playPing={playHighPitchAlarm} />
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

          <div style={{ flex: 1, minHeight: 120, overflowY: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div className="console-font" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <AnimatePresence initial={false}>
                {logs.slice(-10).map(log => (
                  <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className={`log-entry ${log.type === 'critical' ? 'critical' : log.type === 'warning' ? 'warning' : ''}`}>
                    <TypewriterText text={log.text} />
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={logsEndRef} />
            </div>
          </div>
        </div >
      </div >
    </div >
  );
}
