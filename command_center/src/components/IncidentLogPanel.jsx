/* eslint-disable react/prop-types */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Database, Filter, RefreshCw, Clock, MapPin, Shield, CheckCircle2, XCircle } from 'lucide-react';

const API_URL = import.meta.env.PROD
  ? 'https://backend-ten-fawn-25.vercel.app'
  : 'http://127.0.0.1:5000';

const SEVERITY_COLORS = {
  CRITICAL: { bg: 'rgba(239,68,68,0.12)', border: '#ef4444', text: '#fca5a5' },
  WARNING:  { bg: 'rgba(245,158,11,0.10)', border: '#f59e0b', text: '#fde68a' },
  HIGH:     { bg: 'rgba(249,115,22,0.10)', border: '#f97316', text: '#fdba74' },
  INFO:     { bg: 'rgba(34,197,94,0.08)',  border: '#22c55e', text: '#bbf7d0' },
  LOW:      { bg: 'rgba(148,163,184,0.08)', border: '#64748b', text: '#94a3b8' },
};

const TYPE_ICONS = {
  INTRUSION: '🚨',
  WILDLIFE:  '🐘',
  DRONE:     '🛸',
  MINING:    '⛏️',
  PATROL:    '👮',
  AUDIT:     '📋',
  DETECTION: '🎯',
};

function IncidentCard({ inc, index }) {
  const sev = SEVERITY_COLORS[inc.severity] || SEVERITY_COLORS.LOW;
  const ts = inc.timestamp
    ? new Date(inc.timestamp).toLocaleString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' })
    : 'N/A';

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      style={{
        background: sev.bg,
        border: `1px solid ${sev.border}30`,
        borderLeft: `3px solid ${sev.border}`,
        borderRadius: 7,
        padding: '7px 9px',
        marginBottom: 4,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: '0.65rem' }}>{TYPE_ICONS[inc.type] || '📌'}</span>
          <span style={{ fontSize: '0.52rem', fontFamily: "'Share Tech Mono'", color: sev.text, fontWeight: 700 }}>
            [{inc.severity}] {inc.type}
          </span>
        </div>
        <span style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Share Tech Mono'" }}>
          INC-{1000 + (inc.id || 0)}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
        <MapPin size={8} color={sev.border} />
        <span style={{ fontSize: '0.48rem', color: sev.border, fontFamily: "'Share Tech Mono'" }}>{inc.sector}</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.42rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Share Tech Mono'" }}>
          <Clock size={7} style={{ verticalAlign: 'middle', marginRight: 2 }} />{ts}
        </span>
      </div>
      <div style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
        {inc.description}
      </div>
      <div style={{ marginTop: 4, display: 'flex', gap: 4, alignItems: 'center' }}>
        <div style={{
          fontSize: '0.4rem', fontFamily: "'Share Tech Mono'",
          color: inc.status === 'ACTIVE' ? '#ef4444' : '#22c55e',
          background: inc.status === 'ACTIVE' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
          border: `1px solid ${inc.status === 'ACTIVE' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
          padding: '1px 5px', borderRadius: 3,
        }}>
          {inc.status === 'ACTIVE' ? '● ACTIVE' : '✓ RESOLVED'}
        </div>
        {inc.risk_score > 0 && (
          <div style={{ fontSize: '0.4rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Share Tech Mono'" }}>
            RISK: {inc.risk_score}%
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function IncidentLogPanel({ dbLogs = [] }) {
  const [filter, setFilter] = useState('ALL');
  const [liveData, setLiveData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/incidents?limit=30`);
      const data = await res.json();
      if (data.incidents && data.incidents.length > 0) {
        setLiveData(data.incidents);
        setIsConnected(true);
      } else {
        setLiveData(dbLogs);
        setIsConnected(false);
      }
    } catch {
      setLiveData(dbLogs);
      setIsConnected(false);
    } finally {
      setLoading(false);
      setLastFetch(new Date().toLocaleTimeString('en-IN', { hour12: false }));
    }
  }, [dbLogs]);

  useEffect(() => {
    fetchIncidents();
    const t = setInterval(fetchIncidents, 10000);
    return () => clearInterval(t);
  }, [fetchIncidents]);

  const displayData = liveData.length > 0 ? liveData : dbLogs;
  const filtered = filter === 'ALL' ? displayData : displayData.filter(i => i.severity === filter || i.type === filter);

  const critCount = displayData.filter(i => i.severity === 'CRITICAL').length;
  const warnCount = displayData.filter(i => i.severity === 'WARNING').length;

  const FILTERS = ['ALL', 'CRITICAL', 'WARNING', 'INTRUSION', 'WILDLIFE', 'DRONE', 'MINING'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, height: '100%', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.65rem', color: '#ef4444', fontFamily: "'Share Tech Mono'", letterSpacing: 2 }}>
          <AlertTriangle size={13} />
          INCIDENT LOGS
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: isConnected ? '#22c55e' : '#f59e0b', animation: 'breathe 2s infinite' }} />
          <span style={{ fontSize: '0.42rem', color: isConnected ? '#22c55e' : '#f59e0b', fontFamily: "'Share Tech Mono'" }}>
            {isConnected ? 'DB LIVE' : 'LOCAL'}
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
        {[
          { label: 'TOTAL', value: displayData.length, color: '#22c55e' },
          { label: 'CRITICAL', value: critCount, color: '#ef4444' },
          { label: 'WARNING', value: warnCount, color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${s.color}20`, borderRadius: 6, padding: '5px 4px', textAlign: 'center' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: s.color, fontFamily: "'Share Tech Mono'" }}>{s.value}</div>
            <div style={{ fontSize: '0.38rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Share Tech Mono'", letterSpacing: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Row */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <Filter size={9} color="rgba(255,255,255,0.3)" />
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? 'rgba(34,197,94,0.15)' : 'transparent',
            border: `1px solid ${filter === f ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}`,
            color: filter === f ? '#22c55e' : 'rgba(255,255,255,0.35)',
            borderRadius: 4, padding: '2px 5px', cursor: 'pointer',
            fontSize: '0.4rem', fontFamily: "'Share Tech Mono'",
          }}>
            {f}
          </button>
        ))}
        <button onClick={fetchIncidents} title="Refresh" style={{
          background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.35)', borderRadius: 4, padding: '2px 5px', cursor: 'pointer',
          marginLeft: 'auto', display: 'flex', alignItems: 'center',
        }}>
          <RefreshCw size={8} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      {lastFetch && (
        <div style={{ fontSize: '0.4rem', color: 'rgba(255,255,255,0.25)', fontFamily: "'Share Tech Mono'" }}>
          Last sync: {lastFetch} | {isConnected ? <><Database size={7} style={{ verticalAlign: 'middle' }} /> SQLite LIVE</> : 'Local cache'}
        </div>
      )}

      {/* Incident List */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 2 }}>
        {filtered.length === 0 ? (
          <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '20px 0', fontFamily: "'Share Tech Mono'" }}>
            No incidents found
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((inc, i) => (
              <IncidentCard key={inc.id || i} inc={inc} index={i} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
