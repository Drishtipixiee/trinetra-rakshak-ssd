/* eslint-disable react/prop-types */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Activity, AlertTriangle, Fingerprint, Lock,
  Map as MapIcon, Video, Target, Radio, Scan, Train, Download, Terminal,
  BarChart3, Eye, Users, Play, Square, Volume2, VolumeX, LayoutDashboard, Cpu, Wifi, MapPin, Clock, Loader2 as Loader2Icon, Satellite, Brain, Zap, Sparkles, MessageSquare, Mic
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
    }, 10);
    return () => clearInterval(timer);
  }, [text]);

  return <span>{displayedText}</span>;
};

// ─── Navigation Tabs ───
const TABS = [
  { id: 'DASHBOARD', icon: LayoutDashboard, label: 'DASHBOARD' },
  { id: 'LIVE', icon: Video, label: 'LIVE FEED' },
  { id: 'SIMULATION', icon: Terminal, label: 'INCIDENT OPS' },
  { id: 'CCTV', icon: Users, label: 'CCTV GRID' },
  { id: 'GEO-EYE', icon: MapIcon, label: 'GEO-EYE GIS' },
  { id: 'TRACK-GUARD', icon: Train, label: 'TRACK-GUARD' },
  { id: 'ANALYTICS', icon: BarChart3, label: 'ANALYTICS' },
];

// ═══════════════════════════════════════════════════
//  MAIN COMMAND CENTER APPLICATION
// ═══════════════════════════════════════════════════
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
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
  const [telemetry, setTelemetry] = useState({ signal: 98, latency: 12, aiConf: 95, uptime: 99.8 });
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
      setTelemetry(prev => ({
        signal: Math.max(85, Math.min(100, prev.signal + (Math.random() * 4 - 2))),
        latency: Math.max(8, Math.min(40, prev.latency + (Math.random() * 4 - 2))),
        aiConf: Math.max(88, Math.min(99, prev.aiConf + (Math.random() * 2 - 1))),
        uptime: prev.uptime
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [detectionData.riskScore]);

  // Session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime(prev => (prev > 1 ? prev - 1 : 7200));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
      addLog(`[SYSTEM] Dispatching ${scenario} tactical payload...`, 'warning');
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
        <div className="viewport-panel" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
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
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                }}>
                  <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
                    <div style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 0 15px var(--accent-glow))' }}>🛡️</div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ fontFamily: "'Share Tech Mono'", fontSize: '1.1rem', color: 'var(--accent)', letterSpacing: 2, fontWeight: 'bold' }}>
                          TRINETRA RAKSHAK — DEFENSE COMMAND OVERVIEW
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
                      padding: '12px 24px', cursor: 'pointer', color: 'var(--accent)', fontFamily: "'Share Tech Mono'",
                      fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 10,
                      boxShadow: '0 0 25px rgba(34,197,94,0.25)'
                    }}
                  >
                    <Play size={16} /> GO LIVE FEED
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
                    { title: 'REAL CCTV + WEBRTC', desc: 'Public CCTV footage, local live webcam, and browser-side TensorFlow object detection.', status: 'REAL FEEDS ACTIVE', color: 'var(--accent)', tab: 'LIVE' },
                    { title: 'KAVACH RAILWAY OVERWATCH', desc: 'Indian rail corridor footage with wildlife risk, LiDAR range, braking, horn, and ATP telemetry.', status: 'TRACK MONITORING', color: 'var(--safe)', tab: 'TRACK-GUARD' },
                    { title: 'GEO-EYE SATELLITE GIS', desc: 'Live Leaflet GIS with Esri/OSM map layers and Jharkhand illegal mining polygons.', status: 'MAP ONLINE', color: '#38bdf8', tab: 'GEO-EYE' }
                  ].map((mod, i) => (
                    <div
                      key={i}
                      onClick={() => setActiveTab(mod.tab)}
                      style={{ background: 'rgba(15,23,42,0.85)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: 14, cursor: 'pointer', transition: 'border-color 0.2s' }}
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

            {/* ── SIMULATION & INCIDENT DISPATCH ── */}
            {activeTab === 'SIMULATION' && (
              <motion.div
                key="dispatch"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, padding: 14, overflowY: 'auto' }}
              >
                <div style={{ background: 'rgba(15,23,42,0.85)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: 18 }}>
                  <div style={{ fontSize: '1.1rem', fontFamily: "'Share Tech Mono'", color: 'var(--accent)', fontWeight: 'bold', letterSpacing: 2, marginBottom: 4 }}>
                    INCIDENT OPERATIONS & LIVE DISPATCH
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: 16 }}>
                    Inject, record, and audit incident workflows while the live camera, rail, and GIS modules remain the core product.
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    <div
                      className="cyber-border"
                      style={{ padding: 14, background: 'rgba(239,68,68,0.08)', borderRadius: 8, cursor: 'pointer' }}
                      onClick={() => triggerBackendSim('INTRUSION')}
                    >
                      <div style={{ color: 'var(--danger)', fontSize: '0.9rem', fontFamily: "'Share Tech Mono'", fontWeight: 'bold', marginBottom: 6 }}>
                        <Lock size={14} style={{ verticalAlign: 'middle' }} /> BORDER INTRUSION
                      </div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.65rem' }}>Simulates hostile intruders jumping the perimeter fence. Syncs immediately to DB.</div>
                    </div>

                    <div
                      className="cyber-border"
                      style={{ padding: 14, background: 'rgba(34,197,94,0.08)', borderRadius: 8, cursor: 'pointer' }}
                      onClick={() => triggerBackendSim('WILDLIFE')}
                    >
                      <div style={{ color: 'var(--safe)', fontSize: '0.9rem', fontFamily: "'Share Tech Mono'", fontWeight: 'bold', marginBottom: 6 }}>
                        <Train size={14} style={{ verticalAlign: 'middle' }} /> WILDLIFE TRACKING
                      </div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.65rem' }}>Simulates animal crossing over critical railway tracks. Invokes collision risk AI.</div>
                    </div>

                    <div
                      className="cyber-border"
                      style={{ padding: 14, background: 'rgba(168,85,247,0.08)', borderRadius: 8, cursor: 'pointer' }}
                      onClick={() => triggerBackendSim('DRONE')}>
                      <div style={{ color: '#a855f7', fontSize: '0.9rem', fontFamily: "'Share Tech Mono'", fontWeight: 'bold', marginBottom: 6 }}>
                        <Radio size={14} style={{ verticalAlign: 'middle' }} /> UAV DRONE DETECTION
                      </div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.65rem' }}>Simulates unidentified aerial vehicle over restricted airspace. Radar anomaly generation.</div>
                    </div>

                    <div
                      className="cyber-border"
                      style={{ padding: 14, background: 'rgba(56,189,248,0.08)', borderRadius: 8, cursor: 'pointer' }}
                      onClick={() => triggerBackendSim('MINING')}>
                      <div style={{ color: '#38bdf8', fontSize: '0.9rem', fontFamily: "'Share Tech Mono'", fontWeight: 'bold', marginBottom: 6 }}>
                        <MapIcon size={14} style={{ verticalAlign: 'middle' }} /> ILLEGAL MINING
                      </div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.65rem' }}>Simulates GIS satellite terrain differences in the Jharkhand corridor.</div>
                    </div>
                  </div>
                </div>

                {/* Live Database Stream */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(15,23,42,0.85)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: 16 }}>
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
        <div className="control-panel" style={{ overflowY: 'auto', paddingRight: 6 }}>
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
              {simActive ? <><Square size={12} /> STOP AI</> : <><Play size={12} /> START AI</>}
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
              {trackActive ? <><Square size={12} /> STOP TRACK</> : <><Play size={12} /> TRACK AI</>}
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
          <div style={{ minHeight: 120, overflowY: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
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

      {/* ═══ FLOATING TACTICAL AGENTS & COMMS ═══ */}
      <div style={{ position: 'fixed', bottom: 20, right: 20, display: 'flex', gap: 10, zIndex: 1000 }}>
        {/* AI Threat Analyst (Claude AI Chat) Button */}
        <motion.button
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
          onClick={() => setAnalystOpen(true)}
          style={{
            background: 'linear-gradient(135deg, rgba(168,85,247,0.9), rgba(126,34,206,0.9))',
            border: '1.5px solid #c084fc',
            borderRadius: '50%',
            width: 46, height: 46,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 0 25px rgba(168,85,247,0.6)',
            color: '#fff'
          }}
          title="Open AI Threat Analyst (Claude LLM)"
        >
          <Brain size={22} />
        </motion.button>

        {/* Walkie-Talkie Push-to-Talk Comms Button */}
        <motion.button
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
          onClick={() => setWalkieOpen(true)}
          style={{
            background: 'linear-gradient(135deg, rgba(34,197,94,0.9), rgba(21,128,61,0.9))',
            border: '1.5px solid #86efac',
            borderRadius: '50%',
            width: 46, height: 46,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 0 25px rgba(34,197,94,0.6)',
            color: '#fff'
          }}
          title="Open Tactical Walkie-Talkie"
        >
          <Radio size={20} />
        </motion.button>
      </div>
    </div>
  );
}
