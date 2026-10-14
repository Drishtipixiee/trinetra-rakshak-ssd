/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Activity, AlertTriangle, Video, Cpu, Users,
  Play, Eye, Brain, Signal, Target, Globe, Radio,
  Lock, CheckCircle2, ChevronRight, RefreshCw, Volume2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

// ── Executive Stat Card ──
function StatCard({ icon: Icon, label, value, sub, color, pulse, onClick }) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      onClick={onClick}
      style={{
        background: 'linear-gradient(135deg, rgba(8,18,10,0.92) 0%, rgba(3,8,4,0.85) 100%)',
        border: `1px solid ${color}35`,
        borderRadius: 10,
        padding: '12px 16px',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 18px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 6,
          background: `${color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${color}30`
        }}>
          <Icon size={15} color={color} />
        </div>
        {pulse && (
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}`, animation: 'breathe 1.5s infinite' }} />
        )}
      </div>
      <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.45)', letterSpacing: 1.2, fontFamily: "'Share Tech Mono'", textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.25rem', fontWeight: 700, color, fontFamily: "'Share Tech Mono'", letterSpacing: 0.5, marginTop: 2 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{sub}</div>}
    </motion.div>
  );
}

// ── Tactical Defense Module Card ──
function ModuleCard({ title, code, desc, status, statusColor, icon: Icon, onClick }) {
  return (
    <motion.div
      whileHover={{ y: -2, borderColor: 'rgba(34,197,94,0.45)' }}
      onClick={onClick}
      style={{
        background: 'linear-gradient(135deg, rgba(8,16,10,0.9) 0%, rgba(2,6,3,0.85) 100%)',
        border: '1px solid rgba(34,197,94,0.18)',
        borderRadius: 10,
        padding: '12px 14px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(12px)',
        transition: 'all 0.25s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: `${statusColor}15`, border: `1px solid ${statusColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color={statusColor} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#e8f5e9', letterSpacing: 0.5 }}>{title}</span>
            <span style={{ fontSize: '0.45rem', color: statusColor, background: `${statusColor}15`, padding: '1px 5px', borderRadius: 3, border: `1px solid ${statusColor}30`, fontFamily: "'Share Tech Mono'" }}>
              {code}
            </span>
          </div>
          <div style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.4)', marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
        </div>
        <ChevronRight size={14} color="rgba(255,255,255,0.25)" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor, animation: 'breathe 2s infinite' }} />
          <span style={{ fontSize: '0.5rem', color: statusColor, fontFamily: "'Share Tech Mono'", letterSpacing: 1 }}>{status}</span>
        </div>
        <span style={{ fontSize: '0.48rem', color: '#22c55e', fontFamily: "'Share Tech Mono'" }}>LAUNCH →</span>
      </div>
    </motion.div>
  );
}

// ── CCTV Matrix Grid with Real Human Suspect Profiles (Image 2) & AR/VR Mode ──
function CCTVMatrix({ onClick }) {
  const [cctvMode, setCctvMode] = useState('HUMAN'); // 'HUMAN' or 'ARVR'

  const feeds = [
    {
      id: 'CAM-01',
      name: 'NORTH GATE SEC-7A',
      status: 'ACTIVE',
      color: '#22c55e',
      suspectId: 'S-003',
      label: 'UNAUTHORIZED SENTRY',
      match: '88%',
      threat: 'HIGH',
      // Real serious tactical sentry (no smile)
      photo: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=600&auto=format&fit=crop&q=80',
      coords: "N28°38'12\" E77°13'04\"",
      arData: { range: '142m', azimuth: '042°', elev: '+1.4m', target: 'BIO-TARGET [S-003]' },
      target: { box: { top: '14%', left: '32%', width: '36%', height: '64%' } },
    },
    {
      id: 'CAM-02',
      name: 'FENCE PERIMETER SEC-7B',
      status: 'ALERT',
      color: '#ef4444',
      suspectId: 'S-001',
      label: 'ARMED INTRUDER',
      match: '96%',
      threat: 'CRITICAL',
      // Night hooded operative (serious, no smile)
      photo: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
      coords: "N28°38'18\" E77°13'09\"",
      arData: { range: '085m', azimuth: '318°', elev: '+0.8m', target: 'HOSTILE INTRUDER [S-001]' },
      target: { box: { top: '12%', left: '28%', width: '44%', height: '68%' } },
    },
    {
      id: 'CAM-03',
      name: 'RIVER BARRIER KM-14',
      status: 'ACTIVE',
      color: '#22c55e',
      suspectId: 'S-004',
      label: 'WANTED RECON SCOUT',
      match: '82%',
      threat: 'HIGH',
      // Cold, intense unsmiling adult male face
      photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80',
      coords: "N28°38'15\" E77°13'15\"",
      arData: { range: '210m', azimuth: '112°', elev: '-2.1m', target: 'RECON UNIT [S-004]' },
      target: { box: { top: '15%', left: '30%', width: '38%', height: '64%' } },
    },
    {
      id: 'CAM-04',
      name: 'HIGHWAY OUTPOST SEC-12',
      status: 'ALERT',
      color: '#ef4444',
      suspectId: 'S-002',
      label: 'PERIMETER BREACHER',
      match: '93%',
      threat: 'CRITICAL',
      // Serious security operative (no smile)
      photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80',
      coords: "N28°38'10\" E77°13'00\"",
      arData: { range: '168m', azimuth: '275°', elev: '+3.2m', target: 'BREACH POINT [S-002]' },
      target: { box: { top: '14%', left: '28%', width: '42%', height: '66%' } },
    },
  ];

  return (
    <div
      onClick={onClick}
      style={{
        background: 'linear-gradient(135deg, rgba(8,16,10,0.92) 0%, rgba(2,6,3,0.9) 100%)',
        border: '1px solid rgba(34,197,94,0.25)',
        borderRadius: 10,
        padding: 12,
        cursor: 'pointer',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 18px rgba(0,0,0,0.5)',
      }}
    >
      {/* Header with Title and Mode Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Video size={13} color="#22c55e" />
          <span style={{ fontSize: '0.62rem', color: '#22c55e', fontFamily: "'Share Tech Mono'", letterSpacing: 2, fontWeight: 'bold' }}>
            TACTICAL CCTV MATRIX
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* AR/VR vs Human Mode Switch */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCctvMode(prev => prev === 'HUMAN' ? 'ARVR' : 'HUMAN');
            }}
            style={{
              fontSize: '0.48rem',
              background: cctvMode === 'ARVR' ? 'rgba(56,189,248,0.2)' : 'rgba(34,197,94,0.18)',
              color: cctvMode === 'ARVR' ? '#38bdf8' : '#22c55e',
              padding: '2px 8px',
              borderRadius: 3,
              border: `1px solid ${cctvMode === 'ARVR' ? '#38bdf8' : '#22c55e'}55`,
              fontFamily: "'Share Tech Mono'",
              fontWeight: 'bold',
              cursor: 'pointer',
              letterSpacing: 0.8,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            title="Toggle between Real Human Suspect Intel and Blank AR/VR Wireframe HUD"
          >
            {cctvMode === 'HUMAN' ? '👤 HUMAN MODE' : '🥽 AR/VR HUD'}
          </button>

          <span style={{ fontSize: '0.48rem', background: 'rgba(34,197,94,0.15)', color: '#22c55e', padding: '2px 6px', borderRadius: 3, border: '1px solid rgba(34,197,94,0.3)', fontFamily: "'Share Tech Mono'" }}>
            4/4 FEEDS ONLINE
          </span>
          <span style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Share Tech Mono'" }}>FULL VIEW →</span>
        </div>
      </div>

      {/* 2x2 Camera Feeds Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {feeds.map(cam => (
          <div
            key={cam.id}
            style={{
              position: 'relative',
              borderRadius: 6,
              overflow: 'hidden',
              background: '#020603',
              border: `1px solid ${cam.color}45`,
              aspectRatio: '16/9',
              boxShadow: cam.status === 'ALERT' ? '0 0 14px rgba(239,68,68,0.3)' : 'none',
            }}
          >
            {cctvMode === 'HUMAN' ? (
              <>
                {/* ── REAL HUMAN SUSPECT PHOTO MATCHING IMAGE 2 ── */}
                <img
                  src={cam.photo}
                  alt={cam.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'contrast(1.1) brightness(0.85) saturate(0.9)',
                  }}
                />

                {/* Night vision phosphor overlay */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: cam.status === 'ALERT'
                    ? 'radial-gradient(ellipse at center, rgba(239,68,68,0.12) 0%, rgba(0,0,0,0.55) 100%)'
                    : 'radial-gradient(ellipse at center, rgba(34,197,94,0.08) 0%, rgba(0,0,0,0.55) 100%)',
                  pointerEvents: 'none'
                }} />

                {/* Scanline overlay */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0px, rgba(0,0,0,0.35) 1px, transparent 1px, transparent 2px)',
                  pointerEvents: 'none'
                }} />

                {/* AI Facial Bounding Reticle on Human Target */}
                <div
                  style={{
                    position: 'absolute',
                    top: cam.target.box.top,
                    left: cam.target.box.left,
                    width: cam.target.box.width,
                    height: cam.target.box.height,
                    border: `1.5px solid ${cam.color}`,
                    boxShadow: `0 0 8px ${cam.color}60`,
                    pointerEvents: 'none',
                  }}
                >
                  <div style={{ position: 'absolute', top: -3, left: -3, width: 6, height: 6, borderTop: `2px solid ${cam.color}`, borderLeft: `2px solid ${cam.color}` }} />
                  <div style={{ position: 'absolute', top: -3, right: -3, width: 6, height: 6, borderTop: `2px solid ${cam.color}`, borderRight: `2px solid ${cam.color}` }} />
                  <div style={{ position: 'absolute', bottom: -3, left: -3, width: 6, height: 6, borderBottom: `2px solid ${cam.color}`, borderLeft: `2px solid ${cam.color}` }} />
                  <div style={{ position: 'absolute', bottom: -3, right: -3, width: 6, height: 6, borderBottom: `2px solid ${cam.color}`, borderRight: `2px solid ${cam.color}` }} />

                  {/* Crosshair reticle center */}
                  <div style={{ position: 'absolute', top: '50%', left: '50%', width: 8, height: 8, transform: 'translate(-50%, -50%)', border: `1px dashed ${cam.color}90`, borderRadius: '50%' }} />
                </div>

                {/* ── IMAGE 2 EXACT SUSPECT PROFILE CARD OVERLAY ── */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 6,
                    left: 6,
                    right: 6,
                    background: 'rgba(6, 12, 8, 0.92)',
                    border: `1px solid ${cam.color}90`,
                    borderRadius: 4,
                    padding: '3px 6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 6,
                    backdropFilter: 'blur(6px)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.8)',
                    zIndex: 2,
                  }}
                >
                  {/* Human suspect thumbnail matching Image 2 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 3, overflow: 'hidden',
                      border: `1px solid ${cam.color}`, flexShrink: 0
                    }}>
                      <img src={cam.photo} alt={cam.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{
                        fontSize: '0.46rem',
                        color: '#fff',
                        fontFamily: "'Share Tech Mono'",
                        fontWeight: 'bold',
                        letterSpacing: 0.5,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {cam.label}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.40rem', fontFamily: "'Share Tech Mono'" }}>
                        <span style={{ color: cam.status === 'ALERT' ? '#ef4444' : '#22c55e', fontWeight: 'bold' }}>
                          MATCH: {cam.match}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.45)' }}>
                          ID: {cam.suspectId}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '0.38rem',
                    color: cam.color,
                    fontFamily: "'Share Tech Mono'",
                    background: `${cam.color}20`,
                    border: `1px solid ${cam.color}50`,
                    padding: '1px 4px',
                    borderRadius: 2,
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    {cam.status}
                  </span>
                </div>
              </>
            ) : (
              <>
                {/* ── AR/VR WIREFRAME HUD MODE (CLEAN / BLANK TACTICAL SCAN) ── */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(180deg, #020804 0%, #010402 100%)',
                  overflow: 'hidden',
                }}>
                  {/* 3D Perspective Vector Wireframe Grid */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'linear-gradient(rgba(34,197,94,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.12) 1px, transparent 1px)',
                    backgroundSize: '16px 16px',
                    transform: 'perspective(220px) rotateX(25deg)',
                    transformOrigin: 'bottom center',
                    opacity: 0.85
                  }} />

                  {/* Rotating LiDAR Radar Sweep */}
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    width: 140, height: 140,
                    transform: 'translate(-50%, -50%)',
                    borderRadius: '50%',
                    border: '1px dashed rgba(56,189,248,0.3)',
                    pointerEvents: 'none'
                  }}>
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      borderRadius: '50%',
                      background: 'conic-gradient(from 0deg, rgba(56,189,248,0.2) 0deg, transparent 60deg, transparent 360deg)',
                      animation: 'spin 4s linear infinite',
                    }} />
                    <div style={{ position: 'absolute', top: '50%', left: '50%', width: 4, height: 4, transform: 'translate(-50%, -50%)', background: '#38bdf8', borderRadius: '50%' }} />
                  </div>

                  {/* AR Vector Target Lock Crosshair */}
                  <div style={{
                    position: 'absolute',
                    top: '32%', left: '38%',
                    width: 44, height: 44,
                    border: `1px solid ${cam.color}`,
                    borderRadius: 3,
                    boxShadow: `0 0 10px ${cam.color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <div style={{ width: 6, height: 6, border: `1px solid ${cam.color}`, borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', top: -12, left: 0, fontSize: '0.38rem', color: cam.color, fontFamily: "'Share Tech Mono'", fontWeight: 'bold' }}>
                      {cam.arData.target}
                    </div>
                  </div>

                  {/* AR Telemetry Overlay */}
                  <div style={{
                    position: 'absolute', bottom: 6, left: 6, right: 6,
                    background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(56,189,248,0.3)',
                    borderRadius: 3, padding: '2px 5px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: '0.40rem', fontFamily: "'Share Tech Mono'", color: '#38bdf8'
                  }}>
                    <span>AR-HUD // RNG: {cam.arData.range} · AZ: {cam.arData.azimuth}</span>
                    <span style={{ color: cam.color }}>{cam.status}</span>
                  </div>
                </div>
              </>
            )}

            {/* Top Bar with Camera ID, REC Dot, Sector */}
            <div style={{ position: 'absolute', top: 5, left: 6, right: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: cam.color,
                  boxShadow: `0 0 6px ${cam.color}`,
                  animation: 'breathe 1.2s infinite'
                }} />
                <span style={{ fontSize: '0.46rem', color: '#fff', fontFamily: "'Share Tech Mono'", textShadow: '0 1px 3px #000', fontWeight: 'bold', letterSpacing: 0.5 }}>
                  {cam.id}
                </span>
                <span style={{ fontSize: '0.38rem', color: 'rgba(255,255,255,0.45)', fontFamily: "'Share Tech Mono'", marginLeft: 2 }}>
                  • REC
                </span>
              </div>
              <span style={{ fontSize: '0.40rem', color: 'rgba(255,255,255,0.7)', fontFamily: "'Share Tech Mono'", textShadow: '0 1px 2px #000' }}>
                {cam.name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tactical Threat Chart ──
function ThreatChart({ data }) {
  const chartData = (data && data.length > 0)
    ? data.slice(-18).map((d, i) => ({ time: d.time || `${i}m`, val: typeof d.val === 'number' ? d.val : (d.threatScore || 0) }))
    : Array.from({ length: 12 }, (_, i) => ({ time: `${i * 5}m`, val: Math.floor(10 + Math.sin(i) * 12) }));

  return (
    <div style={{ height: 110, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
          <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={8} tick={{ fill: 'rgba(255,255,255,0.35)' }} />
          <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.2)" fontSize={8} tick={{ fill: 'rgba(255,255,255,0.35)' }} />
          <Tooltip contentStyle={{ background: '#08120a', border: '1px solid rgba(34,197,94,0.3)', fontSize: '0.55rem', borderRadius: 4, color: '#22c55e' }} />
          <Line type="monotone" dataKey="val" stroke="#22c55e" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Live Incident Stream Feed ──
function IncidentFeed({ logs }) {
  const items = (logs && logs.length > 0)
    ? logs.slice(-6).reverse()
    : [
        { text: '[BORDER-SENTRY] TF.js COCO-SSD perimeter active at 10.4 FPS — Sector 7A secure.', type: 'safe' },
        { text: '[PATROL] Unit Alpha reached waypoint POST-ALPHA. No movement detected.', type: 'normal' },
        { text: '[GEO-EYE] Sentinel-2 satellite corridor scan complete. Zero illegal mining anomaly.', type: 'safe' },
        { text: '[TRACK-GUARD] Railway corridor KM-142 clear. Automated braking active.', type: 'safe' },
      ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 150, overflowY: 'auto' }}>
      {items.map((log, i) => {
        const isCritical = log.type === 'critical' || log.type === 'danger';
        const isWarning = log.type === 'warning';
        const color = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#22c55e';
        const text = typeof log === 'string' ? log : (log.text || log.msg || JSON.stringify(log));

        return (
          <div
            key={i}
            style={{
              fontSize: '0.52rem',
              fontFamily: "'Share Tech Mono'",
              padding: '6px 8px',
              borderRadius: 4,
              borderLeft: `3px solid ${color}`,
              background: 'rgba(0,0,0,0.35)',
              color: isCritical ? '#fca5a5' : isWarning ? '#fde68a' : '#d1fae5',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              lineHeight: 1.4,
            }}
          >
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{text}</span>
          </div>
        );
      })}
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
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '12px 14px',
        overflowY: 'auto',
        background: '#040905',
      }}
    >
      {/* ── HERO TACTICAL BANNER ── */}
      <motion.div
        initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        style={{
          background: 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(8,18,10,0.95) 50%, rgba(4,10,5,0.98) 100%)',
          border: '1px solid rgba(34,197,94,0.28)',
          borderRadius: 12,
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        
        {/* Left: Emblem & Sector Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'rgba(34,197,94,0.12)',
            border: '1.5px solid rgba(34,197,94,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem',
            boxShadow: '0 0 16px rgba(34,197,94,0.2)'
          }}>
            🛡️
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <h1 style={{ fontSize: '1.15rem', color: '#22c55e', fontFamily: "'Share Tech Mono'", letterSpacing: 2, margin: 0, lineHeight: 1.2, fontWeight: 700 }}>
                TRINETRA RAKSHAK
              </h1>
              <span style={{ fontSize: '0.48rem', background: 'rgba(34,197,94,0.15)', color: '#22c55e', padding: '2px 7px', borderRadius: 4, border: '1px solid rgba(34,197,94,0.3)', fontFamily: "'Share Tech Mono'", letterSpacing: 1 }}>
                v3.2 · DEFENCE C4I
              </span>
            </div>
            <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.45)', letterSpacing: 1, fontFamily: "'Share Tech Mono'" }}>
              INTEGRATED BORDER OVERWATCH & RAIL SECURITY SYSTEM · SECTOR 7
            </div>
          </div>
        </div>

        {/* Right: Technical Telemetry & Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          {weather && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Share Tech Mono'", marginBottom: 1 }}>SECTOR TEMP</div>
              <div style={{ fontSize: '0.85rem', color: '#22c55e', fontFamily: "'Share Tech Mono'", fontWeight: 'bold' }}>{weather.temperature ?? '24'}°C</div>
            </div>
          )}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Share Tech Mono'", marginBottom: 1 }}>MISSION CLOCK</div>
            <div style={{ fontSize: '0.85rem', color: '#22c55e', fontFamily: "'Share Tech Mono'", fontWeight: 'bold' }}>
              {Math.floor(sessionTime / 3600).toString().padStart(2, '0')}:{(Math.floor(sessionTime / 60) % 60).toString().padStart(2, '0')}:{(sessionTime % 60).toString().padStart(2, '0')}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Share Tech Mono'", marginBottom: 1 }}>INDIAN STD TIME</div>
            <div style={{ fontSize: '1.05rem', color: '#22c55e', fontFamily: "'Share Tech Mono'", fontWeight: 'bold' }}>{timeStr}</div>
          </div>

          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(34,197,94,0.4)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setActiveTab('LIVE'); setSimActive(true); addLog("[SYS] Real AI detection engaged.", "safe"); }}
            style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(34,197,94,0.1) 100%)',
              border: '1.5px solid #22c55e',
              borderRadius: 8,
              padding: '9px 18px',
              cursor: 'pointer',
              color: '#22c55e',
              fontFamily: "'Share Tech Mono'",
              fontSize: '0.72rem',
              letterSpacing: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontWeight: 'bold',
            }}
          >
            <Play size={14} fill="currentColor" /> GO LIVE
          </motion.button>
        </div>
      </motion.div>

      {/* ── 4 EXECUTIVE STAT CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <StatCard
          icon={Shield}
          label="THREAT LEVEL"
          value={detectionData.threatLevel}
          sub={`Risk Index: ${detectionData.riskScore}% · SEC-7`}
          color={threatColor}
          pulse={detectionData.threatLevel !== 'LOW'}
          onClick={() => setActiveTab('LIVE')}
        />
        <StatCard
          icon={Video}
          label="CCTV SURVEILLANCE"
          value="4/4 ONLINE"
          sub="Gate, Fence, River, Road Feeds"
          color="#22c55e"
          onClick={() => setActiveTab('CCTV')}
        />
        <StatCard
          icon={Brain}
          label="AI ENGINE (COCO-SSD)"
          value="ACTIVE"
          sub={`Confidence: ${telemetry.aiConf.toFixed(0)}% · 80 Classes`}
          color="#22c55e"
          pulse={true}
          onClick={() => setActiveTab('LIVE')}
        />
        <StatCard
          icon={Activity}
          label="SYSTEM INTEGRITY"
          value={`${telemetry.uptime}%`}
          sub={`Latency: ${telemetry.latency.toFixed(0)}ms · Signal: ${telemetry.signal.toFixed(0)}%`}
          color="#22c55e"
        />
      </div>

      {/* ── 2-COLUMN BALANCED OPERATIONAL VIEW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 12, flex: 1, minHeight: 0 }}>

        {/* Left Column: CCTV Matrix & Live Events Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <CCTVMatrix onClick={() => setActiveTab('CCTV')} />

          {/* Incident / Audit Stream Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(8,16,10,0.9) 0%, rgba(2,6,3,0.85) 100%)',
              border: '1px solid rgba(34,197,94,0.18)',
              borderRadius: 10,
              padding: 12,
              backdropFilter: 'blur(12px)',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 18px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={12} color="#f59e0b" />
                <span style={{ fontSize: '0.62rem', color: '#f59e0b', fontFamily: "'Share Tech Mono'", letterSpacing: 2, fontWeight: 'bold' }}>
                  TACTICAL AUDIT STREAM
                </span>
              </div>
              <span style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Share Tech Mono'" }}>
                LIVE DATABASE SYNC
              </span>
            </div>
            <IncidentFeed logs={logs} />
          </div>
        </div>

        {/* Right Column: Tactical Defence Modules & Risk Graph */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          
          {/* Modules Group */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.62rem', color: '#22c55e', letterSpacing: 2, fontFamily: "'Share Tech Mono'", fontWeight: 'bold' }}>
                DEFENCE MODULES
              </div>
              <span style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Share Tech Mono'" }}>
                SELECT MODULE TO OPERATE
              </span>
            </div>

            <ModuleCard
              icon={Brain}
              title="BORDER-SENTRY"
              code="TF.JS AI"
              desc="Real-time perimeter intrusion detection on video feeds with bounding-box analytics."
              status="REAL AI ACTIVE"
              statusColor="#22c55e"
              onClick={() => { setActiveTab('LIVE'); setSimActive(true); }}
            />
            <ModuleCard
              icon={Globe}
              title="GEO-EYE SATELLITE"
              code="SENTINEL-2"
              desc="ISRO & Sentinel-2 WMS terrain comparison for detecting illegal mining zones."
              status="SATELLITE ONLINE"
              statusColor="#22c55e"
              onClick={() => setActiveTab('GEO-EYE')}
            />
            <ModuleCard
              icon={Activity}
              title="TRACK-GUARD"
              code="RAIL SAFETY"
              desc="Overwatch on railway tracks for wildlife, obstacle detection & speed regulation."
              status="MONITORING ACTIVE"
              statusColor="#22c55e"
              onClick={() => { setActiveTab('TRACK-GUARD'); setTrackActive(true); }}
            />
            <ModuleCard
              icon={Eye}
              title="AR/VR TACTICAL MESH"
              code="THREE.JS 3D"
              desc="3D spatial perimeter visualization, drone telemetry & virtual mission planning."
              status="3D ENGINE READY"
              statusColor="#f59e0b"
              onClick={() => setActiveTab('AR-VR')}
            />
          </div>

          {/* Threat Risk History Graph */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(8,16,10,0.9) 0%, rgba(2,6,3,0.85) 100%)',
              border: '1px solid rgba(34,197,94,0.18)',
              borderRadius: 10,
              padding: '10px 14px',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 18px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ fontSize: '0.58rem', color: '#22c55e', letterSpacing: 1.5, fontFamily: "'Share Tech Mono'", fontWeight: 'bold' }}>
                THREAT RISK TIMELINE (24H)
              </div>
              <span style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Share Tech Mono'" }}>
                SECTOR 7 SENSORS
              </span>
            </div>
            <ThreatChart data={threatHistory} />
          </div>

        </div>

      </div>
    </motion.div>
  );
}
