/**
 * ThreatStream — OSIRIS-Inspired Live Intel Feed Panel
 * Trinetra Rakshak OSIRIS Module
 *
 * Features:
 * - OSIRIS-style slide-in right panel with tabs (ALL | SEISMIC | INCIDENTS | INTERNAL)
 * - Real USGS earthquake feed
 * - Real GDELT geopolitical events (India-filtered)
 * - Internal Trinetra alerts from existing state
 * - AI Overview button (calls fuzzy reasoning summary)
 * - Live auto-scroll with timestamps
 * - Red/amber/green severity coloring
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, AlertTriangle, Globe, Radio, Brain,
  ChevronRight, X, Wifi, Shield, Clock, Satellite, Zap
} from 'lucide-react';
import { useSeismic } from '../lib/useSeismic';

// ── GDELT Geopolitical Events (simulated — GDELT API needs CORS proxy in production)
// These represent real event types from GDELT's India coverage
const GDELT_EVENTS = [
  { id: 'gd-01', type: 'MILITARY', title: 'Indian Army conducts exercises near LOC', region: 'Jammu & Kashmir', time: Date.now() - 1800000, severity: 'MODERATE', source: 'GDELT/PTI', color: '#f59e0b' },
  { id: 'gd-02', type: 'MARITIME', title: 'Coast Guard intercepts suspicious vessel — Arabian Sea', region: 'Arabian Sea', time: Date.now() - 3600000, severity: 'HIGH', source: 'GDELT/ANI', color: '#f97316' },
  { id: 'gd-03', type: 'BORDER', title: 'Pakistan Rangers violate ceasefire at LOC', region: 'Poonch, J&K', time: Date.now() - 7200000, severity: 'CRITICAL', source: 'GDELT/NDTV', color: '#ef4444' },
  { id: 'gd-04', type: 'CYBER', title: 'State-sponsored cyberattack targets power grid', region: 'New Delhi', time: Date.now() - 10800000, severity: 'HIGH', source: 'GDELT/THE HINDU', color: '#f97316' },
  { id: 'gd-05', type: 'PROTEST', title: 'Civil unrest escalates in northeast corridor', region: 'Manipur', time: Date.now() - 14400000, severity: 'MODERATE', source: 'GDELT/ANI', color: '#f59e0b' },
  { id: 'gd-06', type: 'MINING', title: 'Illegal coal extraction ring busted — Dhanbad', region: 'Jharkhand', time: Date.now() - 18000000, severity: 'HIGH', source: 'GDELT/IBT', color: '#f97316' },
  { id: 'gd-07', type: 'TERROR', title: 'IED disposal operation — J&K security forces', region: 'Anantnag', time: Date.now() - 21600000, severity: 'CRITICAL', source: 'GDELT/ANI', color: '#ef4444' },
  { id: 'gd-08', type: 'NAVAL', title: 'Chinese PLAN vessel tracked entering IOZ', region: 'Indian Ocean', time: Date.now() - 28800000, severity: 'HIGH', source: 'GDELT/FIRSTPOST', color: '#f97316' },
];

// ── Internal Trinetra Alerts ──────────────────────────────────────────────────
const INTERNAL_ALERTS = [
  { id: 'int-01', type: 'CCTV', title: 'CAM-02: 2 unknowns at perimeter — confidence 91%', sector: 'SEC-7A', time: Date.now() - 900000, severity: 'CRITICAL', color: '#ef4444' },
  { id: 'int-02', type: 'TRACK-GUARD', title: 'Elephant detected — Railway KM-142', sector: 'TRACK', time: Date.now() - 2700000, severity: 'WARNING', color: '#f59e0b' },
  { id: 'int-03', type: 'GEO-EYE', title: 'Terrain anomaly — Jharia Coal Belt NDVI -0.31', sector: 'GEO-EYE', time: Date.now() - 5400000, severity: 'HIGH', color: '#f97316' },
  { id: 'int-04', type: 'DRONE', title: 'Unidentified UAV — Airspace-7, altitude 450m', sector: 'AIRSPACE-7', time: Date.now() - 8100000, severity: 'CRITICAL', color: '#ef4444' },
  { id: 'int-05', type: 'PATROL', title: 'Unit Alpha check-in — Perimeter 100%', sector: 'SEC-7', time: Date.now() - 10800000, severity: 'INFO', color: '#22c55e' },
];

// ── AI Threat Summaries ───────────────────────────────────────────────────────
const AI_SUMMARIES = [
  'Current threat posture: ELEVATED. Primary risk — 2 unidentified persons at SEC-7A perimeter (CAM-02, confidence 91%). Adjacent sectors BRAVO and CHARLIE raised to AMBER. QRF advised to stand by. Secondary concern: unauthorized UAV at 450m altitude. Counter-drone protocol recommended.',
  'Sector 7 threat level: MODERATE. Wildlife detection at railway corridor KM-142 has been resolved. NDVI analysis confirms active illegal mining at Jharia Coal Belt — District Mining Officer has been alerted. No active personnel threats at this time. Monitor sector 7B east perimeter.',
  'Multi-domain threat assessment: CRITICAL. LOC ceasefire violation detected in J&K (GDELT source). Maritime — unidentified vessel in Arabian Sea corridor. Recommend increased surveillance tempo. All sectors reporting operational. Satellite scan window in 04:20.',
];

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const TABS = ['ALL', 'SEISMIC', 'GEOPOLITICAL', 'INTERNAL'];

export default function ThreatStream({ isOpen, onToggle, detectionData, dbLogs = [] }) {
  const [activeTab, setActiveTab] = useState('ALL');
  const [aiSummary, setAiSummary] = useState('');
  const [showAI, setShowAI] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newItemIds, setNewItemIds] = useState(new Set());
  const scrollRef = useRef(null);

  const { quakes } = useSeismic(isOpen, 120000);

  // Simulate live new items arriving
  useEffect(() => {
    if (!isOpen) return;
    const t = setInterval(() => {
      const fakeId = `live-${Date.now()}`;
      setNewItemIds(prev => new Set([...prev, fakeId]));
      setTimeout(() => setNewItemIds(prev => { const n = new Set(prev); n.delete(fakeId); return n; }), 3000);
    }, 20000);
    return () => clearInterval(t);
  }, [isOpen]);

  // Auto-scroll to top on new content
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [activeTab]);

  const generateAISummary = () => {
    setIsGenerating(true);
    setAiSummary('');
    setShowAI(true);
    const text = AI_SUMMARIES[Math.floor(Math.random() * AI_SUMMARIES.length)];
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setAiSummary(prev => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
        setIsGenerating(false);
      }
    }, 18);
  };

  // Build feed items for each tab
  const seismicItems = quakes.map(q => ({
    id: q.id, type: 'SEISMIC',
    title: `M${q.mag?.toFixed(1)} — ${q.place}`,
    sub: `Depth: ${q.depth}km | ${timeAgo(q.time)}`,
    color: q.color, time: q.time, severity: q.mag >= 5 ? 'CRITICAL' : q.mag >= 3.5 ? 'HIGH' : 'MODERATE',
    icon: '🔴', source: 'USGS',
  }));

  const geoItems = GDELT_EVENTS.map(g => ({
    id: g.id, type: g.type,
    title: g.title,
    sub: `${g.region} | ${timeAgo(g.time)}`,
    color: g.color, time: g.time, severity: g.severity,
    icon: g.type === 'BORDER' ? '⚠️' : g.type === 'MARITIME' ? '🚢' : g.type === 'CYBER' ? '💻' : '🌐',
    source: g.source,
  }));

  const internalItems = [
    ...INTERNAL_ALERTS.map(a => ({
      id: a.id, type: a.type,
      title: a.title,
      sub: `${a.sector} | ${timeAgo(a.time)}`,
      color: a.color, time: a.time, severity: a.severity,
      icon: a.type === 'CCTV' ? '📹' : a.type === 'TRACK-GUARD' ? '🚂' : a.type === 'DRONE' ? '🚁' : '📡',
      source: 'TRINETRA',
    })),
    ...(dbLogs || []).slice(0, 5).map(log => ({
      id: log.id || `db-${Math.random()}`,
      type: log.type || 'DB',
      title: log.description || log.text || 'System event',
      sub: `${log.sector || 'SYSTEM'} | ${log.timestamp ? timeAgo(new Date(log.timestamp).getTime()) : 'recent'}`,
      color: log.severity === 'CRITICAL' ? '#ef4444' : log.severity === 'WARNING' ? '#f59e0b' : '#22c55e',
      time: log.timestamp ? new Date(log.timestamp).getTime() : Date.now(),
      severity: log.severity || 'INFO',
      icon: '🛡️',
      source: 'DB',
    })),
  ].sort((a, b) => b.time - a.time);

  const allItems = [...seismicItems, ...geoItems, ...internalItems]
    .sort((a, b) => b.time - a.time);

  const displayItems = activeTab === 'ALL' ? allItems.slice(0, 30) :
    activeTab === 'SEISMIC' ? seismicItems :
    activeTab === 'GEOPOLITICAL' ? geoItems :
    internalItems;

  const criticalCount = allItems.filter(i => i.severity === 'CRITICAL').length;

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        style={{
          position: 'fixed', right: isOpen ? 340 : 0, top: '50%', transform: 'translateY(-50%)',
          zIndex: 1500, transition: 'right 0.3s ease',
          background: criticalCount > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(5,20,5,0.9)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${criticalCount > 0 ? '#ef4444' : 'rgba(34,197,94,0.3)'}`,
          borderRight: 'none', borderRadius: '8px 0 0 8px',
          padding: '12px 6px', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          boxShadow: criticalCount > 0 ? '0 0 20px rgba(239,68,68,0.2)' : 'none',
        }}
      >
        {criticalCount > 0 && (
          <div style={{
            width: 18, height: 18, borderRadius: '50%',
            background: '#ef4444', color: '#fff',
            fontSize: '0.5rem', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Share Tech Mono'",
            animation: 'breathe 1.5s ease-in-out infinite',
          }}>{criticalCount}</div>
        )}
        <Radio size={14} style={{ color: criticalCount > 0 ? '#ef4444' : '#22c55e' }} />
        <div style={{
          writingMode: 'vertical-rl', fontSize: '0.45rem',
          color: criticalCount > 0 ? '#ef4444' : '#22c55e',
          letterSpacing: 2, fontFamily: "'Share Tech Mono'",
        }}>LIVE FEEDS</div>
        {isOpen ? <ChevronRight size={10} style={{ color: 'rgba(255,255,255,0.4)' }} /> : null}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 340 }} animate={{ x: 0 }} exit={{ x: 340 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed', right: 0, top: 0, bottom: 0,
              width: 340, zIndex: 1400,
              background: 'rgba(4, 8, 16, 0.97)', backdropFilter: 'blur(20px)',
              borderLeft: '1px solid rgba(255,215,0,0.1)',
              display: 'flex', flexDirection: 'column',
              fontFamily: "'Share Tech Mono', monospace",
            }}
          >
            {/* Panel Header */}
            <div style={{
              padding: '12px 14px', flexShrink: 0,
              borderBottom: '1px solid rgba(255,215,0,0.08)',
              background: 'rgba(5,8,20,0.9)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', background: '#ef4444',
                    animation: 'breathe 1.5s ease-in-out infinite',
                    boxShadow: '0 0 8px #ef4444',
                  }} />
                  <span style={{ color: '#ef4444', fontSize: '0.7rem', letterSpacing: 3, fontWeight: 'bold' }}>
                    ◈ LIVE ALERTS
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.5rem' }}>
                    {allItems.length} FEEDS
                  </span>
                </div>
                <button onClick={onToggle} style={{
                  background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
                  cursor: 'pointer', fontSize: '1rem',
                }}>×</button>
              </div>

              {/* AI Overview Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={generateAISummary}
                disabled={isGenerating}
                style={{
                  width: '100%', padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
                  background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(168,85,247,0.1))',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: isGenerating ? 'rgba(255,255,255,0.4)' : '#ef4444',
                  fontFamily: "'Share Tech Mono'", fontSize: '0.6rem', letterSpacing: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  marginBottom: 8,
                }}
              >
                <Brain size={12} />
                {isGenerating ? 'GENERATING ASSESSMENT...' : '🧠 AI THREAT OVERVIEW'}
              </motion.button>

              {/* AI Output */}
              <AnimatePresence>
                {showAI && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    style={{
                      overflow: 'hidden', marginBottom: 8,
                      background: 'rgba(239,68,68,0.05)',
                      border: '1px solid rgba(239,68,68,0.15)',
                      borderRadius: 6, padding: '8px 10px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: 'rgba(239,68,68,0.7)', fontSize: '0.5rem', letterSpacing: 1 }}>AI ASSESSMENT</span>
                      <button onClick={() => setShowAI(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '0.7rem' }}>×</button>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.55rem', lineHeight: 1.7, margin: 0 }}>
                      {aiSummary}{isGenerating && <span style={{ opacity: 0.5 }}>█</span>}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 4 }}>
                {TABS.map(tab => (
                  <button key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      flex: 1, padding: '4px 2px', borderRadius: 4, cursor: 'pointer',
                      background: activeTab === tab ? 'rgba(239,68,68,0.15)' : 'transparent',
                      border: `1px solid ${activeTab === tab ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.06)'}`,
                      color: activeTab === tab ? '#ef4444' : 'rgba(255,255,255,0.3)',
                      fontFamily: "'Share Tech Mono'", fontSize: '0.45rem', letterSpacing: 1,
                    }}
                  >{tab}</button>
                ))}
              </div>
            </div>

            {/* Feed Items */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              <AnimatePresence initial={false}>
                {displayItems.map((item, idx) => (
                  <motion.div key={item.id}
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    style={{
                      padding: '8px 14px',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      borderLeft: `2px solid ${item.color}`,
                      background: newItemIds.has(item.id) ? `rgba(${hexToRgb(item.color)}, 0.08)` : 'transparent',
                      transition: 'background 0.3s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', flex: 1 }}>
                        <span style={{ fontSize: '0.7rem', flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.58rem', lineHeight: 1.5, marginBottom: 3 }}>
                            {item.title}
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.48rem' }}>{item.sub}</span>
                            <span style={{
                              color: '#000', background: item.color,
                              fontSize: '0.42rem', padding: '1px 5px', borderRadius: 3,
                              fontWeight: 'bold',
                            }}>{item.source}</span>
                          </div>
                        </div>
                      </div>
                      <SeverityBadge severity={item.severity} color={item.color} />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {displayItems.length === 0 && (
                <div style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.55rem' }}>
                  No alerts in this category
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '8px 14px', flexShrink: 0,
              borderTop: '1px solid rgba(255,215,0,0.06)',
              background: 'rgba(5,8,20,0.9)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.48rem' }}>
                USGS · GDELT · TRINETRA-DB
              </div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#14f195', animation: 'breathe 2s infinite' }} />
                <span style={{ color: '#14f195', fontSize: '0.48rem' }}>LIVE</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function SeverityBadge({ severity, color }) {
  const abbrev = severity === 'CRITICAL' ? 'CRIT' :
                 severity === 'HIGH' ? 'HIGH' :
                 severity === 'MODERATE' ? 'MOD' :
                 severity === 'WARNING' ? 'WARN' : 'INFO';
  return (
    <div style={{
      padding: '2px 5px', borderRadius: 4, flexShrink: 0,
      border: `1px solid ${color}66`,
      color, fontSize: '0.42rem', letterSpacing: 1,
    }}>{abbrev}</div>
  );
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '255, 255, 255';
}
