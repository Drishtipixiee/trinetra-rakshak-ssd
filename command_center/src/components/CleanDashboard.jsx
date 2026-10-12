/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Activity, AlertTriangle, Video, Cpu, Wifi, Users,
  Play, Eye, Brain, Signal, Zap, Target, MapPin, BarChart3,
  Clock, ChevronRight, Radio, Globe, Camera, Lock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

// ── Stat Card ──
function StatCard({ icon: Icon, label, value, sub, color, pulse, onClick }) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.02 }}
      onClick={onClick}
      style={{
        background: 'linear-gradient(135deg, rgba(5,15,8,0.9) 0%, rgba(0,0,0,0.7) 100%)',
        border: `1px solid ${color}30`,
        borderRadius: 12,
        padding: '14px 16px',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)',
        boxShadow: `0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `${color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${color}30`
        }}>
          <Icon size={15} color={color} />
        </div>
        {pulse && (
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, animation: 'breathe 1.5s infinite' }} />
        )}
      </div>
      <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.45)', letterSpacing: 1.5, marginBottom: 4, fontFamily: "'Share Tech Mono'" }}>
        {label}
      </div>
      <div style={{ fontSize: '1.35rem', fontWeight: 700, color, fontFamily: "'Share Tech Mono'", letterSpacing: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{sub}</div>}
    </motion.div>
  );
}

// ── Module Card ──
function ModuleCard({ title, desc, status, statusColor, icon: Icon, onClick, badge }) {
  return (
    <motion.div
      whileHover={{ y: -2, borderColor: statusColor }}
      onClick={onClick}
      style={{
        background: 'linear-gradient(135deg, rgba(5,15,8,0.85) 0%, rgba(0,0,0,0.6) 100%)',
        border: `1px solid rgba(255,255,255,0.07)`,
        borderRadius: 12,
        padding: '14px 16px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)',
        transition: 'border-color 0.25s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: `${statusColor}15`, border: `1px solid ${statusColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={13} color={statusColor} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#e8f5e9', letterSpacing: 0.5 }}>{title}</div>
          {badge && (
            <div style={{ fontSize: '0.45rem', color: statusColor, background: `${statusColor}15`, padding: '1px 5px', borderRadius: 3, display: 'inline-block', marginTop: 1, fontFamily: "'Share Tech Mono'" }}>
              {badge}
            </div>
          )}
        </div>
        <ChevronRight size={12} color="rgba(255,255,255,0.2)" />
      </div>
      <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 8 }}>{desc}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor, animation: 'breathe 2s infinite' }} />
        <span style={{ fontSize: '0.5rem', color: statusColor, fontFamily: "'Share Tech Mono'", letterSpacing: 1 }}>{status}</span>
      </div>
    </motion.div>
  );
}

// ── CCTV Mini Grid Preview ──
function CCTVMiniPreview({ onClick }) {
  const feeds = [
    { id: 'CAM-01', src: 'https://assets.mixkit.co/videos/preview/mixkit-security-camera-recording-a-robbery-41484-large.mp4', status: 'ACTIVE', color: '#22c55e' },
    { id: 'CAM-02', src: 'https://assets.mixkit.co/videos/preview/mixkit-car-approaching-a-security-gate-at-night-42171-large.mp4', status: 'ALERT', color: '#ef4444' },
    { id: 'CAM-03', src: 'https://assets.mixkit.co/videos/preview/mixkit-fence-with-barbed-wire-39853-large.mp4', status: 'ACTIVE', color: '#22c55e' },
    { id: 'CAM-04', src: 'https://assets.mixkit.co/videos/preview/mixkit-guard-walking-in-the-snow-during-winter-39845-large.mp4', status: 'ACTIVE', color: '#22c55e' },
  ];

  return (
    <div
      style={{
        background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(34,197,94,0.15)',
        borderRadius: 12, padding: 12, cursor: 'pointer', backdropFilter: 'blur(10px)'
      }}
      onClick={onClick}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Video size={13} color="#22c55e" />
          <span style={{ fontSize: '0.6rem', color: '#22c55e', fontFamily: "'Share Tech Mono'", letterSpacing: 2 }}>LIVE CCTV FEEDS</span>
        </div>
        <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Share Tech Mono'" }}>4/4 ONLINE</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {feeds.map(cam => (
          <div key={cam.id} style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', aspectRatio: '16/9', background: '#0a0a0a', border: `1px solid ${cam.color}25` }}>
            <video autoPlay loop muted playsInline
              src={cam.src}
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7, filter: 'grayscale(40%) contrast(1.1)' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 3px)' }} />
            <div style={{ position: 'absolute', top: 3, left: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: cam.color, animation: cam.status === 'ALERT' ? 'blink 0.5s infinite' : 'breathe 2s infinite' }} />
              <span style={{ fontSize: '0.38rem', color: cam.color, fontFamily: "'Share Tech Mono'" }}>{cam.id}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Threat Chart ──
function ThreatChart({ data }) {
  return (
    <div style={{ width: '100%', height: 80 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="time" hide />
          <YAxis domain={[0, 100]} hide />
          <Tooltip
            contentStyle={{ background: '#050c05', border: '1px solid #22c55e30', borderRadius: 6, fontSize: '0.6rem', fontFamily: "'Share Tech Mono'" }}
            labelStyle={{ color: '#22c55e' }}
            itemStyle={{ color: '#e8f5e9' }}
          />
          <Line type="monotone" dataKey="val" stroke="#22c55e" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Active Alerts Feed ──
function AlertFeed({ logs }) {
  const filtered = logs.filter(l => l.type === 'critical' || l.type === 'warning').slice(-8).reverse();
  const typeColor = { critical: '#ef4444', warning: '#f59e0b', safe: '#22c55e', normal: 'rgba(255,255,255,0.4)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
      {filtered.length === 0 ? (
        <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)', fontFamily: "'Share Tech Mono'", textAlign: 'center', padding: 12 }}>
          NO ACTIVE ALERTS — PERIMETER SECURE
        </div>
      ) : (
        filtered.map((log, i) => (
          <motion.div key={log.id || i}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            style={{
              fontSize: '0.52rem', padding: '6px 8px', borderRadius: 6,
              background: `${typeColor[log.type] || '#22c55e'}08`,
              borderLeft: `2px solid ${typeColor[log.type] || '#22c55e'}`,
              color: 'rgba(255,255,255,0.65)',
              fontFamily: "'Share Tech Mono'",
              lineHeight: 1.5
            }}
          >
            {log.text}
          </motion.div>
        ))
      )}
    </div>
  );
}

// ── Personnel Roster Mini ──
function PersonnelMini() {
  const roster = [
    { id: 'A-01', name: 'SGT. ARJUN MEHTA', sector: 'SEC-7A', status: 'ON PATROL', color: '#22c55e' },
    { id: 'A-02', name: 'CPL. PRIYA SINGH', sector: 'SEC-7B', status: 'STANDBY', color: '#f59e0b' },
    { id: 'B-01', name: 'LT. ROHAN GUPTA', sector: 'GATE-MAIN', status: 'ON DUTY', color: '#22c55e' },
    { id: 'B-02', name: 'SGT. NEHA VERMA', sector: 'EAST-WATCH', status: 'ON DUTY', color: '#22c55e' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {roster.map(p => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.03)' }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: `${p.color}20`, border: `1px solid ${p.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={10} color={p.color} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.52rem', color: '#e8f5e9', fontWeight: 600 }}>{p.name}</div>
            <div style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.3)' }}>{p.sector}</div>
          </div>
          <div style={{ fontSize: '0.42rem', color: p.color, fontFamily: "'Share Tech Mono'" }}>{p.status}</div>
        </div>
      ))}
    </div>
  );
}

export default function CleanDashboard({
  detectionData, telemetry, logs, threatHistory,
  setActiveTab, setSimActive, addLog,
  setTrackActive, triggerGeoScan, triggerBackendSim,
  weather, sessionTime
}) {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  const threatColor = detectionData.threatLevel === 'CRITICAL' ? '#ef4444' : detectionData.threatLevel === 'WARNING' ? '#f59e0b' : '#22c55e';
  const timeStr = time.toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' });

  return (
    <motion.div
      key="clean-dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gridTemplateRows: 'auto auto 1fr',
        gap: 10, padding: '10px 12px',
        overflowY: 'auto',
      }}
    >
      {/* ── HERO BANNER ── */}
      <motion.div
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}
        style={{
          gridColumn: '1 / -1',
          background: 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(0,0,0,0.5) 50%, rgba(34,197,94,0.04) 100%)',
          border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 14,
          padding: '16px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backdropFilter: 'blur(16px)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', right: -60, top: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: '2.2rem', filter: 'drop-shadow(0 0 12px rgba(34,197,94,0.4))' }}>🛡️</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <h1 style={{ fontSize: '1.1rem', color: '#22c55e', fontFamily: "'Share Tech Mono'", letterSpacing: 3, margin: 0 }}>
                TRINETRA RAKSHAK
              </h1>
              <span style={{ fontSize: '0.45rem', background: 'rgba(34,197,94,0.15)', color: '#22c55e', padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(34,197,94,0.3)', fontFamily: "'Share Tech Mono'", letterSpacing: 1 }}>
                v2.0 · REAL AI
              </span>
            </div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>
              INTEGRATED COMMAND & CONTROL — SECTOR 7 · JHARKHAND MINING CORRIDOR
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {weather && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>WEATHER</div>
              <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontFamily: "'Share Tech Mono'" }}>{weather.temperature ?? '--'}°C</div>
            </div>
          )}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>SESSION</div>
            <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontFamily: "'Share Tech Mono'" }}>
              {Math.floor(sessionTime / 3600).toString().padStart(2, '0')}:{(Math.floor(sessionTime / 60) % 60).toString().padStart(2, '0')}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>IST</div>
            <div style={{ fontSize: '1rem', color: '#22c55e', fontFamily: "'Share Tech Mono'" }}>{timeStr}</div>
          </div>
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(34,197,94,0.3)' }}
            whileTap={{ scale: 0.96 }}
            onClick={() => { setActiveTab('LIVE'); setSimActive(true); addLog("[SYS] Real AI detection started.", "safe"); }}
            style={{
              background: 'rgba(34,197,94,0.15)', border: '1.5px solid #22c55e',
              borderRadius: 9, padding: '10px 20px', cursor: 'pointer',
              color: '#22c55e', fontFamily: "'Share Tech Mono'", fontSize: '0.75rem',
              letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'bold'
            }}
          >
            <Play size={16} fill="currentColor" /> GO LIVE
          </motion.button>
        </div>
      </motion.div>

      {/* ── STAT CARDS ── */}
      {[
        { icon: Shield, label: 'THREAT LEVEL', value: detectionData.threatLevel, sub: `Risk: ${detectionData.riskScore}%`, color: threatColor, pulse: detectionData.threatLevel !== 'LOW', onClick: () => setActiveTab('LIVE') },
        { icon: Video, label: 'CCTV FEEDS', value: '4/4', sub: 'All cameras online', color: '#22c55e', onClick: () => setActiveTab('CCTV') },
        { icon: Cpu, label: 'AI ENGINE', value: 'ACTIVE', sub: `Conf: ${telemetry.aiConf.toFixed(0)}%`, color: '#a855f7', pulse: true },
        { icon: Signal, label: 'SIGNAL', value: `${telemetry.signal.toFixed(0)}%`, sub: `Latency: ${telemetry.latency.toFixed(0)}ms`, color: '#38bdf8' },
        { icon: Users, label: 'PERSONNEL', value: '5/6', sub: 'On duty', color: '#f59e0b' },
        { icon: Activity, label: 'UPTIME', value: `${telemetry.uptime}%`, sub: 'System health: NOMINAL', color: '#22c55e' },
      ].map((card, i) => (
        <motion.div key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 + i * 0.02 }}>
          <StatCard {...card} />
        </motion.div>
      ))}

      {/* ── LEFT COL ── */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.22 }}
        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <CCTVMiniPreview onClick={() => setActiveTab('CCTV')} />
        <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', letterSpacing: 2, fontFamily: "'Share Tech Mono'", marginBottom: 8 }}>PERSONNEL ON DUTY</div>
          <PersonnelMini />
        </div>
      </motion.div>

      {/* ── CENTER COL ── */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.24 }}
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', letterSpacing: 2, fontFamily: "'Share Tech Mono'" }}>DEFENCE MODULES</div>
        <ModuleCard icon={Brain} title="BORDER-SENTRY" desc="TF.js COCO-SSD perimeter detection — SEC-7A/7B fences at ~10fps" status="REAL AI ACTIVE" statusColor="#a855f7" badge="TENSORFLOW.JS" onClick={() => { setActiveTab('LIVE'); setSimActive(true); }} />
        <ModuleCard icon={Globe} title="GEO-EYE SATELLITE" desc="Sentinel-2 WMS imagery for illegal mining detection in Jharkhand" status="SENTINEL-2 ONLINE" statusColor="#38bdf8" onClick={() => setActiveTab('GEO-EYE')} />
        <ModuleCard icon={Activity} title="TRACK-GUARD" desc="Railway wildlife & obstruction detection with weather-adjusted braking" status="MONITORING" statusColor="#22c55e" onClick={() => setActiveTab('TRACK-GUARD')} />
        <ModuleCard icon={Radio} title="AR/VR SIMULATION" desc="3D spatial mesh, AR vehicle tracking, VR mission planning — Three.js" status="3D ENGINE READY" statusColor="#f59e0b" badge="THREE.JS" onClick={() => setActiveTab('CAMFORGE')} />
        <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '10px 12px' }}>
          <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, fontFamily: "'Share Tech Mono'", marginBottom: 6 }}>THREAT RISK HISTORY</div>
          <ThreatChart data={threatHistory} />
        </div>
      </motion.div>

      {/* ── RIGHT COL ── */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.26 }}
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', letterSpacing: 2, fontFamily: "'Share Tech Mono'", marginBottom: 8 }}>QUICK ACTIONS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              { label: 'DEPLOY QRF', color: '#ef4444', icon: Shield, action: () => addLog('[QRF] Quick Reaction Force deployed to Sector 7.', 'critical') },
              { label: 'GEO SCAN', color: '#38bdf8', icon: Globe, action: () => { triggerGeoScan(); setActiveTab('GEO-EYE'); } },
              { label: 'SIM: INTRUSION', color: '#f59e0b', icon: AlertTriangle, action: () => triggerBackendSim('INTRUSION') },
              { label: 'LOCKDOWN', color: '#ef4444', icon: Lock, action: () => addLog('[SEC] Full sector lockdown initiated.', 'critical') },
              { label: 'TRACK SCAN', color: '#22c55e', icon: Activity, action: () => { setActiveTab('TRACK-GUARD'); setTrackActive(true); } },
              { label: 'ANALYTICS', color: '#a855f7', icon: BarChart3, action: () => setActiveTab('ANALYTICS') },
            ].map((a, i) => (
              <motion.button key={i} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={a.action}
                style={{ background: `${a.color}10`, border: `1px solid ${a.color}30`, borderRadius: 7, padding: '8px', cursor: 'pointer', color: a.color, fontFamily: "'Share Tech Mono'", fontSize: '0.5rem', letterSpacing: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontWeight: 600 }}>
                <a.icon size={10} /> {a.label}
              </motion.button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <AlertTriangle size={11} color="#ef4444" />
            <div style={{ fontSize: '0.55rem', color: '#ef4444', letterSpacing: 2, fontFamily: "'Share Tech Mono'" }}>ALERT STREAM</div>
          </div>
          <AlertFeed logs={logs} />
        </div>

        <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', letterSpacing: 2, fontFamily: "'Share Tech Mono'", marginBottom: 8 }}>SYSTEM STATUS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'Backend API', value: 'CONNECTED', color: '#22c55e' },
              { label: 'AI Model', value: 'COCO-SSD v2', color: '#a855f7' },
              { label: 'DB Events', value: 'LIVE SYNC', color: '#38bdf8' },
              { label: 'AR/VR Engine', value: 'THREE.JS', color: '#f59e0b' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.4)' }}>{s.label}</span>
                <span style={{ fontSize: '0.5rem', color: s.color, fontFamily: "'Share Tech Mono'" }}>● {s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
