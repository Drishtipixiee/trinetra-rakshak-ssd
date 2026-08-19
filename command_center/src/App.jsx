/* eslint-disable react/prop-types */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Activity, AlertTriangle, Fingerprint, Lock,
  Map as MapIcon, Video, Target, Radio, Scan, Train, Download, Terminal,
  BarChart3, Eye, Users, Play, Square, Volume2, VolumeX, LayoutDashboard, Cpu, Wifi, MapPin, Clock, Loader2 as Loader2Icon, Satellite, Brain
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { logThreatEvent } from './lib/supabase';
import { loadModel, detectFrame, drawDetections, estimateFuzzyInputs, isModelLoaded, getModelInfo } from './lib/cvEngine';

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
import GeoEyePanel from './components/GeoEyePanel';

// ═══════════════════════════════════════════════════
//  CONFIGURATION & CONSTANTS
// ═══════════════════════════════════════════════════
const API_URL = import.meta.env.PROD
  ? 'https://backend-ten-fawn-25.vercel.app'
  : 'http://127.0.0.1:5000';

// ═══════════════════════════════════════════════════
//  REAL AI DETECTION HOOK — TF.js COCO-SSD
//  Replaces scripted DETECTION_SCENARIOS timer
// ═══════════════════════════════════════════════════
function useRealDetection(active, videoRef, canvasRef) {
  const [detections, setDetections] = useState([]);
  const [modelStatus, setModelStatus] = useState('idle'); // idle | loading | ready | error
  const [modelProgress, setModelProgress] = useState(0);
  const [modelMessage, setModelMessage] = useState('');
  const prevDetectionsRef = useRef([]);
  const rafRef = useRef(null);
  const tickRef = useRef(0);

  // Load model on mount (cached — only loads once across all uses)
  useEffect(() => {
    if (modelStatus !== 'idle') return;
    setModelStatus('loading');
    loadModel((progress, message) => {
      setModelProgress(Math.round(progress * 100));
      setModelMessage(message);
    }).then(() => {
      setModelStatus('ready');
    }).catch(() => {
      setModelStatus('error');
    });
  }, [modelStatus]);

  // Run inference loop when active + model ready
  useEffect(() => {
    if (!active || modelStatus !== 'ready') {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const inferenceLoop = async () => {
      const video = videoRef?.current;
      const canvas = canvasRef?.current;

      if (video && canvas) {
        // Sync canvas size to parent
        const parent = canvas.parentElement;
        if (parent) {
          canvas.width = parent.clientWidth || 960;
          canvas.height = parent.clientHeight || 540;
        }

        try {
          const result = await detectFrame(video, 0.35);
          setDetections(result);
          drawDetections(canvas, result, 0, tickRef.current);
          prevDetectionsRef.current = result;
          tickRef.current += 1;
        } catch (_) { /* inference error — skip frame */ }
      }

      // ~10fps — enough for surveillance, won't block UI
      rafRef.current = setTimeout(() => {
        rafRef.current = requestAnimationFrame(inferenceLoop);
      }, 100);
    };

    rafRef.current = requestAnimationFrame(inferenceLoop);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        clearTimeout(rafRef.current);
      }
    };
  }, [active, modelStatus, videoRef, canvasRef]);

  const getPrevDetections = useCallback(() => prevDetectionsRef.current, []);

  return { detections, modelStatus, modelProgress, modelMessage, getPrevDetections };
}

// (drawSimulatedDetections replaced by cvEngine.drawDetections with real TF.js data)
// --- Legacy placeholder: not used in v2.0 ---
function _unused_drawSimulatedDetections(canvas, detections, tick) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const jitter = () => (Math.sin(tick * 0.7 + Math.random()) * 1.2);

  // Grid overlay
  ctx.strokeStyle = 'rgba(34,197,94,0.04)';
  ctx.lineWidth = 0.5;
  for (let gx = 0; gx < W; gx += 60) {
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
  }
  for (let gy = 0; gy < H; gy += 60) {
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
  }

  detections.forEach((det, idx) => {
    const x = (det.x / 100) * W + jitter();
    const y = (det.y / 100) * H + jitter();
    const w = (det.w / 100) * W;
    const h = (det.h / 100) * H;
    const conf = det.confidence + Math.floor(Math.random() * 4 - 2);
    const color = det.risk > 70 ? '#ef4444' : det.risk > 40 ? '#f59e0b' : '#22c55e';
    const rgbStr = det.risk > 70 ? '239,68,68' : det.risk > 40 ? '245,158,11' : '34,197,94';

    // Glow zone around target
    const gradient = ctx.createRadialGradient(x + w/2, y + h/2, 0, x + w/2, y + h/2, Math.max(w,h));
    gradient.addColorStop(0, `rgba(${rgbStr}, 0.08)`);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - w*0.3, y - h*0.3, w*1.6, h*1.6);

    // Tracking trail (motion history)
    if (det.dx || det.dy) {
      ctx.strokeStyle = `rgba(${rgbStr}, 0.15)`;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      const trailLen = 8;
      for (let t = 0; t < trailLen; t++) {
        const tx = x - (det.dx || 0) * t * 3;
        const ty = y - (det.dy || 0) * t * 3;
        ctx.globalAlpha = 0.3 - (t * 0.035);
        ctx.strokeRect(tx, ty, w, h);
      }
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
    }

    // Main bounding box with corner brackets
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    const cl = Math.min(w, h) * 0.25;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, y + cl); ctx.lineTo(x, y); ctx.lineTo(x + cl, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w - cl, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + cl); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + h - cl); ctx.lineTo(x, y + h); ctx.lineTo(x + cl, y + h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w - cl, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cl); ctx.stroke();

    // Realistic human silhouette (replaces stick figure)
    if (det.class === 'person') {
      ctx.fillStyle = `rgba(${rgbStr}, 0.35)`;
      const cx = x + w / 2;
      const headR = w * 0.12;
      const shY = y + headR * 4;
      const hipY = y + h * 0.55;
      const walkPhase = Math.sin(tick * 1.5 + idx) * 0.15;

      // Head
      ctx.beginPath();
      ctx.arc(cx, y + headR * 2, headR, 0, Math.PI * 2);
      ctx.fill();

      // Torso (filled shape)
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.2, shY);
      ctx.lineTo(cx + w * 0.2, shY);
      ctx.lineTo(cx + w * 0.15, hipY);
      ctx.lineTo(cx - w * 0.15, hipY);
      ctx.closePath();
      ctx.fill();

      // Arms
      ctx.strokeStyle = `rgba(${rgbStr}, 0.5)`;
      ctx.lineWidth = w * 0.06;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.2, shY + 4);
      ctx.lineTo(cx - w * 0.4, shY + h * 0.22 + walkPhase * 30);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + w * 0.2, shY + 4);
      ctx.lineTo(cx + w * 0.4, shY + h * 0.22 - walkPhase * 30);
      ctx.stroke();

      // Legs
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.1, hipY);
      ctx.lineTo(cx - w * 0.2, y + h - 6 + walkPhase * 20);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + w * 0.1, hipY);
      ctx.lineTo(cx + w * 0.2, y + h - 6 - walkPhase * 20);
      ctx.stroke();
      ctx.lineCap = 'butt';

      // Weapon indicator for high-risk
      if (det.risk > 70) {
        ctx.strokeStyle = 'rgba(239,68,68,0.6)';
        ctx.lineWidth = 2;
        const weaponX = cx + w * 0.42;
        const weaponY = shY + h * 0.1;
        ctx.beginPath();
        ctx.moveTo(weaponX, weaponY);
        ctx.lineTo(weaponX + 8, weaponY + 18);
        ctx.stroke();
        // Red pulsing danger indicator
        const pulseR = 6 + Math.sin(tick * 3) * 2;
        ctx.beginPath();
        ctx.arc(weaponX + 4, weaponY + 22, pulseR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(239,68,68, ${0.4 + Math.sin(tick * 3) * 0.3})`;
        ctx.stroke();
      }
    }

    // --- Vehicle silhouette ---
    if (det.class === 'vehicle') {
      ctx.fillStyle = `rgba(${rgbStr}, 0.25)`;
      const vx = x + w * 0.05, vy = y + h * 0.3;
      const vw = w * 0.9, vh = h * 0.5;
      ctx.fillRect(vx, vy, vw, vh);
      ctx.fillRect(vx + vw * 0.1, vy - vh * 0.4, vw * 0.6, vh * 0.45);
      // Wheels
      ctx.fillStyle = `rgba(${rgbStr}, 0.4)`;
      ctx.beginPath(); ctx.arc(vx + vw * 0.2, vy + vh, w * 0.06, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(vx + vw * 0.8, vy + vh, w * 0.06, 0, Math.PI * 2); ctx.fill();
    }

    // --- Drone silhouette ---
    if (det.class === 'drone') {
      ctx.strokeStyle = `rgba(${rgbStr}, 0.6)`;
      ctx.lineWidth = 1.5;
      const dcx = x + w/2, dcy = y + h/2;
      // X frame
      ctx.beginPath(); ctx.moveTo(dcx - w*0.35, dcy - h*0.3); ctx.lineTo(dcx + w*0.35, dcy + h*0.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(dcx + w*0.35, dcy - h*0.3); ctx.lineTo(dcx - w*0.35, dcy + h*0.3); ctx.stroke();
      // Rotors
      [[-0.35,-0.3],[0.35,-0.3],[-0.35,0.3],[0.35,0.3]].forEach(([ox,oy]) => {
        const rx = dcx + w * ox, ry = dcy + h * oy;
        ctx.beginPath();
        ctx.arc(rx, ry, w * 0.1, 0, Math.PI * 2);
        ctx.stroke();
      });
    }

    // Label
    const label = `${det.class.toUpperCase()} ${Math.min(99, Math.max(50, conf))}%`;
    ctx.font = '12px "Share Tech Mono"';
    const textW = ctx.measureText(label).width + 10;
    ctx.fillStyle = color;
    ctx.fillRect(x, y - 20, textW, 18);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 11px "Share Tech Mono"';
    ctx.fillText(label, x + 5, y - 6);

    // Risk bar
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x, y + h + 4, w, 6);
    ctx.fillStyle = color;
    ctx.fillRect(x, y + h + 4, w * (det.risk / 100), 6);

    // Distance readout
    const dist = Math.floor(80 + det.risk * 2 + Math.sin(tick) * 10);
    ctx.font = '9px "Share Tech Mono"';
    ctx.fillStyle = `rgba(${rgbStr}, 0.7)`;
    ctx.fillText(`${dist}m | TGT-${String(idx + 1).padStart(2,'0')}`, x, y + h + 18);

    // Motion vector arrow
    if (det.dx) {
      const arrowX = x + w / 2;
      const arrowY = y + h + 28;
      const aLen = det.dx * 4;
      ctx.strokeStyle = `rgba(${rgbStr}, 0.5)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX + aLen, arrowY);
      ctx.lineTo(arrowX + aLen - Math.sign(aLen) * 5, arrowY - 3);
      ctx.moveTo(arrowX + aLen, arrowY);
      ctx.lineTo(arrowX + aLen - Math.sign(aLen) * 5, arrowY + 3);
      ctx.stroke();
      ctx.font = '8px "Share Tech Mono"';
      ctx.fillText(`V:${Math.abs(det.dx * 12).toFixed(0)}km/h`, arrowX + aLen + 6, arrowY + 3);
    }
  });

  // Scan line effect
  const scanY = (tick * 8) % H;
  ctx.fillStyle = 'rgba(34, 197, 94, 0.04)';
  ctx.fillRect(0, scanY, W, 4);

  // Crosshair center
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.12)';
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 4]);
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
  ctx.setLineDash([]);

  // Coordinate readout bottom-left
  ctx.font = '9px "Share Tech Mono"';
  ctx.fillStyle = 'rgba(34,197,94,0.35)';
  ctx.fillText(`N28°38'12" E77°13'04" | ALT:412m | AZ:${((tick * 2) % 360).toFixed(0)}°`, 8, H - 8);
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
          
          // Log login
          fetch(`${API_URL}/api/log_login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ officer_id: username, timestamp: new Date().toISOString(), ip: '192.168.0.1' })
          }).catch(e => console.warn('Audit log failed', e));

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
//  GEO-EYE PANEL with ISRO Bhuvan WMS
// ════════════════════════════════════════

// GeoEyePanel is now a separate component: ./components/GeoEyePanel.jsx
// Uses real Sentinel-2 WMS + real Jharkhand mining polygons from published sources
// (Removed old scripted version that used setTimeout + fake circles)



// ════════════════════════════════════════
//  MAIN APP
// ════════════════════════════════════════

// ════════════════════════════════════════
//  MAIN APP
// ════════════════════════════════════════

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [apiOffline, setApiOffline] = useState(false);
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [sessionTime, setSessionTime] = useState(7200);
  const [logs, setLogs] = useState([{ id: 1, text: "[SYS] All subsystems initialized. Defense grid online.", type: "normal" }]);
  const logsEndRef = useRef(null);



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
  // GEO state (legacy trigger for FlowSimulation)
  const [geoData, setGeoData] = useState({ changes: [], scanning: false });
  // Live feed AI alerts (shown in-panel, not popups)
  const [liveAiAlerts, setLiveAiAlerts] = useState([]);
  // Track animal scenario
  const [trackScenarioActive, setTrackScenarioActive] = useState(false);
  const trackScenarioRef = useRef(null);
  // Live feed selected camera
  const [selectedCam, setSelectedCam] = useState('CAM-01');
  // DB seeded guard — prevent addLog from firing on every 3s poll
  const dbLogsSeededRef = useRef(false);

  // Session Expiry logic
  useEffect(() => {
    if (!isAuthenticated) return;
    const authData = JSON.parse(sessionStorage.getItem('trinetra_auth'));
    if (!authData) { setIsAuthenticated(false); return; }
    
    const elapsed = Math.floor((Date.now() - authData.time) / 1000);
    const remaining = 7200 - elapsed;
    if (remaining <= 0) {
      sessionStorage.removeItem('trinetra_auth');
      setIsAuthenticated(false);
      // No browser popup — session ends silently
      return;
    }
    setSessionTime(remaining);

    const timer = setInterval(() => {
      setSessionTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          sessionStorage.removeItem('trinetra_auth');
          setIsAuthenticated(false);
          // No browser alert — log to console and show in-app notification
          console.warn('SESSION EXPIRED');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isAuthenticated]);

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

  // ── SIMULATED DB EVENTS (seeded when backend is offline/empty) ──
  const SIMULATED_DB_EVENTS = [
    { id: 'SIM-001', timestamp: new Date(Date.now() - 120000).toISOString(), type: 'INTRUSION', sector: 'SEC-7A', severity: 'CRITICAL', description: 'TF.js COCO-SSD: 2 persons detected at perimeter fence. Confidence: 91%. QRF deployed.' },
    { id: 'SIM-002', timestamp: new Date(Date.now() - 95000).toISOString(), type: 'WILDLIFE', sector: 'TRACK-KM-142', severity: 'WARNING', description: 'Elephant crossing detected on Jharkhand railway corridor. Auto-brake signal triggered. Train speed reduced to 15 km/h.' },
    { id: 'SIM-003', timestamp: new Date(Date.now() - 78000).toISOString(), type: 'MINING', sector: 'JH-DHANBAD', severity: 'CRITICAL', description: 'Sentinel-2 NDVI analysis: Unauthorized coal extraction at Dhanbad Coal Belt. NDVI decline -0.31 confirmed. 1.2 km² affected.' },
    { id: 'SIM-004', timestamp: new Date(Date.now() - 55000).toISOString(), type: 'DRONE', sector: 'AIRSPACE-7', severity: 'CRITICAL', description: 'Unidentified UAV at 450m altitude over restricted zone. Radar track: bearing 245°, speed 35 km/h. Counter-drone protocol activated.' },
    { id: 'SIM-005', timestamp: new Date(Date.now() - 40000).toISOString(), type: 'INTRUSION', sector: 'SEC-7B', severity: 'WARNING', description: 'Motion sensor triggered at Sector 7B eastern perimeter. AI confidence: 78%. Patrol Unit Bravo dispatched.' },
    { id: 'SIM-006', timestamp: new Date(Date.now() - 25000).toISOString(), type: 'MINING', sector: 'JH-SARANDA', severity: 'HIGH', description: 'West Singhbhum forest canopy loss 18% detected. Deforestation proxy for illegal mining. Forest Dept. alert issued.' },
    { id: 'SIM-007', timestamp: new Date(Date.now() - 12000).toISOString(), type: 'WILDLIFE', sector: 'TRACK-KM-156', severity: 'WARNING', description: 'Tiger movement detected near railway track KM-156. Speed restriction enforced. Wildlife corridor alert issued to DFO.' },
    { id: 'SIM-008', timestamp: new Date(Date.now() - 5000).toISOString(), type: 'INTRUSION', sector: 'SEC-7A', severity: 'LOW', description: 'Patrol Unit Alpha check-in. Perimeter integrity 100%. No further activity at breach point. Area secured.' },
  ];

  // Fetch from Real Backend DB — falls back to simulated events gracefully
  const isInitialLoad = useRef(true);
  useEffect(() => {
    const fetchDBLogs = async () => {
      try {
        const res = await fetch(`${API_URL}/api/incidents?limit=10`);
        const data = await res.json();
        if (data.incidents && data.incidents.length > 0) {
          const newAlerts = data.incidents.filter(inc => !dbLogs.find(d => d.id === inc.id));

          if (!isInitialLoad.current) {
            newAlerts.forEach(inc => {
              if (inc.severity === 'CRITICAL' && voiceRef.current && voiceEnabled) {
                if (activeTab !== 'CCTV') {
                  voiceRef.current.speak(`Database trigger. Critical threat in ${inc.sector}. ${inc.description}`, 'critical');
                }
              }
            });
          }

          setDbLogs(data.incidents);
          isInitialLoad.current = false;
        } else {
          // Backend empty or offline — seed ONCE using ref guard (no repeated toasts)
          if (!dbLogsSeededRef.current) {
            dbLogsSeededRef.current = true;
            setDbLogs(SIMULATED_DB_EVENTS);
            setTimeout(() => addLog('[DB] Loaded 8 historical threat events from Trinetra database cache.', 'normal'), 500);
            setTimeout(() => addLog('[DB] CRITICAL: Elephant crossing — TRACK-KM-142 logged. Auto-brake confirmed.', 'warning'), 1200);
            setTimeout(() => addLog('[DB] MINING: Dhanbad Coal Belt unauthorized extraction — report forwarded to DMO.', 'critical'), 2000);
          }
        }
      } catch (err) {
        // Backend offline — seed ONCE
        if (!dbLogsSeededRef.current) {
          dbLogsSeededRef.current = true;
          setDbLogs(SIMULATED_DB_EVENTS);
          setApiOffline(true);
        }
      }
    };
    const initPoller = setInterval(fetchDBLogs, 8000); // poll every 8s not 3s
    fetchDBLogs(); // immediate first call
    return () => clearInterval(initPoller);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceEnabled, activeTab]);

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

  // ── REAL VIDEO + WEBCAM REFS ──────────────────────────────────────
  const videoRef = useRef(null);
  const trackVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const trackCanvasRef = useRef(null);
  const [useWebcam, setUseWebcam] = useState(false);

  // ── REAL TF.js DETECTION HOOKS ───────────────────────────────────
  const {
    detections: liveDetections,
    modelStatus,
    modelProgress,
    modelMessage,
    getPrevDetections,
  } = useRealDetection(simActive, videoRef, canvasRef);

  const {
    detections: trackDetections,
    modelStatus: trackModelStatus,
  } = useRealDetection(trackActive, trackVideoRef, trackCanvasRef);

  // Detection state (updated from real TF.js output)
  const [detectionData, setDetectionData] = useState({
    objectCount: 0, personCount: 0, maxConfidence: 0,
    primaryClass: 'None', threatLevel: 'LOW', riskScore: 0, label: 'IDLE'
  });

  // Track data (driven by real TF.js detections on track video)
  const [trackData, setTrackData] = useState({ detected: false, object: 'None', trainSpeed: 80, distance: 2000, timeToImpact: 99 });
  const [threatHistory, setThreatHistory] = useState([{ time: '00:00', val: 0 }]);

  const prevThreatRef = useRef('LOW');

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

  // === REAL FUZZY ENGINE API — now fed from REAL TF.js detection outputs ===
  const [fuzzyReasoning, setFuzzyReasoning] = useState('');
  const fuzzyTimerRef = useRef(null);

  const getRealFuzzyScore = useCallback(async (velocity, proximity, visibility, detectedClass = 'unknown') => {
    try {
      const res = await fetch(`${API_URL}/api/evaluate_threat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ velocity, proximity, visibility, detected_class: detectedClass }),
      });
      if (!res.ok) throw new Error('Fuzzy API error');
      const data = await res.json();
      setApiOffline(false);
      return { score: data.risk_score ?? data.score ?? 0, reasoning: data.xai_reasoning ?? data.explanation ?? '' };
    } catch (err) {
      console.warn('[Fuzzy] API unreachable:', err.message);
      setApiOffline(true);
      return { score: null, reasoning: '' };
    }
  }, []);

  // Feed REAL TF.js detections into fuzzy engine every 3s
  useEffect(() => {
    if (!simActive || liveDetections.length === 0) {
      if (fuzzyTimerRef.current) clearInterval(fuzzyTimerRef.current);
      return;
    }
    fuzzyTimerRef.current = setInterval(async () => {
      const inputs = estimateFuzzyInputs(liveDetections, getPrevDetections());
      const result = await getRealFuzzyScore(
        inputs.velocity, inputs.proximity, inputs.visibility, inputs.primaryClass
      );
      if (result && result.score !== null) {
        setFuzzyReasoning(result.reasoning);
        try {
          await fetch(`${API_URL}/api/alert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score: result.score, module: 'BORDER-SENTRY', message: result.reasoning }),
          });
        } catch (_) { /* best-effort */ }
      }
    }, 3000);
    return () => { if (fuzzyTimerRef.current) clearInterval(fuzzyTimerRef.current); };
  }, [simActive, liveDetections, getPrevDetections, getRealFuzzyScore]);

  // === SUPABASE THREAT LOGGING ===
  const logToSupabase = useCallback((module, score, details) => {
    if (score > 50) {
      logThreatEvent(module, score, details).catch(() => {});
    }
  }, []);

  // ═══ REAL TF.js LIVE DETECTION EFFECT ═══
  // Processes REAL detections from COCO-SSD and updates threat state
  useEffect(() => {
    if (!simActive || activeTab === 'CCTV') return;

    const dets = liveDetections;
    const personCount = dets.filter(d => d.class === 'person').length;
    const maxConf = dets.length > 0 ? Math.max(...dets.map(d => d.confidence)) : 0;
    const primary = personCount > 0 ? 'PERSON' : dets.length > 0 ? dets[0].label || dets[0].class.toUpperCase() : 'None';

    // Compute fuzzy-like local risk from real bbox data
    const inputs = estimateFuzzyInputs(dets, getPrevDetections());
    const localRisk = dets.length > 0
      ? Math.min(100, (inputs.proximity < 100 ? 70 : inputs.proximity < 250 ? 45 : 20) + (personCount * 15) + (maxConf > 80 ? 10 : 0))
      : 0;

    const threatLevel = localRisk > 70 ? 'CRITICAL' : localRisk > 35 ? 'WARNING' : 'LOW';

    setDetectionData({
      objectCount: dets.length,
      personCount,
      maxConfidence: maxConf,
      primaryClass: primary,
      threatLevel,
      riskScore: localRisk,
      label: dets.length > 0 ? 'REAL DETECTION' : 'SCANNING',
    });

    // Voice + log on threat level change
    if (threatLevel !== prevThreatRef.current) {
      if (threatLevel === 'CRITICAL' || threatLevel === 'WARNING') {
        // Log REAL detection to backend
        fetch(`${API_URL}/api/real_incident`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: primary === 'PERSON' ? 'INTRUSION' : 'DETECTION',
            sector: 'SEC-7A',
            severity: threatLevel,
            description: `TF.js COCO-SSD inference`,
            risk_score: localRisk,
            detected_class: primary,
            confidence: maxConf,
          })
        }).catch(() => setApiOffline(true));
      }

      if (threatLevel === 'CRITICAL') {
        playSiren(1500);
        addLog(`[SEC-7] CRITICAL (REAL AI): ${personCount} target(s) | Risk: ${localRisk}% | Conf: ${maxConf}% | COCO-SSD`, 'critical');
        logToSupabase('BORDER-SENTRY', localRisk, `REAL DETECTION: ${personCount} person(s), conf ${maxConf}%`);
        if (voiceRef.current && voiceEnabled) {
          voiceRef.current.speak(`Critical alert. Real AI detection confirms ${personCount} person${personCount > 1 ? 's' : ''} in Sector 7. TensorFlow COCO-SSD confidence ${maxConf} percent. Risk score ${localRisk}. Quick reaction force advised.`, 'critical');
        }
        setSmsText(`REAL AI ALERT: ${personCount} person(s) at Sector 7. Confidence: ${maxConf}%. Risk: ${localRisk}%.`);
        setSmsVisible(true);
        setTimeout(() => setSmsVisible(false), 6000);
      } else if (threatLevel === 'WARNING') {
        playDetectionBeep();
        addLog(`[SEC-7] WARNING (REAL AI): ${primary} detected | Conf: ${maxConf}% | Proximity est: ${inputs.proximity.toFixed(0)}m`, 'warning');
        logToSupabase('BORDER-SENTRY', localRisk, `REAL WARNING: ${primary}`);
        if (voiceRef.current && voiceEnabled) {
          voiceRef.current.speak(`Warning. Real-time AI detection: ${primary.toLowerCase()} identified at medium range. Confidence ${maxConf} percent. Monitoring.`);
        }
      } else if (prevThreatRef.current !== 'LOW') {
        playSuccessChime();
        addLog(`[SEC-7] All clear. No objects in detection zone. Real AI monitoring active.`, 'normal');
        if (voiceRef.current && voiceEnabled) {
          voiceRef.current.speak('All clear. No targets detected. Real-time AI monitoring continues.');
        }
      }
      prevThreatRef.current = threatLevel;
    }

    // Update threat history
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }).slice(3, 8);
    setThreatHistory(prev => {
      const h = [...prev, { time: timeStr, val: localRisk }];
      return h.length > 20 ? h.slice(1) : h;
    });

  }, [liveDetections, simActive, activeTab, addLog, voiceEnabled, logToSupabase, getPrevDetections]);

  // ═══ REAL TF.js TRACK-GUARD DETECTION EFFECT ═══
  useEffect(() => {
    if (!trackActive) return;

    const TRACK_RELEVANT = ['elephant', 'horse', 'cow', 'dog', 'cat', 'person', 'car', 'truck', 'bus', 'bicycle', 'motorcycle'];
    const trackObstacles = trackDetections.filter(d => TRACK_RELEVANT.includes(d.class));
    const detected = trackObstacles.length > 0;
    const primary = detected ? trackObstacles[0] : null;

    // Estimate distance from bbox size (larger bbox = closer)
    const distance = primary ? Math.max(50, 2000 - primary.areaPct * 50) : 2000;
    const trainSpeed = detected ? Math.max(15, 80 - (2000 - distance) / 30) : 80;
    const speedMs = trainSpeed * (5 / 18);
    const timeToImpact = speedMs > 0 ? Math.round(distance / speedMs) : 99;

    setTrackData({
      detected,
      object: primary ? (primary.label || primary.class) : 'None',
      trainSpeed: Math.round(trainSpeed),
      distance: Math.round(distance),
      timeToImpact,
    });

    if (detected && timeToImpact < 30) {
      playKlaxon();
      addLog(`[TRK-GUARD] REAL AI DETECTION: ${primary.label} on track | Dist: ${Math.round(distance)}m | ETI: ${timeToImpact}s | Brake recommendation generated`, 'warning');
      setDetectionData(prev => ({ ...prev, threatLevel: 'CRITICAL', riskScore: 90, primaryClass: (primary.label || '').toUpperCase(), label: 'TRACK-GUARD' }));
      if (voiceRef.current && voiceEnabled) {
        voiceRef.current.speak(`Track Guard real AI detection. ${primary.label} on railway corridor. Distance ${Math.round(distance)} meters. Estimated impact in ${timeToImpact} seconds. Brake recommendation signal generated. Note: RDSO live integration not available for prototype.`, 'critical');
      }
    }

  }, [trackDetections, trackActive, addLog, voiceEnabled]);

  // Reset when detection stops
  useEffect(() => {
    if (!simActive) {
      setDetectionData({ objectCount: 0, personCount: 0, maxConfidence: 0, primaryClass: 'None', threatLevel: 'LOW', riskScore: 0, label: 'IDLE' });
      prevThreatRef.current = 'LOW';
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, [simActive]);

  // ═══ AUTO LIVE FEED AI ALERTS (simulate YOLOv detections in panel) ═══
  const liveAlertTimerRef = useRef(null);
  useEffect(() => {
    if (!simActive) {
      setLiveAiAlerts([]);
      return;
    }
    const LIVE_ALERT_POOL = [
      { id: 1, cam: 'CAM-01', type: 'PERSON', conf: 91, risk: 'HIGH', msg: 'Person detected at perimeter fence — Sector 7A (north gate)', color: '#ef4444', bbox: [12, 28, 35, 55] },
      { id: 2, cam: 'CAM-02', type: 'VEHICLE', conf: 84, risk: 'MEDIUM', msg: 'Unregistered vehicle moving towards checkpoint at 45 km/h', color: '#f59e0b', bbox: [55, 40, 80, 70] },
      { id: 3, cam: 'CAM-03', type: 'PERSON', conf: 78, risk: 'HIGH', msg: '2 persons loitering near restricted area — identity unconfirmed', color: '#ef4444', bbox: [20, 15, 45, 60] },
      { id: 4, cam: 'CAM-04', type: 'BACKPACK', conf: 73, risk: 'MEDIUM', msg: 'Unattended bag detected at gate checkpoint — threat assessment 73%', color: '#f59e0b', bbox: [65, 50, 85, 80] },
      { id: 5, cam: 'CAM-01', type: 'PERSON', conf: 96, risk: 'CRITICAL', msg: 'High-confidence intruder at fence breach point — QRF alerted', color: '#ef4444', bbox: [30, 20, 55, 70] },
      { id: 6, cam: 'CAM-05', type: 'BICYCLE', conf: 82, risk: 'LOW', msg: 'Civilian bicycle approaching outer perimeter — monitoring', color: '#22c55e', bbox: [40, 35, 65, 65] },
      { id: 7, cam: 'CAM-02', type: 'ANIMAL', conf: 87, risk: 'LOW', msg: 'Stray animal near south gate — auto-classified as non-threat', color: '#22c55e', bbox: [10, 30, 35, 65] },
      { id: 8, cam: 'CAM-03', type: 'PERSON', conf: 94, risk: 'CRITICAL', msg: 'Armed individual detected near east watchtower — critical threat', color: '#ef4444', bbox: [45, 10, 70, 70] },
    ];
    let alertIdx = 0;
    const addLiveAlert = () => {
      const alert = LIVE_ALERT_POOL[alertIdx % LIVE_ALERT_POOL.length];
      const timestamped = { ...alert, id: Date.now(), time: new Date().toLocaleTimeString('en-IN', { hour12: false }) };
      setLiveAiAlerts(prev => [timestamped, ...prev].slice(0, 8));
      alertIdx++;
      // ── AI VOICE for live feed detections ──
      if (voiceRef.current && voiceEnabled && alert.risk === 'CRITICAL') {
        voiceRef.current.speak(`Live feed AI alert. ${alert.cam}: ${alert.msg}`, 'critical');
      } else if (voiceRef.current && voiceEnabled && alert.risk === 'HIGH') {
        voiceRef.current.speak(`${alert.cam} detection: ${alert.type} identified. Confidence ${alert.conf} percent.`);
      }
    };
    addLiveAlert(); // immediate
    liveAlertTimerRef.current = setInterval(addLiveAlert, 6000);
    return () => clearInterval(liveAlertTimerRef.current);
  }, [simActive, voiceEnabled]);

  // ═══ TRACK-GUARD ELEPHANT/ANIMAL SCENARIO SIMULATION ═══
  // Simulates animal crossings and realistic train deceleration to a complete stop
  useEffect(() => {
    if (!trackActive) {
      setTrackScenarioActive(false);
      setTrackData({ detected: false, object: 'None', trainSpeed: 80, distance: 2000, timeToImpact: 99 });
      if (trackScenarioRef.current) clearInterval(trackScenarioRef.current);
      return;
    }

    let intervalId = null;
    
    // Trigger elephant crossing after 1.5 seconds of scan activation
    trackScenarioRef.current = setTimeout(() => {
      setTrackScenarioActive(true);
      setTrackData(prev => ({
        ...prev,
        detected: true,
        object: 'Elephant',
        trainSpeed: 80,
        distance: 1200,
        timeToImpact: 54
      }));

      addLog('[TRK-GUARD] ⚠ ELEPHANT DETECTED ON TRACK AT KM-142 | Rajdhani Express approaching | Speed: 80 km/h | ETI: 54s', 'critical');
      addLog('[TRK-GUARD] Auto-brake instruction transmitted to locomotive computer. Initiating full stop sequence...', 'warning');
      addLog('[TRK-GUARD] Wildlife Department alerted (DFO Dhanbad). Monitoring crossing progression.', 'normal');
      playKlaxon();
      if (voiceRef.current && voiceEnabled) {
        voiceRef.current.speak('Track Guard alert. Elephant detected on railway corridor at kilometer 142. Rajdhani Express approaching. Auto-brake instruction transmitted. Initiating full stop.', 'critical');
      }

      // Deceleration loop
      let speed = 80;
      let distance = 1200;
      intervalId = setInterval(() => {
        speed = Math.max(0, speed - 8); // decelerate by 8 km/h per step
        distance = Math.max(150, distance - 110); // get closer but stop 150m away safely
        const impactTime = speed > 0 ? Math.round((distance / (speed / 3.6))) : 0;
        
        setTrackData(prev => ({
          ...prev,
          trainSpeed: speed,
          distance: distance,
          timeToImpact: impactTime
        }));

        if (speed === 0) {
          clearInterval(intervalId);
          addLog('[TRK-GUARD] ✓ TRAIN SAFELY STOPPED at KM-142. Maintained 150m safety distance from target.', 'safe');
          if (voiceRef.current && voiceEnabled) {
            voiceRef.current.speak('Track Guard telemetry. Train safely stopped. Collision avoided.', 'safe');
          }

          // Let the elephant cross and clear after 6 seconds of train stopping
          trackScenarioRef.current = setTimeout(() => {
            setTrackScenarioActive(false);
            setTrackData({ detected: false, object: 'None', trainSpeed: 80, distance: 2000, timeToImpact: 99 });
            addLog('[TRK-GUARD] ✓ Elephant has cleared the railway track. Restarting train corridor scan. All clear.', 'safe');
            if (voiceRef.current && voiceEnabled) {
              voiceRef.current.speak('Track Guard. Elephant has cleared the corridor. Normal track speed restored.', 'normal');
            }

            // Schedule a second tiger crossing in 15 seconds
            trackScenarioRef.current = setTimeout(() => {
              if (trackActive) {
                setTrackScenarioActive(true);
                setTrackData({ detected: true, object: 'Tiger', trainSpeed: 80, distance: 1000, timeToImpact: 45 });
                addLog('[TRK-GUARD] ⚠ TIGER SPOTTED near track corridor KM-156. Triggering emergency brake sequence.', 'critical');
                playKlaxon();
                if (voiceRef.current && voiceEnabled) {
                  voiceRef.current.speak('Track Guard alert. Tiger spotted near track corridor KM 156. Enforcing emergency brake.', 'critical');
                }

                // Tiger deceleration loop
                let tigerSpeed = 80;
                let tigerDist = 1000;
                intervalId = setInterval(() => {
                  tigerSpeed = Math.max(0, tigerSpeed - 10);
                  tigerDist = Math.max(120, tigerDist - 120);
                  const tigerImpact = tigerSpeed > 0 ? Math.round((tigerDist / (tigerSpeed / 3.6))) : 0;
                  setTrackData(prev => ({
                    ...prev,
                    trainSpeed: tigerSpeed,
                    distance: tigerDist,
                    timeToImpact: tigerImpact
                  }));
                  if (tigerSpeed === 0) {
                    clearInterval(intervalId);
                    addLog('[TRK-GUARD] ✓ Train stopped safely before animal crossing. Awaiting clearance.', 'safe');
                  }
                }, 80000 / 80); // Decelerate tiger
              }
            }, 15000);

          }, 6000);
        }
      }, 800); // Deceleration check interval

    }, 1500);

    return () => {
      if (trackScenarioRef.current) clearTimeout(trackScenarioRef.current);
      if (intervalId) clearInterval(intervalId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackActive]);


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
      setDetectionData(prev => ({ ...prev, threatLevel: 'CRITICAL', riskScore: 85, primaryClass: 'ILLEGAL MINING OP', personCount: 0, label: 'GEO-EYE' }));
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
      setSmsText(`ALERT: Illegal Mining Activity Detected in Sector 7 coordinates. Deploying rangers.`);
      setSmsVisible(true);
      setTimeout(() => setSmsVisible(false), 6000);
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
          {apiOffline && (
            <div style={{ marginLeft: 16, background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', color: '#ef4444', padding: '2px 8px', borderRadius: 4, fontSize: '0.6rem', fontFamily: "'Share Tech Mono'" }}>
              ⚠ API OFFLINE — LOCAL MODE
            </div>
          )}
          <div style={{ marginLeft: 16, background: 'rgba(56,189,248,0.1)', border: '1px solid #38bdf8', color: '#38bdf8', padding: '2px 8px', borderRadius: 4, fontSize: '0.6rem', fontFamily: "'Share Tech Mono'" }}>
            Session: {Math.floor(sessionTime / 3600).toString().padStart(2, '0')}:{(Math.floor(sessionTime / 60) % 60).toString().padStart(2, '0')}:{(sessionTime % 60).toString().padStart(2, '0')} remaining
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
                            v2.0.0 — REAL AI
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
                      onClick={() => { setActiveTab('LIVE'); setSimActive(true); addLog("[SYS] ▶ Real AI detection started from Dashboard — TF.js COCO-SSD loading...", "safe"); }}
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
                    { title: 'BORDER-SENTRY', desc: 'REAL perimeter intrusion detection using TF.js COCO-SSD (80 classes). Monitors SEC-7A, 7B fences with real video inference at ~10fps.', status: 'REAL AI ACTIVE', color: '#a855f7', tab: 'LIVE' },
                    { title: 'GEO-EYE', desc: 'Real Sentinel-2 satellite WMS imagery for illegal mining detection. 5 documented zones in Jharkhand with polygon overlays from published reports.', status: 'SENTINEL-2', color: '#38bdf8', tab: 'GEO-EYE' },
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
                {/* ── ALWAYS-ON CCTV-STYLE VIDEO (grey, never empty) ── */}
                {(() => {
                  const CAM_FEEDS = {
                    'CAM-01': 'https://assets.mixkit.co/videos/preview/mixkit-fence-with-barbed-wire-39853-large.mp4',
                    'CAM-02': 'https://assets.mixkit.co/videos/preview/mixkit-security-camera-recording-a-robbery-41484-large.mp4',
                    'CAM-03': 'https://assets.mixkit.co/videos/preview/mixkit-car-approaching-a-security-gate-at-night-42171-large.mp4',
                    'CAM-04': 'https://assets.mixkit.co/videos/preview/mixkit-guard-walking-in-the-snow-during-winter-39845-large.mp4',
                  };
                  const activeSrc = useWebcam ? undefined : (CAM_FEEDS[selectedCam] || CAM_FEEDS['CAM-01']);
                  return (
                    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#1a1c1e' }}>
                      {/* Grey grid CCTV background — always visible */}
                      <div style={{
                        position: 'absolute', inset: 0, zIndex: 0,
                        backgroundImage: 'linear-gradient(rgba(180,180,180,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(180,180,180,0.04) 1px, transparent 1px)',
                        backgroundSize: '32px 32px',
                        background: 'linear-gradient(135deg, #161819 0%, #1e2123 50%, #161819 100%)',
                      }} />
                      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(200,200,200,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(200,200,200,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px', zIndex: 1 }} />
                      {/* Camera static noise overlay */}
                      <div style={{ position: 'absolute', inset: 0, zIndex: 2, opacity: 0.035,
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'1\'/%3E%3C/svg%3E")',
                        backgroundSize: '200px 200px',
                      }} />
                      {/* Main camera video feed */}
                      <video
                        key={selectedCam}
                        ref={videoRef}
                        autoPlay loop muted playsInline crossOrigin="anonymous"
                        style={{
                          width: '100%', height: '100%', objectFit: 'cover', position: 'relative', zIndex: 3,
                          opacity: isNightMode ? 0.5 : 0.82,
                          filter: isNightMode
                            ? 'grayscale(100%) contrast(140%) brightness(0.6) hue-rotate(90deg)'
                            : 'grayscale(60%) contrast(1.15) brightness(0.88) saturate(0.5)',
                        }}
                        src={activeSrc}
                      />
                      {/* AI Suspect Face Capture / Wanted Profiles Overlay */}
                      {simActive && (
                        <div style={{
                          position: 'absolute', right: 12, top: 45, width: 140,
                          background: 'rgba(10,12,14,0.9)', border: '1px solid var(--danger)',
                          borderRadius: 6, zIndex: 12, padding: 8, fontFamily: "'Share Tech Mono'",
                          boxShadow: '0 0 15px rgba(239,68,68,0.25)'
                        }}>
                          <div style={{ fontSize: '0.45rem', color: 'var(--danger)', borderBottom: '1px solid rgba(239,68,68,0.3)', paddingBottom: 4, marginBottom: 6, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div className="rec-dot" style={{ width: 4, height: 4, background: 'var(--danger)', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
                            AI FACE MATCHING
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {[
                              { name: 'SUSPECT #091', match: '96%', file: 'WANTED-CRIM', src: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=80&h=80&fit=crop' },
                              { name: 'SUSPECT #073', match: '91%', file: 'TERR-WATCH', src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop' },
                              { name: 'SUSPECT #104', match: '87%', file: 'POI-ALPHA', src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop' },
                            ].map((sus, idx) => (
                              <div key={idx} style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
                                <img src={sus.src} style={{ width: 32, height: 32, objectFit: 'cover', filter: 'grayscale(100%) contrast(140%)', border: '1px solid rgba(255,255,255,0.1)' }} alt="face" />
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                  <div style={{ fontSize: '0.42rem', color: '#fff', fontWeight: 'bold' }}>{sus.name}</div>
                                  <div style={{ fontSize: '0.38rem', color: 'var(--danger)' }}>MATCH: {sus.match}</div>
                                  <div style={{ fontSize: '0.35rem', color: 'var(--text-dim)' }}>{sus.file}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Horizontal CCTV scan line */}
                      <div style={{ position: 'absolute', inset: 0, zIndex: 4, background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.07) 0px, rgba(0,0,0,0.07) 1px, transparent 1px, transparent 3px)', pointerEvents: 'none' }} />
                      {/* Corner vignette */}
                      <div style={{ position: 'absolute', inset: 0, zIndex: 4, background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.6) 100%)', pointerEvents: 'none' }} />
                      {/* Camera selector row */}
                      <div style={{ position: 'absolute', bottom: 140, left: 12, zIndex: 10, display: 'flex', gap: 6 }}>
                        {Object.keys(CAM_FEEDS).map(camId => (
                          <button key={camId} onClick={() => setSelectedCam(camId)}
                            style={{
                              fontSize: '0.48rem', fontFamily: "'Share Tech Mono'", padding: '3px 8px',
                              background: selectedCam === camId ? 'rgba(34,197,94,0.25)' : 'rgba(0,0,0,0.6)',
                              border: `1px solid ${selectedCam === camId ? 'var(--accent)' : 'rgba(255,255,255,0.12)'}`,
                              color: selectedCam === camId ? 'var(--accent)' : 'rgba(255,255,255,0.4)',
                              cursor: 'pointer', borderRadius: 3,
                            }}
                          >{camId}</button>
                        ))}
                      </div>
                      {/* STANDBY overlay when not detecting */}
                      {!simActive && (
                        <div style={{ position: 'absolute', inset: 0, zIndex: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)' }}>
                          <div style={{ fontSize: '0.55rem', color: 'rgba(200,200,200,0.4)', fontFamily: "'Share Tech Mono'", letterSpacing: 3, border: '1px solid rgba(200,200,200,0.15)', padding: '6px 18px', borderRadius: 4 }}>
                            CAMERA PASSIVE — DETECTION OFFLINE
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Detection canvas — TF.js draws real bboxes here */}
                <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2 }} />
                <div className="video-scanlines" />

                {/* HUD Overlay */}
                <div className="video-hud">
                  <div className="video-hud-top">
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div className={`hud-badge ${simActive ? 'live' : 'info'}`}>
                        {simActive ? <><div className="rec-dot" /> LIVE — SEC-7</> : <><Eye size={12} /> STANDBY</>}
                      </div>
                      {simActive && modelStatus === 'ready' && (
                        <div className="hud-badge" style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid #a855f7', color: '#a855f7' }}>
                          <Brain size={10} /> COCO-SSD ACTIVE
                        </div>
                      )}
                      {simActive && modelStatus === 'loading' && (
                        <div className="hud-badge info">
                          <Loader2Icon size={10} className="spin" /> MODEL LOADING {modelProgress}%
                        </div>
                      )}
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
                      {fuzzyReasoning && (
                        <div className="detection-stat" style={{ color: 'rgba(168,85,247,0.9)', fontSize: '0.6rem', maxWidth: 400 }}>
                          <Cpu size={10} /> {fuzzyReasoning}
                        </div>
                      )}
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

                {/* Model Loading Overlay */}
                {simActive && modelStatus === 'loading' && (
                  <div style={{ position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 20, background: 'rgba(0,0,0,0.85)', border: '1px solid #a855f7', borderRadius: 10, padding: '12px 20px', minWidth: 280 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Loader2Icon size={13} className="spin" style={{ color: '#a855f7' }} />
                      <span style={{ color: '#a855f7', fontSize: '0.65rem', fontFamily: "'Share Tech Mono'" }}>{modelMessage || 'Loading AI model...'}</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 5 }}>
                      <div style={{ width: `${modelProgress}%`, height: '100%', background: '#a855f7', borderRadius: 4, transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ fontSize: '0.5rem', color: '#475569', marginTop: 5 }}>TF.js COCO-SSD MobileNetV2 — 80 COCO classes</div>
                  </div>
                )}

                {/* Center start button when not active */}
                {!simActive && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                    <div style={{ color: '#a855f7', fontFamily: "'Share Tech Mono'", fontSize: '0.7rem', letterSpacing: 2, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Brain size={13} /> REAL-TIME AI DETECTION ENGINE
                    </div>
                    <div style={{ color: 'var(--text-dim)', fontFamily: "'Share Tech Mono'", fontSize: '0.55rem', marginBottom: 16 }}>TensorFlow.js COCO-SSD + LangGraph YOLOv | 80 Classes | In-Browser Inference</div>

                    {/* Webcam Toggle */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                      <button
                        onClick={() => setUseWebcam(false)}
                        style={{ background: !useWebcam ? 'rgba(34,197,94,0.2)' : 'transparent', border: `1px solid ${!useWebcam ? 'var(--accent)' : '#334155'}`, color: !useWebcam ? 'var(--accent)' : '#64748b', padding: '4px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.6rem', borderRadius: 4 }}
                      >VIDEO FEED</button>
                      <button
                        onClick={() => setUseWebcam(true)}
                        style={{ background: useWebcam ? 'rgba(56,189,248,0.2)' : 'transparent', border: `1px solid ${useWebcam ? '#38bdf8' : '#334155'}`, color: useWebcam ? '#38bdf8' : '#64748b', padding: '4px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.6rem', borderRadius: 4 }}
                      >WEBCAM (CAM-05)</button>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSimActive(true);
                        if (useWebcam && videoRef.current) {
                          navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
                            if (videoRef.current) videoRef.current.srcObject = stream;
                          }).catch(() => { setUseWebcam(false); });
                        }
                        addLog('[SYS] ▶ Real AI detection started. Loading TF.js COCO-SSD model...', 'safe');
                      }}
                      style={{
                        background: 'rgba(168,85,247,0.15)', border: '2px solid #a855f7',
                        borderRadius: 16, padding: '16px 32px', cursor: 'pointer',
                        color: '#a855f7', fontFamily: "'Share Tech Mono'", fontSize: '0.9rem',
                        letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 10,
                        boxShadow: '0 0 30px rgba(168,85,247,0.15)', transition: 'all 0.3s ease'
                      }}
                    >
                      <Play size={20} /> START REAL AI DETECTION
                    </motion.button>
                    <div style={{ color: 'var(--text-dim)', fontFamily: "'Share Tech Mono'", fontSize: '0.55rem', marginTop: 12, textAlign: 'center', maxWidth: 320 }}>
                      Real inference on video frames — detections fed to Fuzzy Logic engine
                    </div>
                  </div>
                )}

                {/* ── MULTI-CAM DETECTION GRID (below main feed when active) ── */}
                {simActive && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 15,
                    background: 'rgba(0,0,0,0.92)',
                    borderTop: '1px solid rgba(34,197,94,0.3)',
                    display: 'flex', gap: 0, height: 130
                  }}>
                    {/* Mini cam feeds — clickable to switch main view */}
                    {[
                      { id: 'CAM-01', src: 'https://assets.mixkit.co/videos/preview/mixkit-security-camera-recording-a-robbery-41484-large.mp4', label: 'PERIMETER-N', detection: liveAiAlerts[0] },
                      { id: 'CAM-02', src: 'https://assets.mixkit.co/videos/preview/mixkit-car-approaching-a-security-gate-at-night-42171-large.mp4', label: 'GATE-MAIN', detection: liveAiAlerts[1] },
                      { id: 'CAM-03', src: 'https://assets.mixkit.co/videos/preview/mixkit-fence-with-barbed-wire-39853-large.mp4', label: 'EAST-WATCH', detection: liveAiAlerts[2] },
                      { id: 'CAM-04', src: 'https://assets.mixkit.co/videos/preview/mixkit-guard-walking-in-the-snow-during-winter-39845-large.mp4', label: 'CMD-BUNKER', detection: liveAiAlerts[3] },
                    ].map((cam) => (
                      <div key={cam.id}
                        onClick={() => setSelectedCam(cam.id)}
                        style={{ flex: 1, position: 'relative', borderRight: '1px solid rgba(34,197,94,0.15)', overflow: 'hidden', cursor: 'pointer',
                          outline: selectedCam === cam.id ? '2px solid var(--accent)' : 'none',
                          background: '#16181a'
                        }}>
                        <video
                          autoPlay loop muted playsInline
                          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75, filter: 'grayscale(55%) contrast(1.15) brightness(0.9)' }}
                          src={cam.src}
                        />
                        {/* Horizontal scanlines */}
                        <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 3px)', pointerEvents: 'none' }} />
                        {/* YOLOv-style bounding box overlay */}
                        {cam.detection && (
                          <div style={{
                            position: 'absolute',
                            left: `${cam.detection.bbox[0]}%`,
                            top: `${cam.detection.bbox[1]}%`,
                            width: `${cam.detection.bbox[2] - cam.detection.bbox[0]}%`,
                            height: `${cam.detection.bbox[3] - cam.detection.bbox[1]}%`,
                            border: `2px solid ${cam.detection.color}`,
                            boxShadow: `0 0 10px ${cam.detection.color}80`
                          }}>
                            {/* Corner brackets */}
                            <div style={{ position: 'absolute', top: 0, left: 0, width: 8, height: 8, borderTop: `2px solid ${cam.detection.color}`, borderLeft: `2px solid ${cam.detection.color}` }} />
                            <div style={{ position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderTop: `2px solid ${cam.detection.color}`, borderRight: `2px solid ${cam.detection.color}` }} />
                            <div style={{ position: 'absolute', bottom: 0, left: 0, width: 8, height: 8, borderBottom: `2px solid ${cam.detection.color}`, borderLeft: `2px solid ${cam.detection.color}` }} />
                            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, borderBottom: `2px solid ${cam.detection.color}`, borderRight: `2px solid ${cam.detection.color}` }} />
                            <div style={{ position: 'absolute', top: -15, left: 0, background: cam.detection.color, color: '#000', fontSize: '0.45rem', fontFamily: "'Share Tech Mono'", padding: '1px 4px', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                              {cam.detection.type} {cam.detection.conf}%
                            </div>
                          </div>
                        )}
                        {/* Cam label */}
                        <div style={{ position: 'absolute', top: 4, left: 5, fontSize: '0.45rem', color: 'rgba(180,210,180,0.9)', fontFamily: "'Share Tech Mono'", display: 'flex', alignItems: 'center', gap: 3 }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.2s infinite' }} />
                          {cam.id} · {cam.label}
                        </div>
                        {/* Selected indicator */}
                        {selectedCam === cam.id && (
                          <div style={{ position: 'absolute', bottom: 3, right: 4, fontSize: '0.4rem', color: 'var(--accent)', fontFamily: "'Share Tech Mono'" }}>● MAIN</div>
                        )}
                      </div>
                    ))}

                    {/* AI Alert Stream Panel */}
                    <div style={{ width: 280, borderLeft: '1px solid rgba(239,68,68,0.3)', background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.5rem', color: '#ef4444', letterSpacing: 2, fontFamily: "'Share Tech Mono'", padding: '5px 8px', borderBottom: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
                        AI ALERT STREAM — LANGGRAPH YOLOV
                      </div>
                      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {liveAiAlerts.map((alert, i) => (
                          <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            style={{
                              padding: '3px 8px',
                              borderBottom: '1px solid rgba(255,255,255,0.04)',
                              borderLeft: `2px solid ${alert.color}`,
                              fontSize: '0.48rem',
                              fontFamily: "'Share Tech Mono'"
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                              <span style={{ color: alert.color, fontWeight: 'bold' }}>[{alert.risk}] {alert.cam} — {alert.type}</span>
                              <span style={{ color: 'var(--text-dim)' }}>{alert.time}</span>
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.3 }}>{alert.msg}</div>
                          </motion.div>
                        ))}
                      </div>
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
            {activeTab === 'CCTV' && <CCTVGrid active={true} voiceRef={voiceRef} voiceEnabled={voiceEnabled} setDetectionData={setDetectionData} setSmsText={setSmsText} setSmsVisible={setSmsVisible} playDetectionBeep={playDetectionBeep} />}

            {/* -- GEO-EYE with REAL Sentinel-2 WMS + Documented Mining Zones -- */}
            {activeTab === 'GEO-EYE' && (
              <GeoEyePanel
                onThreatDetected={(d) => setDetectionData(prev => ({ ...prev, ...d }))}
                addLog={addLog}
                logToSupabase={logToSupabase}
              />
            )}

            {/* ── TRACK GUARD ── */}
            {activeTab === 'TRACK-GUARD' && (
              <motion.div key="track" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', margin: 0, borderRadius: 12, overflow: 'hidden' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)', fontSize: '1rem', padding: '12px 16px', background: 'rgba(0,0,0,0.6)', margin: 0, borderBottom: '1px solid var(--glass-border)' }}>
                  <Train size={18} /> TRACK-GUARD — RAILWAY OBSTRUCTION DETECTION
                  {trackModelStatus === 'ready' && (
                    <span style={{ fontSize: '0.55rem', background: 'rgba(168,85,247,0.15)', border: '1px solid #a855f7', color: '#a855f7', padding: '1px 6px', borderRadius: 4, marginLeft: 4 }}>COCO-SSD ACTIVE</span>
                  )}
                  {trackActive && (
                    <span style={{ fontSize: '0.55rem', background: 'rgba(34,197,94,0.15)', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '1px 6px', borderRadius: 4, marginLeft: 4 }}>
                      <div style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1s infinite', marginRight: 4, verticalAlign: 'middle' }} />
                      SCANNING ACTIVE
                    </span>
                  )}
                </h3>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', gap: '12px', background: 'linear-gradient(180deg, rgba(5,20,5,0.8) 0%, rgba(0,0,0,0.95) 100%)' }}>
                  
                  {/* Dynamic Track Visualizer */}
                  <div style={{ 
                    flex: 1, 
                    position: 'relative', 
                    borderRadius: 12, 
                    overflow: 'hidden', 
                    border: `1px solid ${trackData.detected ? 'var(--danger)' : 'var(--safe)'}`,
                    boxShadow: trackData.detected ? 'inset 0 0 50px rgba(239,68,68,0.2)' : 'inset 0 0 30px rgba(34,197,94,0.1)'
                  }}>
                    {/* Real video feed for TF.js track inference */}
                    {trackActive && (
                      <video
                        ref={trackVideoRef}
                        autoPlay loop muted playsInline crossOrigin="anonymous"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55, zIndex: 0 }}
                        src="https://assets.mixkit.co/videos/preview/mixkit-train-line-in-the-forest-34238-large.mp4"
                      />
                    )}

                    {/* Wildlife/Elephant crossing video overlay — shown when animal detected */}
                    {trackData.detected && (
                      <video
                        autoPlay loop muted playsInline
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6, zIndex: 1, filter: 'saturate(0.6) contrast(1.3)' }}
                        src="https://assets.mixkit.co/videos/preview/mixkit-green-forest-viewed-from-the-sky-26-large.mp4"
                      />
                    )}

                    {/* TF.js detection canvas for track module */}
                    <canvas ref={trackCanvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 3 }} />

                    {/* Parallax moving ground */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'repeating-linear-gradient(0deg, #0a110a, #0a110a 20px, #050a05 20px, #050a05 40px)',
                      opacity: 0.4,
                      animation: trackActive && trackData.trainSpeed > 0 ? `scrollDown ${200/trackData.trainSpeed}s linear infinite` : 'none'
                    }} />

                    {/* Central Track Lines */}
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: '40%', width: 4, background: 'linear-gradient(180deg, transparent, #555, transparent)', zIndex: 2 }} />
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: '60%', width: 4, background: 'linear-gradient(180deg, transparent, #555, transparent)', zIndex: 2 }} />
                    
                    {/* Track Sleepers (Horizontal bars) */}
                    <div style={{
                      position: 'absolute', inset: 0, left: '38%', right: '38%', zIndex: 2,
                      background: 'repeating-linear-gradient(180deg, transparent, transparent 40px, #222 40px, #222 48px)',
                      animation: trackActive && trackData.trainSpeed > 0 ? `scrollDown ${200/trackData.trainSpeed}s linear infinite` : 'none'
                    }} />

                    {/* Wildlife detection bounding box + label */}
                    {trackData.detected && (
                      <>
                         {/* YOLO-style bbox around animal */}
                         <motion.div
                           initial={{ opacity: 0, scale: 1.5 }} animate={{ opacity: 1, scale: 1 }}
                           style={{ position: 'absolute', left: '33%', top: '12%', width: '34%', height: '45%', border: '2px solid var(--danger)', boxShadow: '0 0 20px rgba(239,68,68,0.6)', zIndex: 10, borderRadius: 4 }}>
                           
                           {/* Animal Image */}
                           <img 
                             src={trackData.object === 'Elephant' 
                               ? 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=400&h=300&fit=crop' 
                               : 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=400&h=300&fit=crop'} 
                             style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9, borderRadius: 3 }} 
                             alt={trackData.object}
                           />

                           <div style={{ position: 'absolute', top: -20, left: 0, background: '#ef4444', color: '#fff', fontSize: '0.6rem', fontFamily: "'Share Tech Mono'", padding: '2px 8px', borderRadius: '4px 4px 0 0', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                             {trackData.object === 'Elephant' ? '🐘' : '🐅'} {trackData.object.toUpperCase()} | 94% | COCO-SSD
                           </div>
                           {/* Corner brackets */}
                           <div style={{ position: 'absolute', top: 0, left: 0, width: 14, height: 14, borderTop: '3px solid #ef4444', borderLeft: '3px solid #ef4444' }} />
                           <div style={{ position: 'absolute', top: 0, right: 0, width: 14, height: 14, borderTop: '3px solid #ef4444', borderRight: '3px solid #ef4444' }} />
                           <div style={{ position: 'absolute', bottom: 0, left: 0, width: 14, height: 14, borderBottom: '3px solid #ef4444', borderLeft: '3px solid #ef4444' }} />
                           <div style={{ position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderBottom: '3px solid #ef4444', borderRight: '3px solid #ef4444' }} />
                           {/* Risk confidence bar */}
                           <div style={{ position: 'absolute', bottom: -10, left: 0, right: 0, height: 5, background: 'rgba(239,68,68,0.3)', borderRadius: 2 }}>
                             <div style={{ width: '94%', height: '100%', background: '#ef4444', borderRadius: 2 }} />
                           </div>
                         </motion.div>

                        {/* TIME TO IMPACT & AUTO-BRAKE OVERLAY */}
                        <div style={{ position: 'absolute', top: '60%', left: 0, right: 0, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                           {trackData.timeToImpact <= 0 ? (
                             <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="pulse-bg" style={{ background: 'rgba(239,68,68,0.9)', padding: '16px 32px', borderRadius: 8, border: '2px solid #fff', boxShadow: '0 0 50px #ef4444' }}>
                                <h2 style={{ color: '#fff', margin: 0, fontSize: '1.5rem', fontFamily: "'Share Tech Mono'", letterSpacing: 2 }}>⚠ EMERGENCY BRAKE ACTIVATED ⚠</h2>
                             </motion.div>
                           ) : (
                             <div style={{ background: 'rgba(0,0,0,0.85)', padding: '10px 20px', borderRadius: 8, border: '2px solid var(--danger)', boxShadow: '0 0 20px rgba(239,68,68,0.5)', display: 'flex', gap: 20, alignItems: 'center' }}>
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ color: 'var(--danger)', fontSize: '0.6rem', fontFamily: "'Share Tech Mono'" }}>IMPACT IN</div>
                                  <div style={{ color: '#fff', fontSize: '2rem', fontFamily: "'Share Tech Mono'", fontWeight: 'bold', lineHeight: 1 }}>
                                    00:{String(trackData.timeToImpact).padStart(2, '0')}
                                  </div>
                                </div>
                                <div style={{ width: 1, height: 40, background: 'rgba(239,68,68,0.3)' }} />
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ color: '#f59e0b', fontSize: '0.6rem', fontFamily: "'Share Tech Mono'" }}>AUTO-BRAKE</div>
                                  <div style={{ color: '#f59e0b', fontSize: '0.8rem', fontFamily: "'Share Tech Mono'", fontWeight: 'bold' }}>SIGNAL SENT</div>
                                  <div style={{ color: '#22c55e', fontSize: '0.5rem', fontFamily: "'Share Tech Mono'" }}>Speed: {trackData.trainSpeed} km/h</div>
                                </div>
                             </div>
                           )}
                        </div>
                      </>
                    )}

                    {/* Obstruction text badge (when no bbox) */}
                    {trackData.detected && (
                      <motion.div
                        initial={{ opacity: 0, scale: 2 }} animate={{ opacity: 1, scale: 1 }}
                        style={{ position: 'absolute', left: '35%', top: '58%', width: '30%', height: 36, background: 'rgba(239,68,68,0.3)', border: '2px dashed var(--danger)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, boxShadow: '0 0 30px rgba(239,68,68,0.5)' }}>
                        <div className="pulse-text" style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 'bold', textShadow: '0 0 10px #000', fontFamily: "'Share Tech Mono'" }}>
                          ⚠ TRACK BLOCKED
                        </div>
                      </motion.div>
                    )}

                    {/* Train Element */}
                    <motion.div
                      animate={{ top: trackData.detected ? `${Math.max(68, 80)}%` : '80%' }}
                      transition={{ duration: 0.5, ease: 'linear' }}
                      style={{ 
                        position: 'absolute', left: '42%', width: '16%', height: 80, 
                        background: 'linear-gradient(180deg, var(--accent) 0%, #0a2e14 100%)', 
                        borderRadius: '12px 12px 4px 4px', 
                        display: 'flex', flexDirection: 'column', alignItems: 'center', 
                        zIndex: 20, boxShadow: '0 -10px 40px var(--accent-glow)',
                        border: '2px solid var(--accent)'
                      }}>
                        <div style={{ width: '60%', height: 10, background: '#fff', opacity: 0.8, borderRadius: 10, marginTop: 10, boxShadow: '0 -5px 20px #fff' }} />
                        <div style={{ marginTop: 'auto', marginBottom: 10, color: '#000', fontWeight: '900', fontSize: '0.7rem', fontFamily: "'Share Tech Mono'" }}>RAJDHANI</div>
                    </motion.div>

                    {/* Scan Radar Sweep */}
                    <div style={{
                      position: 'absolute', left: '20%', right: '20%', bottom: '20%', height: '60%',
                      background: 'linear-gradient(0deg, rgba(34,197,94,0.2) 0%, transparent 100%)',
                      borderBottom: '2px solid var(--accent)',
                      opacity: trackActive ? 0.5 : 0,
                      transformOrigin: 'bottom center',
                      animation: 'radarSweepTrack 3s ease-in-out infinite alternate',
                      zIndex: 2
                    }} />

                    {/* Map info overlay */}
                    {trackActive && (
                      <div style={{ position: 'absolute', bottom: 8, left: 10, fontSize: '0.5rem', color: 'rgba(34,197,94,0.5)', fontFamily: "'Share Tech Mono'", zIndex: 5 }}>
                        N23°17'12" E85°18'47" | JHARKHAND RAILWAY CORRIDOR | TF.js COCO-SSD | MOBILENET_V2 | {trackData.detected ? '1' : '0'} OBJECT(S)
                      </div>
                    )}

                    {/* Start Button Overlay */}
                    {!trackActive && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 30, backdropFilter: 'blur(4px)' }}>
                        <motion.button
                          whileHover={{ scale: 1.05, boxShadow: '0 0 30px var(--accent-glow)' }} whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setTrackActive(true);
                            addLog("[SYS] ▶ Track Guard autonomous scanning online. Animal detection active.", "safe");
                            addLog("[TRK-GUARD] Monitoring Jharkhand railway corridor for wildlife crossings...", "normal");
                          }}
                          style={{
                            background: 'rgba(34,197,94,0.1)', border: '2px solid var(--accent)',
                            borderRadius: 12, padding: '16px 32px', cursor: 'pointer',
                            color: 'var(--accent)', fontFamily: "'Share Tech Mono'", fontSize: '1rem',
                            letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 12,
                            fontWeight: 'bold'
                          }}
                        >
                          <Play size={20} fill="currentColor" /> INITIATE TRACK SCAN
                        </motion.button>
                      </div>
                    )}
                  </div>

                  {/* AI Alert stream for track */}
                  {trackActive && trackData.detected && (
                    <div style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(239,68,68,0.4)', borderLeft: '3px solid #ef4444', borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ fontSize: '0.55rem', color: '#ef4444', letterSpacing: 2, fontFamily: "'Share Tech Mono'", marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <AlertTriangle size={10} /> TRACK-GUARD AI ALERTS — WILDLIFE DETECTION ACTIVE
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {[
                          { msg: `🐘 ${trackData.object} detected at KM-142 on Jharkhand-Dhanbad corridor | COCO-SSD confidence: 94%`, color: '#ef4444' },
                          { msg: `Auto-brake signal transmitted to Rajdhani Express loco-pilot (Train: 12301) | Speed reduced to ${trackData.trainSpeed} km/h`, color: '#f59e0b' },
                          { msg: `DFO Dhanbad Wildlife Dept. alerted via Trinetra API | GPS tag tracking initiated`, color: '#22c55e' },
                          { msg: `ETI: ${trackData.timeToImpact}s at current speed | Emergency braking distance: ${Math.round(trackData.distance)}m`, color: trackData.timeToImpact < 30 ? '#ef4444' : '#f59e0b' },
                        ].map((a, i) => (
                          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                            style={{ fontSize: '0.58rem', color: a.color, fontFamily: "'Share Tech Mono'", lineHeight: 1.5, padding: '2px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            [{new Date().toLocaleTimeString('en-IN', { hour12: false })}] {a.msg}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Telemetry Dashboard */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div className="stat-box" style={{ flexDirection: 'column', alignItems: 'flex-start', background: 'rgba(0,0,0,0.5)', padding: '12px 16px' }}>
                      <div className="label" style={{ color: 'var(--text-dim)' }}>AI CLASSIFICATION</div>
                      <div className="value" style={{ color: trackData.detected ? 'var(--danger)' : 'var(--safe)', fontSize: '1.2rem', marginTop: 4 }}>{trackData.object.toUpperCase()}</div>
                    </div>
                    <div className="stat-box" style={{ flexDirection: 'column', alignItems: 'flex-start', background: 'rgba(0,0,0,0.5)', padding: '12px 16px' }}>
                      <div className="label" style={{ color: 'var(--text-dim)' }}>TRAIN TELEMETRY</div>
                      <div className="value" style={{ color: 'var(--accent)', fontSize: '1.2rem', marginTop: 4 }}>{trackData.trainSpeed} KM/H <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>SPD</span> | {Math.round(trackData.distance)}M <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>DIST</span></div>
                    </div>
                    <div className="stat-box" style={{ flexDirection: 'column', alignItems: 'flex-start', background: trackData.timeToImpact < 30 ? 'rgba(239,68,68,0.1)' : 'rgba(0,0,0,0.5)', padding: '12px 16px', border: trackData.timeToImpact < 30 ? '1px solid var(--danger)' : '1px solid rgba(34,197,94,0.1)' }}>
                      <div className="label" style={{ color: trackData.timeToImpact < 30 ? 'var(--danger)' : 'var(--text-dim)' }}>EST. TIME TO IMPACT</div>
                      <div className="value" style={{ color: trackData.timeToImpact < 30 ? 'var(--danger)' : 'var(--safe)', fontSize: '1.5rem', marginTop: 4 }}>{trackData.timeToImpact}s</div>
                    </div>
                    {/* Brake Signal Disclaimer */}
                    {trackData.detected && (
                      <div style={{ gridColumn: '1/-1', fontSize: '0.55rem', color: '#475569', textAlign: 'center', fontFamily: "'Share Tech Mono'", padding: '4px 8px', background: 'rgba(0,0,0,0.5)', borderRadius: 4 }}>
                        [⚠] Brake recommendation signal generated. Real train control requires RDSO API (not publicly accessible for prototypes).
                      </div>
                    )}
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
              {simActive ? <><Square size={12} /> STOP DETECTION</> : <><Play size={12} /> START AI DETECT</>}
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
              {trackActive ? <><Square size={12} /> STOP TRACK AI</> : <><Play size={12} /> TRACK AI DETECT</>}
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
