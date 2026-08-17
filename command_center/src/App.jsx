/* eslint-disable react/prop-types */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Activity, AlertTriangle, Fingerprint, Lock,
  Map as MapIcon, Video, Target, Radio, Scan, Train, Download, Terminal,
  BarChart3, Eye, Users, Play, Square, Volume2, VolumeX, LayoutDashboard, Cpu, Wifi, MapPin, Clock, Loader2 as Loader2Icon, Satellite, Brain, Zap, Sparkles
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { logThreatEvent } from './lib/supabase';

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
import TrackGuardPanel from './components/TrackGuardPanel';
import LiveFeedPanel from './components/LiveFeedPanel';

// ═══════════════════════════════════════════════════
//  CONFIGURATION & CONSTANTS
// ═══════════════════════════════════════════════════
const API_URL = import.meta.env.PROD
  ? 'https://backend-ten-fawn-25.vercel.app'
  : 'http://127.0.0.1:5000';

// ─── Typewriter Effect Component ───
const TypewriterText = ({ text }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(prev => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 12);
    return () => clearInterval(timer);
  }, [text]);

  return <span>{displayedText}</span>;
};

// ─── Officer Login / Military Gatekeeper ───
const OfficerLogin = ({ onAuthenticate }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isRegistering) {
      if (!username || !password || !serviceId) {
        setError('ALL CREDENTIAL FIELDS REQUIRED');
        return;
      }
      const existing = JSON.parse(localStorage.getItem('trinetra_officers') || '[]');
      if (existing.find(o => o.username === username)) {
        setError('OFFICER USERNAME ALREADY ASSIGNED');
        return;
      }
      existing.push({ username, password, serviceId, rank: 'LIEUTENANT' });
      localStorage.setItem('trinetra_officers', JSON.stringify(existing));
      setError('OFFICER REGISTERED — PLEASE AUTHENTICATE');
      setIsRegistering(false);
      return;
    }

    if (
      (username === 'admin' && password === 'admin') ||
      (username === 'commander' && password === 'trinetra2026') ||
      (username === 'drishti' && password === 'rakshak123')
    ) {
      sessionStorage.setItem('trinetra_auth', JSON.stringify({ user: username, rank: 'COMMANDER', time: Date.now() }));
      onAuthenticate(true);
      return;
    }

    const existing = JSON.parse(localStorage.getItem('trinetra_officers') || '[]');
    const match = existing.find(o => o.username === username && o.password === password);
    if (match) {
      sessionStorage.setItem('trinetra_auth', JSON.stringify({ user: match.username, rank: match.rank, time: Date.now() }));
      onAuthenticate(true);
    } else {
      setError('INVALID SERVICE CREDENTIALS // ACCESS DENIED');
    }
  };

  const handleBypass = () => {
    sessionStorage.setItem('trinetra_auth', JSON.stringify({ user: 'DIRECTOR_GENERAL', rank: 'CHIEF', time: Date.now() }));
    onAuthenticate(true);
  };

  return (
    <div className="login-overlay">
      <div className="topo-bg" />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="login-card"
        style={{ position: 'relative', zIndex: 10, background: 'rgba(5,15,10,0.92)', border: '2px solid var(--accent)', padding: '2rem', borderRadius: 16, maxWidth: 420, width: '90%' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
          <div style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 0 10px var(--accent-glow))' }}>🛡️</div>
          <h2 style={{ fontFamily: "'Share Tech Mono'", color: 'var(--accent)', letterSpacing: 3, margin: '0.4rem 0 0.1rem', fontSize: '1.3rem' }}>
            TRINETRA RAKSHAK
          </h2>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: 2 }}>
            DEFENSE SURVEILLANCE & OVERWATCH PORTAL
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {isRegistering && (
            <div>
              <label style={{ fontSize: '0.6rem', color: 'var(--accent)', letterSpacing: 1 }}>SERVICE ID / BATCH NO</label>
              <input
                type="text"
                placeholder="e.g. IND-ARMY-9824"
                value={serviceId}
                onChange={e => setServiceId(e.target.value)}
                style={{ width: '100%', background: 'rgba(0,0,0,0.6)', border: '1px solid var(--glass-border)', color: '#fff', padding: '0.6rem', borderRadius: 6, fontFamily: "'Share Tech Mono'", fontSize: '0.75rem' }}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.6rem', color: 'var(--accent)', letterSpacing: 1 }}>OFFICER CALLSIGN / USERNAME</label>
            <input
              type="text"
              placeholder="e.g. drishti or admin"
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{ width: '100%', background: 'rgba(0,0,0,0.6)', border: '1px solid var(--glass-border)', color: '#fff', padding: '0.6rem', borderRadius: 6, fontFamily: "'Share Tech Mono'", fontSize: '0.75rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.6rem', color: 'var(--accent)', letterSpacing: 1 }}>SECURITY PASSCODE</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', background: 'rgba(0,0,0,0.6)', border: '1px solid var(--glass-border)', color: '#fff', padding: '0.6rem', borderRadius: 6, fontFamily: "'Share Tech Mono'", fontSize: '0.75rem' }}
            />
          </div>

          {error && <div style={{ color: error.includes('REGISTERED') ? 'var(--safe)' : 'var(--danger)', fontSize: '0.65rem', fontFamily: "'Share Tech Mono'" }}>{error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              type="submit"
              style={{ flex: 1, background: 'rgba(34,197,94,0.15)', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '10px', borderRadius: 6, cursor: 'pointer', fontFamily: "'Share Tech Mono'", fontWeight: 'bold', fontSize: '0.75rem' }}
            >
              {isRegistering ? 'REGISTER OFFICER' : 'AUTHENTICATE'}
            </button>
            <button
              type="button"
              onClick={handleBypass}
              style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid #38bdf8', color: '#38bdf8', padding: '10px 14px', borderRadius: 6, cursor: 'pointer', fontFamily: "'Share Tech Mono'", fontSize: '0.75rem' }}
            >
              CHIEF BYPASS
            </button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <span
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            style={{ fontSize: '0.6rem', color: 'var(--text-dim)', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isRegistering ? '← Return to Login' : 'Register New Officer Access'}
          </span>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Navigation Tabs ───
const TABS = [
  { id: 'DASHBOARD', icon: LayoutDashboard, label: 'DASHBOARD' },
  { id: 'LIVE', icon: Video, label: 'LIVE FEED' },
  { id: 'DISPATCH', icon: Zap, label: 'INTEL OPS' },
  { id: 'CCTV', icon: Users, label: 'CCTV GRID' },
  { id: 'GEO-EYE', icon: MapIcon, label: 'GEO-EYE GIS' },
  { id: 'TRACK-GUARD', icon: Train, label: 'TRACK-GUARD' },
  { id: 'ANALYTICS', icon: BarChart3, label: 'ANALYTICS' },
];

// ═══════════════════════════════════════════════════
//  MAIN COMMAND CENTER APPLICATION
// ═══════════════════════════════════════════════════
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [sessionTime, setSessionTime] = useState(7200);
  const [logs, setLogs] = useState([
    { id: 1, text: "[SYS] All subsystems initialized. Real AI Defense Grid online.", type: "safe" }
  ]);
  const logsEndRef = useRef(null);

  // Operational States
  const [isNightMode, setIsNightMode] = useState(false);
  const [walkieOpen, setWalkieOpen] = useState(false);
  const [simActive, setSimActive] = useState(true);
  const [trackActive, setTrackActive] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [analystOpen, setAnalystOpen] = useState(false);

  // Live Detection Telemetry
  const [detectionData, setDetectionData] = useState({
    objectCount: 1,
    personCount: 1,
    threatLevel: 'WARNING',
    riskScore: 68,
    primaryClass: 'PERSON',
    maxConfidence: 94,
    label: 'BORDER SENTRY ALPHA'
  });

  const [trackData, setTrackData] = useState({
    detected: true,
    object: 'ASIAN ELEPHANT',
    distance: 780,
    timeToImpact: 26,
    trainSpeed: 110
  });

  const [fuzzyReasoning, setFuzzyReasoning] = useState('Elevated proximity detected at perimeter sector.');
  const [dbLogs, setDbLogs] = useState([]);
  const [smsVisible, setSmsVisible] = useState(false);
  const [smsText, setSmsText] = useState("");
  const [threatHistory, setThreatHistory] = useState([
    { time: '21:30', val: 12 }, { time: '21:32', val: 18 }, { time: '21:34', val: 45 }, { time: '21:36', val: 78 }, { time: '21:38', val: 68 }
  ]);

  const voiceRef = useRef(null);

  // Initialize Audio Voice System
  useEffect(() => {
    voiceRef.current = new AIVoiceSystem();
    return () => voiceRef.current?.destroy();
  }, []);

  const addLog = useCallback((text, type = "normal") => {
    setLogs(prev => [...prev.slice(-30), { id: Date.now() + Math.random(), text, type }]);
  }, []);

  const logToSupabase = useCallback(async (module, risk, details) => {
    try {
      await logThreatEvent({ module, riskScore: risk, details });
    } catch (_) {}
  }, []);

  // Sync Threat History to Timeline
  useEffect(() => {
    const interval = setInterval(() => {
      const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
      setThreatHistory(prev => [...prev.slice(-12), { time: timeStr, val: detectionData.riskScore }]);
    }, 4000);
    return () => clearInterval(interval);
  }, [detectionData.riskScore]);

  // Session Expiry logic
  useEffect(() => {
    if (!isAuthenticated) return;
    const authData = JSON.parse(sessionStorage.getItem('trinetra_auth'));
    if (!authData) { setIsAuthenticated(false); return; }

    const timer = setInterval(() => {
      setSessionTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          sessionStorage.removeItem('trinetra_auth');
          setIsAuthenticated(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isAuthenticated]);

  // Fetch Database Logs
  useEffect(() => {
    const fetchDBLogs = async () => {
      try {
        const res = await fetch(`${API_URL}/api/incidents?limit=8`);
        const data = await res.json();
        if (data.incidents) {
          setDbLogs(data.incidents);
        }
      } catch (_) {}
    };
    fetchDBLogs();
    const interval = setInterval(fetchDBLogs, 4000);
    return () => clearInterval(interval);
  }, []);

  const triggerBackendSim = async (scenario) => {
    try {
      addLog(`[SYSTEM] Dispatching ${scenario} tactical telemetry...`, 'warning');
      await fetch(`${API_URL}/api/simulation/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, count: 2 })
      });
    } catch (_) {}
  };

  const isAlert = detectionData.threatLevel === 'CRITICAL' || detectionData.riskScore > 75;

  return (
    <div className={`command-center ${isNightMode ? 'night-vision' : ''}`}>
      {!isAuthenticated && <OfficerLogin onAuthenticate={setIsAuthenticated} />}

      <WalkieTalkie open={walkieOpen} onClose={() => setWalkieOpen(false)} addLog={addLog} />
      <MobileAlert visible={smsVisible} text={smsText} onClose={() => setSmsVisible(false)} />
      <AIThreatAnalyst open={analystOpen} onClose={() => setAnalystOpen(false)} detectionData={detectionData} />

      {/* ═══ TOP MILITARY HEADER BAR ═══ */}
      <div className="command-header">
        <div className="header-left">
          <div className="badge-logo"><Shield size={20} /></div>
          <div>
            <div className="app-title">
              TRINETRA RAKSHAK <span className="text-dim" style={{ fontSize: '0.65rem' }}>// त्रिनेत्र रक्षक</span>
            </div>
            <div className="app-subtitle">
              AUTONOMOUS DEFENSE & RECONNAISSANCE COMMAND OVERWATCH • SEC-7
            </div>
          </div>
        </div>

        <div className="header-center">
          <div className="session-pill">
            <Clock size={12} />
            <span>SESSION: {Math.floor(sessionTime / 60).toString().padStart(2, '0')}:{(sessionTime % 60).toString().padStart(2, '0')}</span>
          </div>
        </div>

        <div className="header-right">
          <div className={`status-indicator ${isAlert ? 'critical' : 'all-clear'}`}>
            <span className="rec-dot" style={{ background: isAlert ? 'var(--danger)' : 'var(--safe)' }} />
            {isAlert ? 'THREAT DETECTED' : 'ALL CLEAR'}
          </div>
          <LiveClock />
        </div>
      </div>

      {/* ═══ NAVIGATION TAB BAR ═══ */}
      <div className="tab-bar">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ═══ MAIN WORKSPACE VIEWPORT ═══ */}
      <div className="main-grid">
        <div className="viewport-panel">
          <AnimatePresence mode="wait">
            {/* ── DASHBOARD OVERVIEW ── */}
            {activeTab === 'DASHBOARD' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, padding: 12, overflowY: 'auto' }}
              >
                {/* Welcome Tactical Banner */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(34,197,94,0.14) 0%, rgba(5,20,10,0.95) 100%)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 12,
                  padding: '22px 28px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                }}>
                  <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                    <div style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 0 15px var(--accent-glow))' }}>🛡️</div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ fontFamily: "'Share Tech Mono'", fontSize: '1.1rem', color: 'var(--accent)', letterSpacing: 2, fontWeight: 'bold' }}>
                          TRINETRA RAKSHAK — DEFENSE COMMAND
                        </div>
                        <div style={{ fontSize: '0.6rem', background: 'rgba(34,197,94,0.25)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--accent)' }}>
                          v2.0 REAL AI
                        </div>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 4, maxWidth: '640px', lineHeight: 1.5 }}>
                        Real-time neural overwatch for border security, Indian Railways Kavach wildlife collision avoidance, and Sentinel-2 satellite mining surveillance.
                      </div>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => { setActiveTab('LIVE'); setSimActive(true); addLog("[SYS] ▶ Switched to Live Surveillance Deck.", "safe"); }}
                    style={{
                      background: 'rgba(34,197,94,0.18)', border: '2px solid var(--accent)', borderRadius: 10,
                      padding: '14px 28px', cursor: 'pointer', color: 'var(--accent)', fontFamily: "'Share Tech Mono'",
                      fontSize: '0.9rem', fontWeight: 'bold', letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 10,
                      boxShadow: '0 0 25px rgba(34,197,94,0.25)'
                    }}
                  >
                    <Play size={18} /> GO LIVE FEED
                  </motion.button>
                </div>

                {/* Live News Headlines Ticker */}
                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.85)', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(34,197,94,0.3)' }}>
                  <div style={{ background: 'var(--accent)', color: '#000', padding: '8px 18px', fontSize: '0.75rem', fontWeight: 'bold', fontFamily: "'Share Tech Mono'", display: 'flex', alignItems: 'center' }}>
                    ⚡ DISPATCH
                  </div>
                  <div style={{ flex: 1, padding: '8px 12px', display: 'flex', alignItems: 'center' }}>
                    <marquee scrollamount="5" style={{ color: '#fff', fontFamily: "'Share Tech Mono'", fontSize: '0.8rem' }}>
                      [PERIMETER] SEC-7A Sentry Online • [RAILWAY] KM-142 Wildlife Sensor Mast Linked to Kavach ATP • [GEO-EYE] Sentinel-2 Pass Synced (5 Mining Polygons Loaded) • [AI] TensorFlow.js COCO-SSD MobileNetV2 Active
                    </marquee>
                  </div>
                </div>

                {/* Subsystem Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {[
                    { title: 'BORDER SENTRY ALPHA', desc: 'Perimeter optical & FLIR thermal intrusion detection. Tracks hostile intruders and fences.', status: 'REAL AI ACTIVE', color: 'var(--accent)', tab: 'LIVE' },
                    { title: 'KAVACH RAILWAY OVERWATCH', desc: 'Asian elephant and wildlife collision prevention. Laser rangefinder & pneumatic brake dump.', status: 'KAVACH ONLINE', color: 'var(--safe)', tab: 'TRACK-GUARD' },
                    { title: 'GEO-EYE SATELLITE GIS', desc: 'Sentinel-2 multispectral NDVI terrain subtraction for illegal mining in Jharkhand.', status: 'SENTINEL-2 SYNCED', color: '#38bdf8', tab: 'GEO-EYE' }
                  ].map((mod, i) => (
                    <div
                      key={i}
                      onClick={() => setActiveTab(mod.tab)}
                      style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: 14, cursor: 'pointer', transition: 'border-color 0.2s' }}
                    >
                      <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff', marginBottom: 4, fontFamily: "'Share Tech Mono'" }}>{mod.title}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.4, marginBottom: 8 }}>{mod.desc}</div>
                      <div style={{ fontSize: '0.6rem', color: mod.color, fontFamily: "'Share Tech Mono'", fontWeight: 'bold' }}>● {mod.status}</div>
                    </div>
                  ))}
                </div>

                {/* Tactical Response Runners */}
                <FlowSimulationDashboard
                  setActiveTab={setActiveTab}
                  setSimActive={setSimActive}
                  setTrackActive={setTrackActive}
                  triggerBackendSim={triggerBackendSim}
                  addLog={addLog}
                />
              </motion.div>
            )}

            {/* ── LIVE FEED ── */}
            {activeTab === 'LIVE' && (
              <LiveFeedPanel
                simActive={simActive}
                setSimActive={setSimActive}
                detectionData={detectionData}
                setDetectionData={setDetectionData}
                fuzzyReasoning={fuzzyReasoning}
                isNightMode={isNightMode}
                voiceRef={voiceRef}
                voiceEnabled={voiceEnabled}
                addLog={addLog}
                logToSupabase={logToSupabase}
              />
            )}

            {/* ── INTEL OPS & INCIDENT DISPATCH ── */}
            {activeTab === 'DISPATCH' && (
              <motion.div
                key="dispatch"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, padding: 14, overflowY: 'auto' }}
              >
                <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: 18 }}>
                  <div style={{ fontSize: '1.1rem', fontFamily: "'Share Tech Mono'", color: 'var(--accent)', fontWeight: 'bold', letterSpacing: 2, marginBottom: 4 }}>
                    TACTICAL DISPATCH & INCIDENT OPERATIONS
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: 16 }}>
                    Trigger automated defense protocols across the national security grid and synchronize telemetry to SQLite DB.
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    <div
                      className="cyber-border"
                      style={{ padding: 14, background: 'rgba(239,68,68,0.08)', borderRadius: 8, cursor: 'pointer' }}
                      onClick={() => triggerBackendSim('INTRUSION')}
                    >
                      <div style={{ color: 'var(--danger)', fontSize: '0.9rem', fontFamily: "'Share Tech Mono'", fontWeight: 'bold', marginBottom: 6 }}>
                        <Lock size={14} style={{ verticalAlign: 'middle' }} /> QRF DISPATCH
                      </div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.65rem' }}>Mobilize Quick Reaction Force to Sector 7A perimeter.</div>
                    </div>

                    <div
                      className="cyber-border"
                      style={{ padding: 14, background: 'rgba(34,197,94,0.08)', borderRadius: 8, cursor: 'pointer' }}
                      onClick={() => triggerBackendSim('WILDLIFE')}
                    >
                      <div style={{ color: 'var(--safe)', fontSize: '0.9rem', fontFamily: "'Share Tech Mono'", fontWeight: 'bold', marginBottom: 6 }}>
                        <Train size={14} style={{ verticalAlign: 'middle' }} /> KAVACH RAILWAY
                      </div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.65rem' }}>Transmit emergency brake signal for elephant on track KM-142.</div>
                    </div>

                    <div
                      className="cyber-border"
                      style={{ padding: 14, background: 'rgba(168,85,247,0.08)', borderRadius: 8, cursor: 'pointer' }}
                      onClick={() => triggerBackendSim('DRONE')}
                    >
                      <div style={{ color: '#a855f7', fontSize: '0.9rem', fontFamily: "'Share Tech Mono'", fontWeight: 'bold', marginBottom: 6 }}>
                        <Radio size={14} style={{ verticalAlign: 'middle' }} /> DRONE INTERCEPT
                      </div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.65rem' }}>Scramble counter-UAV air defense sensor over airspace.</div>
                    </div>

                    <div
                      className="cyber-border"
                      style={{ padding: 14, background: 'rgba(56,189,248,0.08)', borderRadius: 8, cursor: 'pointer' }}
                      onClick={() => triggerBackendSim('MINING')}
                    >
                      <div style={{ color: '#38bdf8', fontSize: '0.9rem', fontFamily: "'Share Tech Mono'", fontWeight: 'bold', marginBottom: 6 }}>
                        <MapIcon size={14} style={{ verticalAlign: 'middle' }} /> SATELLITE NOTICE
                      </div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.65rem' }}>Generate legal notice for illegal excavation polygon in Jharia.</div>
                    </div>
                  </div>
                </div>

                {/* Live Database Stream */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(15,23,42,0.8)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: '0.9rem', fontFamily: "'Share Tech Mono'", color: '#fff', fontWeight: 'bold' }}>
                      LIVE DATABASE EVENT STREAM (SQLITE & SUPABASE)
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--accent)' }}>SYNCED • 8 INCIDENTS</div>
                  </div>
                  <div style={{ flex: 1, minHeight: 200, background: 'rgba(0,0,0,0.8)', borderRadius: 8, padding: 12, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {dbLogs.length === 0 && <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Connected to SQLite DB. Awaiting event logs...</div>}
                    {dbLogs.map((log, i) => (
                      <div key={i} style={{ fontSize: '0.65rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 6 }}>
                        <span style={{ color: 'var(--accent)', fontFamily: "'Share Tech Mono'" }}>[{log.timestamp}]</span>
                        <span style={{ color: log.severity === 'CRITICAL' ? 'var(--danger)' : log.severity === 'WARNING' ? 'var(--warning)' : 'var(--safe)', marginLeft: 8, fontWeight: 'bold' }}>
                          {log.type} // {log.sector} // {log.severity}
                        </span>
                        <div style={{ color: 'var(--text-dim)', marginTop: 2 }}>{log.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── CCTV GRID ── */}
            {activeTab === 'CCTV' && (
              <CCTVGrid
                active={true}
                voiceRef={voiceRef}
                voiceEnabled={voiceEnabled}
                setDetectionData={setDetectionData}
                setSmsText={setSmsText}
                setSmsVisible={setSmsVisible}
                playDetectionBeep={playDetectionBeep}
              />
            )}

            {/* ── GEO-EYE GIS SATELLITE ── */}
            {activeTab === 'GEO-EYE' && (
              <GeoEyePanel
                onThreatDetected={(d) => setDetectionData(prev => ({ ...prev, ...d }))}
                addLog={addLog}
                logToSupabase={logToSupabase}
              />
            )}

            {/* ── TRACK-GUARD RAILWAY OVERWATCH ── */}
            {activeTab === 'TRACK-GUARD' && (
              <TrackGuardPanel
                trackActive={trackActive}
                setTrackActive={setTrackActive}
                trackData={trackData}
                setTrackData={setTrackData}
                addLog={addLog}
                voiceRef={voiceRef}
                voiceEnabled={voiceEnabled}
                logToSupabase={logToSupabase}
              />
            )}

            {/* ── ANALYTICS ── */}
            {activeTab === 'ANALYTICS' && <AnalyticsDashboard />}
          </AnimatePresence>
        </div>

        {/* ═══ RIGHT CONTROL & TELEMETRY SIDEBAR ═══ */}
        <div className="control-panel">
          {/* Quick AI & Mode Toggles */}
          <div style={{ display: 'flex', gap: 6 }}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className={`nav-btn ${simActive ? 'btn-danger' : ''}`}
              style={{ flex: 1, padding: '8px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onClick={() => {
                setSimActive(!simActive);
                addLog(simActive ? '[SYS] ■ Perimeter AI stopped.' : '[SYS] ▶ Perimeter AI started.', 'safe');
              }}
            >
              {simActive ? <><Square size={12} /> STOP AI DETECT</> : <><Play size={12} /> START AI DETECT</>}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              className={`nav-btn ${trackActive ? 'btn-danger' : ''}`}
              style={{ flex: 1, padding: '8px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onClick={() => {
                setTrackActive(!trackActive);
                addLog(trackActive ? '[SYS] ■ Track Guard stopped.' : '[SYS] ▶ Track Guard started.', 'safe');
              }}
            >
              {trackActive ? <><Square size={12} /> STOP TRACK</> : <><Play size={12} /> TRACK AI DETECT</>}
            </motion.button>
          </div>

          {/* Threat History Graph */}
          <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: 8, border: '1px solid var(--glass-border)' }}>
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
          <QuickActions addLog={addLog} playPing={playHighPitchAlarm} />
          <div className="sidebar-divider" />

          {/* AI Voice & Test Breach */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <NightVisionToggle isNightMode={isNightMode} onToggle={() => setIsNightMode(!isNightMode)} />
            <button
              className={`nav-btn ${voiceEnabled ? '' : 'btn-danger'}`}
              style={{ width: '100%', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onClick={() => {
                const s = !voiceEnabled;
                setVoiceEnabled(s);
                if (voiceRef.current) voiceRef.current.enabled = s;
                addLog(`[SYS] AI Voice ${s ? 'ENABLED' : 'MUTED'}`, 'normal');
              }}
            >
              {voiceEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
              {voiceEnabled ? 'AI VOICE: ACTIVE' : 'AI VOICE: MUTED'}
            </button>
            <button
              className="nav-btn btn-danger"
              style={{ width: '100%', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onClick={() => {
                setDetectionData(prev => ({ ...prev, threatLevel: 'CRITICAL', riskScore: 98, primaryClass: 'HOSTILE INTRUDER', personCount: 1, label: 'SECTOR-7A' }));
                addLog("[SYS] ⚠ TACTICAL ALERT: Intruder breach triggered at Sector 7A.", "critical");
                playSiren(2000);
                if (voiceRef.current && voiceEnabled) voiceRef.current.speak('Critical alert! Perimeter breach detected at Sector 7A. Scrambling Quick Reaction Force.', 'critical');
              }}
            >
              <AlertTriangle size={12} /> TRIGGER EMERGENCY BREACH
            </button>
          </div>

          <div className="sidebar-divider" />
          <PersonnelRoster />
          <div className="sidebar-divider" />
          <WeatherWidget />
          <div className="sidebar-divider" />
          <IncidentTimeline logs={logs} />

          {/* Console Output Log */}
          <div style={{ flex: 1, minHeight: 120, overflowY: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div className="console-font" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <AnimatePresence initial={false}>
                {logs.slice(-8).map(log => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`log-entry ${log.type === 'critical' ? 'critical' : log.type === 'warning' ? 'warning' : ''}`}
                  >
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
