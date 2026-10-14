/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, MapPin, Radio, Clock, Shield, Activity, CheckCircle2, AlertTriangle, User } from 'lucide-react';

const API_URL = import.meta.env.PROD
  ? 'https://backend-ten-fawn-25.vercel.app'
  : 'http://127.0.0.1:5000';

// Patrol waypoints — Jharkhand / Amritsar border corridor
const PATROL_WAYPOINTS = [
  { lat: 31.6340, lng: 74.8720, name: 'POST-ALPHA', sector: 'SEC-7', status: 'SECURE' },
  { lat: 31.6355, lng: 74.8745, name: 'GATE-NORTH', sector: 'SEC-7A', status: 'SECURE' },
  { lat: 31.6370, lng: 74.8760, name: 'FENCE-LINE', sector: 'SEC-7B', status: 'PATROL' },
  { lat: 31.6360, lng: 74.8780, name: 'POST-BRAVO', sector: 'SEC-12', status: 'SECURE' },
  { lat: 31.6345, lng: 74.8770, name: 'RIVER-BANK', sector: 'SEC-12A', status: 'WATCH' },
  { lat: 31.6330, lng: 74.8750, name: 'MAIN-ROAD', sector: 'SEC-18', status: 'SECURE' },
  { lat: 31.6320, lng: 74.8730, name: 'POST-CHARLIE', sector: 'SEC-18B', status: 'SECURE' },
  { lat: 31.6330, lng: 74.8715, name: 'CMD-POST', sector: 'HQ', status: 'ACTIVE' },
];

const PATROL_UNITS = [
  { id: 'ALPHA', name: 'Patrol Unit Alpha', officer: 'Maj. Rajesh Sharma', status: 'ON PATROL', color: '#22c55e' },
  { id: 'BRAVO', name: 'Patrol Unit Bravo', officer: 'Sub. Vikram Singh', status: 'STANDBY', color: '#38bdf8' },
  { id: 'CHARLIE', name: 'Patrol Unit Charlie', officer: 'Hav. Pradeep Kumar', status: 'ON PATROL', color: '#22c55e' },
  { id: 'QRF', name: 'Quick Reaction Force', officer: 'Sep. Amit Yadav', status: 'READY', color: '#f59e0b' },
];

export default function PatrolPanel() {
  const [activeUnit, setActiveUnit] = useState('ALPHA');
  const [waypointIdx, setWaypointIdx] = useState(0);
  const [patrolLog, setPatrolLog] = useState([
    { time: '21:15', unit: 'ALPHA', msg: 'Check-in at POST-ALPHA. Perimeter clear.', type: 'safe' },
    { time: '21:22', unit: 'BRAVO', msg: 'Night scan started. IR sensors active.', type: 'normal' },
    { time: '21:31', unit: 'CHARLIE', msg: 'Motion detected at FENCE-LINE — classified as animal.', type: 'warning' },
    { time: '21:38', unit: 'QRF', msg: 'QRF on standby at CMD-POST. Ready for rapid deploy.', type: 'normal' },
  ]);
  const [gpsPos, setGpsPos] = useState(null);
  const [gpsSource, setGpsSource] = useState('SIM');
  const intervalRef = useRef(null);
  const logEndRef = useRef(null);

  // Real GPS — fall back to simulated path
  useEffect(() => {
    if ('geolocation' in navigator) {
      const id = navigator.geolocation.watchPosition(
        pos => {
          setGpsPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsSource('GPS');
        },
        () => { setGpsSource('SIM'); },
        { enableHighAccuracy: true, timeout: 5000 }
      );
      return () => navigator.geolocation.clearWatch(id);
    }
  }, []);

  // Simulated patrol movement
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setWaypointIdx(prev => (prev + 1) % PATROL_WAYPOINTS.length);
    }, 6000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Log check-ins every 30s
  useEffect(() => {
    const logTimer = setInterval(() => {
      const wp = PATROL_WAYPOINTS[waypointIdx];
      const unit = PATROL_UNITS[Math.floor(Math.random() * PATROL_UNITS.length)];
      const now = new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' });
      const messages = [
        `Passed ${wp.name}. Sector ${wp.sector} clear.`,
        `Check-in: ${wp.name}. No anomaly detected.`,
        `Route marker confirmed at ${wp.name}. Continuing patrol.`,
      ];
      setPatrolLog(prev => [...prev.slice(-15), {
        time: now,
        unit: unit.id,
        msg: messages[Math.floor(Math.random() * messages.length)],
        type: 'normal'
      }]);
    }, 30000);
    return () => clearInterval(logTimer);
  }, [waypointIdx]);

  // Auto-log to backend
  useEffect(() => {
    const wp = PATROL_WAYPOINTS[waypointIdx];
    if (wp) {
      fetch(`${API_URL}/api/log_incident`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'PATROL',
          sector: wp.sector,
          severity: 'INFO',
          details: `Patrol Unit Alpha at waypoint ${wp.name} — ${wp.status}`,
        })
      }).catch(() => { /* offline ok */ });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waypointIdx]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [patrolLog]);

  const currentWP = gpsPos
    ? { lat: gpsPos.lat, lng: gpsPos.lng, name: 'LIVE GPS', sector: 'LIVE', status: 'GPS' }
    : PATROL_WAYPOINTS[waypointIdx];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.65rem', color: '#22c55e', fontFamily: "'Share Tech Mono'", letterSpacing: 2 }}>
          <Navigation size={13} />
          PATROL TRACKER
        </div>
        <div style={{ fontSize: '0.5rem', color: gpsSource === 'GPS' ? '#22c55e' : '#f59e0b', fontFamily: "'Share Tech Mono'", background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4, border: `1px solid ${gpsSource === 'GPS' ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
          {gpsSource === 'GPS' ? '● LIVE GPS' : '○ SIM TRACK'}
        </div>
      </div>

      {/* Live Position */}
      <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '8px 10px' }}>
        <div style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Share Tech Mono'", letterSpacing: 2, marginBottom: 4 }}>ACTIVE UNIT POSITION</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <MapPin size={12} color="#22c55e" />
          <div>
            <div style={{ fontSize: '0.6rem', color: '#22c55e', fontFamily: "'Share Tech Mono'", fontWeight: 'bold' }}>{currentWP.name}</div>
            <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Share Tech Mono'" }}>
              {currentWP.lat.toFixed(4)}°N, {currentWP.lng.toFixed(4)}°E
            </div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '0.5rem', color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '2px 6px', borderRadius: 4, fontFamily: "'Share Tech Mono'" }}>
            {currentWP.sector}
          </div>
        </div>
      </div>

      {/* Patrol Units */}
      <div style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Share Tech Mono'", letterSpacing: 2 }}>FIELD UNITS</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {PATROL_UNITS.map(unit => (
          <motion.div
            key={unit.id}
            onClick={() => setActiveUnit(unit.id)}
            whileHover={{ x: 2 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: activeUnit === unit.id ? `${unit.color}10` : 'rgba(0,0,0,0.2)',
              border: `1px solid ${activeUnit === unit.id ? unit.color + '40' : 'rgba(255,255,255,0.05)'}`,
              borderRadius: 6, padding: '5px 8px', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: unit.color, animation: unit.status === 'ON PATROL' ? 'breathe 1.5s infinite' : 'none', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.55rem', color: '#e8f5e9', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{unit.name}</div>
              <div style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{unit.officer}</div>
            </div>
            <div style={{ fontSize: '0.42rem', color: unit.color, fontFamily: "'Share Tech Mono'", whiteSpace: 'nowrap', flexShrink: 0 }}>{unit.status}</div>
          </motion.div>
        ))}
      </div>

      {/* Waypoint Progress */}
      <div style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Share Tech Mono'", letterSpacing: 2 }}>ROUTE WAYPOINTS</div>
      <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {PATROL_WAYPOINTS.map((wp, i) => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: i === waypointIdx ? '#22c55e' : i < waypointIdx ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)',
            border: i === waypointIdx ? '2px solid rgba(34,197,94,0.8)' : 'none',
            transition: 'all 0.5s',
            animation: i === waypointIdx ? 'breathe 1s infinite' : 'none',
          }} title={wp.name} />
        ))}
      </div>

      {/* Patrol Log */}
      <div style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Share Tech Mono'", letterSpacing: 2 }}>PATROL LOG</div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2, minHeight: 60 }}>
        <AnimatePresence initial={false}>
          {patrolLog.map((entry, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              style={{
                fontSize: '0.48rem', fontFamily: "'Share Tech Mono'",
                padding: '3px 6px', borderRadius: 4,
                borderLeft: `2px solid ${entry.type === 'warning' ? '#f59e0b' : entry.type === 'safe' ? '#22c55e' : 'rgba(255,255,255,0.15)'}`,
                background: 'rgba(0,0,0,0.2)',
                color: entry.type === 'warning' ? '#fde68a' : entry.type === 'safe' ? '#bbf7d0' : 'rgba(255,255,255,0.5)',
              }}
            >
              <span style={{ color: '#38bdf8' }}>[{entry.time}]</span>
              <span style={{ color: '#a78bfa', margin: '0 4px' }}>[{entry.unit}]</span>
              {entry.msg}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={logEndRef} />
      </div>

      {/* Quick Deploy Button */}
      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        onClick={() => {
          const now = new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' });
          setPatrolLog(prev => [...prev.slice(-15), { time: now, unit: 'QRF', msg: '🚨 QRF DEPLOYED to current threat zone. ETA: 4 minutes.', type: 'warning' }]);
          fetch(`${API_URL}/api/log_incident`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'PATROL', sector: currentWP.sector, severity: 'WARNING', details: 'QRF deployed from command panel.' })
          }).catch(() => {});
        }}
        style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)',
          color: '#ef4444', borderRadius: 6, padding: '7px', cursor: 'pointer',
          fontFamily: "'Share Tech Mono'", fontSize: '0.55rem', letterSpacing: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          width: '100%'
        }}
      >
        <Radio size={11} /> DEPLOY QRF
      </motion.button>
    </div>
  );
}
