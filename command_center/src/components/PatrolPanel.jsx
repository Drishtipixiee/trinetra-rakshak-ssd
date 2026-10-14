/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Navigation, MapPin, Radio, Shield, Activity,
  AlertTriangle, Users, Play, Square, Zap
} from 'lucide-react';

const API_URL = import.meta.env.PROD
  ? 'https://backend-ten-fawn-25.vercel.app'
  : 'http://127.0.0.1:5000';

const WAYPOINTS = [
  { name: 'POST-ALPHA',  sector: 'SEC-7',  lat: 31.6340, lng: 74.8720, status: 'SECURE' },
  { name: 'GATE-NORTH',  sector: 'SEC-7A', lat: 31.6355, lng: 74.8745, status: 'SECURE' },
  { name: 'FENCE-LINE',  sector: 'SEC-7B', lat: 31.6370, lng: 74.8760, status: 'PATROL' },
  { name: 'POST-BRAVO',  sector: 'SEC-12', lat: 31.6360, lng: 74.8780, status: 'SECURE' },
  { name: 'RIVER-BANK',  sector: 'SEC-12A',lat: 31.6345, lng: 74.8770, status: 'WATCH'  },
  { name: 'MAIN-ROAD',   sector: 'SEC-18', lat: 31.6330, lng: 74.8750, status: 'SECURE' },
  { name: 'POST-CHARLIE',sector: 'SEC-18B',lat: 31.6320, lng: 74.8730, status: 'SECURE' },
  { name: 'CMD-POST',    sector: 'HQ',     lat: 31.6330, lng: 74.8715, status: 'ACTIVE'  },
];

const UNITS = [
  { id: 'ALPHA',   name: 'Alpha Unit',   officer: 'Maj. R. Sharma',  men: 6, status: 'ON PATROL', statusColor: '#22c55e', wpIdx: 0 },
  { id: 'BRAVO',   name: 'Bravo Unit',   officer: 'Sub. V. Singh',   men: 4, status: 'STANDBY',   statusColor: '#f59e0b', wpIdx: 3 },
  { id: 'CHARLIE', name: 'Charlie Unit', officer: 'Hav. P. Kumar',   men: 5, status: 'ON PATROL', statusColor: '#22c55e', wpIdx: 6 },
  { id: 'QRF',     name: 'Quick React Force', officer: 'Sep. A. Yadav', men: 8, status: 'READY',  statusColor: '#ef4444', wpIdx: 7 },
];

const STATUS_LOG_MSGS = [
  'Perimeter check complete. No anomaly.',
  'Gate sealed. Awaiting next rotation.',
  'Motion sensor triggered — assessed as animal.',
  'Night vision activated. Patrol continuing.',
  'Check-in: sector clear, all posts secure.',
  'Dog squad deployed at river bank.',
];

export default function PatrolPanel({ addLog }) {
  const [wpIdx, setWpIdx]               = useState(0);
  const [log,   setLog]                 = useState([
    { time: '21:15', unit: 'ALPHA',   msg: 'Check-in at POST-ALPHA. Perimeter clear.',              type: 'safe'    },
    { time: '21:31', unit: 'CHARLIE', msg: 'Motion at FENCE-LINE — classified as animal.',          type: 'warning' },
    { time: '21:38', unit: 'QRF',     msg: 'QRF at CMD-POST. Ready for immediate deployment.',       type: 'normal'  },
  ]);
  const [qrfDeployed, setQrfDeployed]   = useState(false);
  const [lockdown,    setLockdown]      = useState(false);
  const [gpsLive,     setGpsLive]       = useState(null);
  const logEndRef = useRef(null);

  // Advance patrol waypoint every 7s
  useEffect(() => {
    const t = setInterval(() => setWpIdx(p => (p + 1) % WAYPOINTS.length), 7000);
    return () => clearInterval(t);
  }, []);

  // Try real GPS
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      p => setGpsLive({ lat: p.coords.latitude.toFixed(4), lng: p.coords.longitude.toFixed(4) }),
      () => setGpsLive(null),
      { timeout: 5000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // Auto check-in every 25s
  useEffect(() => {
    const t = setInterval(() => {
      const wp   = WAYPOINTS[wpIdx];
      const unit = UNITS[Math.floor(Math.random() * 3)]; // exclude QRF for auto
      const now  = new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' });
      const msg  = STATUS_LOG_MSGS[Math.floor(Math.random() * STATUS_LOG_MSGS.length)];
      addEntry({ time: now, unit: unit.id, msg: `[${wp.name}] ${msg}`, type: 'normal' });
    }, 25000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wpIdx]);

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [log]);

  function addEntry(entry) {
    setLog(prev => [...prev.slice(-20), entry]);
    // log to backend DB silently
    fetch(`${API_URL}/api/log_incident`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'PATROL', sector: WAYPOINTS[wpIdx]?.sector || 'SEC-7', severity: entry.type === 'warning' ? 'WARNING' : 'INFO', details: entry.msg }),
    }).catch(() => {});
  }

  function deployQRF() {
    const now = new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' });
    setQrfDeployed(true);
    addEntry({ time: now, unit: 'QRF', msg: '🚨 QRF DEPLOYED — 8 personnel en-route. ETA 4 min.', type: 'warning' });
    if (addLog) addLog('[QRF] Quick Reaction Force deployed to active threat zone.', 'critical');
    fetch(`${API_URL}/api/log_incident`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'PATROL', sector: WAYPOINTS[wpIdx]?.sector, severity: 'CRITICAL', details: 'QRF deployed from command panel.' }),
    }).catch(() => {});
    setTimeout(() => setQrfDeployed(false), 15000);
  }

  function triggerLockdown() {
    const now = new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' });
    setLockdown(true);
    addEntry({ time: now, unit: 'CMD', msg: '🔒 SECTOR LOCKDOWN INITIATED. All gates sealed.', type: 'warning' });
    if (addLog) addLog('[SEC] Full sector lockdown — all gates sealed.', 'critical');
    setTimeout(() => setLockdown(false), 20000);
  }

  const currentWP = WAYPOINTS[wpIdx];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', overflow: 'hidden' }}>

      {/* ── Title ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.6rem', color: '#22c55e', fontFamily: "'Share Tech Mono'", letterSpacing: 2 }}>
          <Navigation size={12} /> PATROL COMMAND
        </div>
        <div style={{ fontSize: '0.42rem', fontFamily: "'Share Tech Mono'", color: gpsLive ? '#22c55e' : '#f59e0b', background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: 3, border: `1px solid ${gpsLive ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
          {gpsLive ? '● LIVE GPS' : '○ SIM TRACK'}
        </div>
      </div>

      {/* ── Active Position ── */}
      <div style={{ background: lockdown ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.05)', border: `1px solid ${lockdown ? 'rgba(239,68,68,0.35)' : 'rgba(34,197,94,0.2)'}`, borderRadius: 7, padding: '7px 9px' }}>
        <div style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Share Tech Mono'", letterSpacing: 2, marginBottom: 3 }}>
          {lockdown ? '🔒 LOCKDOWN ACTIVE' : 'ACTIVE POSITION'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <MapPin size={11} color={lockdown ? '#ef4444' : '#22c55e'} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.6rem', color: lockdown ? '#ef4444' : '#22c55e', fontFamily: "'Share Tech Mono'", fontWeight: 'bold' }}>{currentWP.name}</div>
            <div style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Share Tech Mono'" }}>
              {gpsLive ? `${gpsLive.lat}°N ${gpsLive.lng}°E` : `${currentWP.lat}°N ${currentWP.lng}°E`}
            </div>
          </div>
          <div style={{ fontSize: '0.42rem', color: lockdown ? '#ef4444' : '#22c55e', background: lockdown ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.08)', padding: '2px 5px', borderRadius: 3, fontFamily: "'Share Tech Mono'" }}>
            {currentWP.sector}
          </div>
        </div>
      </div>

      {/* ── QRF + Lockdown action row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
          onClick={deployQRF}
          style={{
            background: qrfDeployed ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${qrfDeployed ? '#ef4444' : 'rgba(239,68,68,0.4)'}`,
            borderRadius: 6, padding: '8px 4px', cursor: 'pointer',
            color: '#ef4444', fontFamily: "'Share Tech Mono'", fontSize: '0.52rem',
            fontWeight: 'bold', letterSpacing: 0.5,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            animation: qrfDeployed ? 'breathe 0.8s infinite' : 'none',
          }}
        >
          <Shield size={11} /> {qrfDeployed ? 'DEPLOYED ✓' : 'DEPLOY QRF'}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
          onClick={triggerLockdown}
          style={{
            background: lockdown ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.06)',
            border: `1px solid ${lockdown ? '#ef4444' : 'rgba(245,158,11,0.35)'}`,
            borderRadius: 6, padding: '8px 4px', cursor: 'pointer',
            color: lockdown ? '#ef4444' : '#f59e0b',
            fontFamily: "'Share Tech Mono'", fontSize: '0.52rem',
            fontWeight: 'bold', letterSpacing: 0.5,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}
        >
          <Zap size={11} /> {lockdown ? 'LOCKED 🔒' : 'LOCKDOWN'}
        </motion.button>
      </div>

      {/* ── Field Units ── */}
      <div style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Share Tech Mono'", letterSpacing: 2 }}>FIELD UNITS — {UNITS.filter(u => u.status === 'ON PATROL').length} ACTIVE</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {UNITS.map(unit => (
          <motion.div key={unit.id} whileHover={{ x: 2 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: unit.id === 'QRF' ? 'rgba(239,68,68,0.05)' : 'rgba(0,0,0,0.25)',
              border: `1px solid ${unit.statusColor}20`,
              borderLeft: `2px solid ${unit.statusColor}`,
              borderRadius: 5, padding: '5px 7px',
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: unit.statusColor, animation: unit.status === 'ON PATROL' || unit.status === 'READY' ? 'breathe 1.5s infinite' : 'none', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.52rem', color: '#ddeedd', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{unit.name}</div>
              <div style={{ fontSize: '0.4rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Share Tech Mono'" }}>{unit.officer} · {unit.men} men</div>
            </div>
            <div style={{ fontSize: '0.42rem', color: unit.statusColor, fontFamily: "'Share Tech Mono'", whiteSpace: 'nowrap', background: `${unit.statusColor}10`, padding: '1px 4px', borderRadius: 3 }}>
              {unit.status}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Waypoint Track ── */}
      <div style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Share Tech Mono'", letterSpacing: 2 }}>PATROL ROUTE</div>
      <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        {WAYPOINTS.map((wp, i) => (
          <div key={i} title={wp.name}
            style={{
              width: i === wpIdx ? 10 : 7,
              height: i === wpIdx ? 10 : 7,
              borderRadius: '50%',
              background: i === wpIdx ? '#22c55e' : i < wpIdx ? 'rgba(34,197,94,0.35)' : 'rgba(255,255,255,0.1)',
              border: i === wpIdx ? '2px solid rgba(34,197,94,0.7)' : 'none',
              transition: 'all 0.5s',
              animation: i === wpIdx ? 'breathe 1s infinite' : 'none',
              flexShrink: 0,
            }}
          />
        ))}
        <div style={{ fontSize: '0.4rem', color: 'rgba(34,197,94,0.6)', fontFamily: "'Share Tech Mono'", marginLeft: 4 }}>
          {wpIdx + 1}/{WAYPOINTS.length}
        </div>
      </div>

      {/* ── Patrol Log ── */}
      <div style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Share Tech Mono'", letterSpacing: 2 }}>PATROL LOG</div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2, minHeight: 50 }}>
        <AnimatePresence initial={false}>
          {log.map((e, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
              style={{
                fontSize: '0.44rem', fontFamily: "'Share Tech Mono'",
                padding: '3px 6px', borderRadius: 4,
                borderLeft: `2px solid ${e.type === 'warning' ? '#f59e0b' : e.type === 'safe' ? '#22c55e' : 'rgba(255,255,255,0.1)'}`,
                background: 'rgba(0,0,0,0.2)',
                color: e.type === 'warning' ? '#fde68a' : e.type === 'safe' ? '#bbf7d0' : 'rgba(255,255,255,0.45)',
                lineHeight: 1.5,
              }}
            >
              <span style={{ color: '#22c55e' }}>[{e.time}]</span>
              <span style={{ color: e.unit === 'QRF' ? '#ef4444' : 'rgba(255,255,255,0.5)', margin: '0 3px' }}>[{e.unit}]</span>
              {e.msg}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={logEndRef} />
      </div>

      {/* ── Quick Status buttons ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        <motion.button whileTap={{ scale: 0.95 }}
          onClick={() => {
            const now = new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' });
            addEntry({ time: now, unit: 'ALPHA', msg: 'Air support requested for perimeter scan.', type: 'warning' });
          }}
          style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 5, padding: '6px', cursor: 'pointer', color: '#22c55e', fontFamily: "'Share Tech Mono'", fontSize: '0.45rem', letterSpacing: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
        >
          <Radio size={9} /> AIR SUPPORT
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }}
          onClick={() => {
            const now = new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' });
            addEntry({ time: now, unit: 'CMD', msg: 'Night patrol rotation initiated. All units switching.', type: 'normal' });
          }}
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 5, padding: '6px', cursor: 'pointer', color: '#f59e0b', fontFamily: "'Share Tech Mono'", fontSize: '0.45rem', letterSpacing: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
        >
          <Activity size={9} /> ROTATE
        </motion.button>
      </div>
    </div>
  );
}
