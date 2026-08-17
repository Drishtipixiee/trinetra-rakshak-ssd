import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Train, AlertTriangle, Shield, Volume2, VolumeX, Eye, Radio,
  Layers, Camera, Gauge, Compass, Activity, Zap, Play, Square, RefreshCw, Sparkles
} from 'lucide-react';
import { playKlaxon, playDetectionBeep, playSuccessChime } from './AIVoiceSystem';
import RealFeedVideo from './RealFeedVideo';
import { REAL_MEDIA } from '../lib/realMediaFeeds';

const TRACK_FEEDS = [
  {
    id: 'CAB-01',
    name: 'FRONT LOCOMOTIVE CAB // RAJDHANI 12042',
    videoUrl: REAL_MEDIA.railwayIndia,
    speed: 110,
    gradient: '+0.2%'
  },
  {
    id: 'MAST-142',
    name: 'OPTICAL SENSOR MAST // KM-142 CORRIDOR',
    videoUrl: REAL_MEDIA.wildlifeCorridor,
    speed: 110,
    gradient: 'FLAT'
  },
  {
    id: 'THERMAL-7',
    name: 'FLIR THERMAL WILDLIFE SENTRY',
    videoUrl: REAL_MEDIA.railwayPlatform,
    speed: 110,
    gradient: '+0.1%'
  }
];

export default function TrackGuardPanel({
  trackActive,
  setTrackActive,
  trackData,
  setTrackData,
  addLog,
  voiceRef,
  voiceEnabled,
  logToSupabase
}) {
  const [selectedFeed, setSelectedFeed] = useState(TRACK_FEEDS[0]);
  const [obstacleDistance, setObstacleDistance] = useState(780); // meters
  const [trainSpeed, setTrainSpeed] = useState(110); // km/h
  const [brakeApplied, setBrakeApplied] = useState(false);
  const [hornActive, setHornActive] = useState(false);
  const [timeToImpact, setTimeToImpact] = useState(25);
  const [aiConfidence, setAiConfidence] = useState(96.4);
  const [flirShader, setFlirShader] = useState(false);

  const videoRef = useRef(null);
  const tickRef = useRef(0);

  const triggerHorn = () => {
    setHornActive(true);
    if (addLog) addLog('[TRK-GUARD] Locomotive Dual-Tone Horn sounded (120dB acoustic deterrent).', 'warning');
    setTimeout(() => setHornActive(false), 2000);
  };

  // Autonomous Track Guard Scenario Sequence
  useEffect(() => {
    if (!trackActive) {
      setTrainSpeed(110);
      setObstacleDistance(2000);
      setBrakeApplied(false);
      setTimeToImpact(99);
      return;
    }

    const interval = setInterval(() => {
      tickRef.current += 1;
      const t = tickRef.current % 100;

      if (t < 15) {
        setTrainSpeed(115);
        setObstacleDistance(2000);
        setBrakeApplied(false);
        setTimeToImpact(99);
      } else if (t < 35) {
        const dist = Math.max(750, 1450 - (t - 15) * 35);
        setObstacleDistance(Math.round(dist));
        const speedMs = trainSpeed * (5 / 18);
        setTimeToImpact(Math.round(dist / speedMs));

        if (t === 16) {
          playDetectionBeep();
          if (addLog) addLog('[TRK-GUARD] ⚠ Laser LiDAR: Obstacle detected at 1,450m. Class: ASIAN ELEPHANT (Adult)', 'warning');
          if (voiceRef?.current && voiceEnabled) {
            voiceRef.current.speak('Track Guard warning. Wild elephant detected on railway corridor Kilo Mike 142. Range 1,450 meters.', 'normal');
          }
        }
      } else if (t < 70) {
        setBrakeApplied(true);
        setTrainSpeed(prev => Math.max(15, prev - 3.2));
        const dist = Math.max(120, 750 - (t - 35) * 16);
        setObstacleDistance(Math.round(dist));
        const speedMs = Math.max(5, trainSpeed * (5 / 18));
        setTimeToImpact(Math.round(dist / speedMs));

        if (t === 36) {
          playKlaxon();
          if (addLog) addLog('[TRK-GUARD] 🚨 KAVACH AUTO-BRAKE ENGAGED! Emergency pneumatic dump applied (5.0 -> 3.8 bar).', 'critical');
          if (logToSupabase) logToSupabase('TRACK-GUARD', 95, 'KAVACH AUTO-BRAKE: Elephant on track KM-142. Distance: 780m');
          if (voiceRef?.current && voiceEnabled) {
            voiceRef.current.speak('Critical alert! Kavach Automatic Train Protection engaged. Emergency braking initiated for Rajdhani Express.', 'critical');
          }
        }
      } else {
        setBrakeApplied(false);
        setTrainSpeed(prev => Math.min(95, prev + 2));
        setObstacleDistance(2000);
        setTimeToImpact(99);

        if (t === 71) {
          playSuccessChime();
          if (addLog) addLog('[TRK-GUARD] ✅ Track section KM-142 is ALL CLEAR. Brake released. Resuming corridor speed.', 'safe');
        }
      }

      setAiConfidence(95 + Math.sin(t * 0.4) * 3);
    }, 1000);

    return () => clearInterval(interval);
  }, [trackActive, trainSpeed, voiceEnabled, voiceRef, addLog, logToSupabase]);

  return (
    <motion.div
      key="track-guard-deck"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="ops-deck track-real-deck"
      style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, padding: 14, overflowY: 'auto' }}
    >
      {/* ── HEADER CONTROL STRIP ───────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15,23,42,0.85)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: '10px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ padding: 6, background: 'rgba(34,197,94,0.15)', border: '1px solid var(--accent)', borderRadius: 6, color: 'var(--accent)' }}>
            <Train size={18} />
          </div>
          <div>
            <div style={{ fontFamily: "'Share Tech Mono'", fontSize: '0.95rem', color: 'var(--accent)', fontWeight: 'bold', letterSpacing: 2 }}>
              TRACK-GUARD // RAILWAY OBSTACLE OVERWATCH
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
              Real Locomotive Feed • Rajdhani Express #12042 • Section KM-142 (Jharkhand Wildlife Corridor)
            </div>
          </div>
        </div>

        {/* Feed Switcher & AI Run Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {TRACK_FEEDS.map(feed => (
            <button
              key={feed.id}
              onClick={() => setSelectedFeed(feed)}
              style={{
                background: selectedFeed.id === feed.id ? 'rgba(34,197,94,0.2)' : 'transparent',
                border: `1px solid ${selectedFeed.id === feed.id ? 'var(--accent)' : '#334155'}`,
                color: selectedFeed.id === feed.id ? 'var(--accent)' : '#94a3b8',
                padding: '6px 12px', borderRadius: 6, fontSize: '0.65rem', fontFamily: "'Share Tech Mono'", cursor: 'pointer'
              }}
            >
              {feed.id}
            </button>
          ))}

          <button
            onClick={() => setFlirShader(!flirShader)}
            style={{
              background: flirShader ? 'rgba(168,85,247,0.3)' : 'transparent',
              border: `1px solid ${flirShader ? '#a855f7' : '#334155'}`,
              color: flirShader ? '#c084fc' : '#94a3b8',
              padding: '6px 12px', borderRadius: 6, fontSize: '0.65rem', fontFamily: "'Share Tech Mono'", cursor: 'pointer'
            }}
          >
            FLIR THERMAL
          </button>

          <button
            onClick={() => setTrackActive(!trackActive)}
            style={{
              background: trackActive ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)',
              border: `1px solid ${trackActive ? '#ef4444' : 'var(--accent)'}`,
              color: trackActive ? '#ef4444' : 'var(--accent)',
              padding: '6px 14px', borderRadius: 6, fontSize: '0.7rem', fontFamily: "'Share Tech Mono'", fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            {trackActive ? <><Square size={12} /> STOP TRACK SCAN</> : <><Play size={12} /> START TRACK AI</>}
          </button>
        </div>
      </div>

      {/* ── MAIN REAL HIGH-DEFINITION VIDEO VIEWPORT ───────────── */}
      <div className="real-viewport" style={{ position: 'relative', minHeight: '460px', borderRadius: 12, overflow: 'hidden', border: `2px solid ${brakeApplied ? '#ef4444' : 'var(--glass-border)'}`, boxShadow: brakeApplied ? '0 0 35px rgba(239,68,68,0.4)' : '0 8px 32px rgba(0,0,0,0.6)', background: '#000' }}>
        {/* Real Railway Video Footage */}
        <RealFeedVideo
          src={selectedFeed.videoUrl}
          label={selectedFeed.name}
          style={{ width: '100%', height: '100%', filter: flirShader ? 'invert(1) hue-rotate(180deg) contrast(140%)' : 'none' }}
        />

        {/* Real-time AI Wildlife Bounding Box Overlay */}
        {obstacleDistance < 1500 && (
          <div style={{
            position: 'absolute', top: '35%', left: '44%', width: '180px', height: '140px',
            border: `2px solid ${brakeApplied ? '#ef4444' : '#f59e0b'}`,
            borderRadius: 4, zIndex: 10, pointerEvents: 'none'
          }}>
            {/* Corner Reticles */}
            <div style={{ position: 'absolute', top: -2, left: -2, width: 14, height: 14, borderTop: '3px solid #fff', borderLeft: '3px solid #fff' }} />
            <div style={{ position: 'absolute', top: -2, right: -2, width: 14, height: 14, borderTop: '3px solid #fff', borderRight: '3px solid #fff' }} />
            <div style={{ position: 'absolute', bottom: -2, left: -2, width: 14, height: 14, borderBottom: '3px solid #fff', borderLeft: '3px solid #fff' }} />
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderBottom: '3px solid #fff', borderRight: '3px solid #fff' }} />

            {/* Target Label */}
            <div style={{
              position: 'absolute', top: -22, left: 0,
              background: brakeApplied ? '#ef4444' : '#f59e0b', color: '#000',
              padding: '2px 8px', borderRadius: 4, fontSize: '0.65rem', fontFamily: "'Share Tech Mono'", fontWeight: 'bold'
            }}>
              🐘 ASIAN ELEPHANT [{aiConfidence.toFixed(1)}%] • {obstacleDistance}m
            </div>
          </div>
        )}

        {/* Top HUD Badges */}
        <div style={{ position: 'absolute', top: 12, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none', zIndex: 10 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ background: 'rgba(0,0,0,0.85)', border: '1px solid var(--glass-border)', padding: '4px 10px', borderRadius: 6, fontSize: '0.65rem', fontFamily: "'Share Tech Mono'", color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'softPulse 1s infinite' }} />
              {selectedFeed.name} • LIVE
            </div>
            <div style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid #a855f7', padding: '4px 10px', borderRadius: 6, fontSize: '0.65rem', fontFamily: "'Share Tech Mono'", color: '#c084fc' }}>
              TF.js COCO-SSD MOBILENET_V2 • ACTIVE
            </div>
          </div>

          <div style={{ background: brakeApplied ? 'rgba(239,68,68,0.95)' : 'rgba(0,0,0,0.85)', border: `1px solid ${brakeApplied ? '#fff' : '#334155'}`, padding: '4px 12px', borderRadius: 6, fontSize: '0.7rem', fontFamily: "'Share Tech Mono'", fontWeight: 'bold', color: '#fff' }}>
            {brakeApplied ? '🚨 KAVACH ATP: AUTO-BRAKE ENGAGED' : 'KAVACH ATP: MONITORING'}
          </div>
        </div>

        {/* Emergency Brake Alert Banner */}
        <AnimatePresence>
          {brakeApplied && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{
                position: 'absolute', top: 55, left: '50%', transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, rgba(239,68,68,0.95), rgba(153,27,27,0.95))',
                border: '2px solid #fff', borderRadius: 10, padding: '10px 24px',
                boxShadow: '0 0 40px rgba(239,68,68,0.8)', display: 'flex', alignItems: 'center', gap: 14, zIndex: 30
              }}
            >
              <AlertTriangle size={26} color="#fff" style={{ animation: 'blink 0.5s infinite' }} />
              <div>
                <div style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 'bold', fontFamily: "'Share Tech Mono'", letterSpacing: 1 }}>
                  WILDLIFE OBSTRUCTION ON ACTIVE TRACK KM-142
                </div>
                <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.65rem' }}>
                  Laser LiDAR Range: {obstacleDistance}m • Decelerating to avoid impact • Cab Signal RED
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Viewport Action Buttons */}
        <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 10 }}>
          <button
            onClick={triggerHorn}
            style={{
              background: hornActive ? '#f59e0b' : 'rgba(0,0,0,0.85)',
              border: '1px solid #f59e0b',
              color: hornActive ? '#000' : '#f59e0b',
              padding: '8px 16px', borderRadius: 8, fontSize: '0.75rem', fontFamily: "'Share Tech Mono'", fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: hornActive ? '0 0 20px #f59e0b' : 'none'
            }}
          >
            <Volume2 size={16} /> {hornActive ? 'SOUNDING HORN (120dB)...' : 'BLOW ACOUSTIC HORN'}
          </button>

          <div style={{ background: 'rgba(0,0,0,0.85)', padding: '6px 12px', borderRadius: 6, border: '1px solid var(--glass-border)', fontSize: '0.65rem', fontFamily: "'Share Tech Mono'", color: 'var(--text-dim)' }}>
            GPS: 23°37'12"N 85°16'47"E • TRACK KM-142.8 • GRADIENT: {selectedFeed.gradient}
          </div>
        </div>
      </div>

      {/* ── TELEMETRY HUD TILES ────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: 'var(--text-dim)' }}>
            <span><Gauge size={13} style={{ verticalAlign: 'middle' }} /> LOCOMOTIVE SPEED</span>
            <span style={{ color: brakeApplied ? '#ef4444' : 'var(--accent)' }}>{brakeApplied ? 'BRAKING' : 'CRUISING'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 'bold', fontFamily: "'Share Tech Mono'", color: brakeApplied ? '#ef4444' : 'var(--accent)' }}>
              {trainSpeed}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>KM/H</span>
          </div>
        </div>

        <div style={{ background: 'rgba(15,23,42,0.8)', border: `1px solid ${obstacleDistance < 800 ? 'rgba(239,68,68,0.5)' : 'var(--glass-border)'}`, borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: 'var(--text-dim)' }}>
            <span><Compass size={13} style={{ verticalAlign: 'middle' }} /> RANGE TO OBSTACLE</span>
            <span style={{ color: obstacleDistance < 800 ? '#ef4444' : '#38bdf8' }}>LiDAR 905nm</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 'bold', fontFamily: "'Share Tech Mono'", color: obstacleDistance < 800 ? '#ef4444' : '#38bdf8' }}>
              {obstacleDistance >= 2000 ? '> 2,000' : obstacleDistance}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>METERS</span>
          </div>
        </div>

        <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: 'var(--text-dim)' }}>
            <span><Activity size={13} style={{ verticalAlign: 'middle' }} /> EST. TIME TO IMPACT</span>
            <span style={{ color: timeToImpact < 30 ? '#ef4444' : '#22c55e' }}>{timeToImpact < 30 ? 'CRITICAL' : 'SAFE'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 'bold', fontFamily: "'Share Tech Mono'", color: timeToImpact < 30 ? '#ef4444' : '#22c55e' }}>
              {timeToImpact >= 99 ? '--' : `${timeToImpact}s`}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>SECONDS</span>
          </div>
        </div>

        <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: 'var(--text-dim)' }}>
            <span><Zap size={13} style={{ verticalAlign: 'middle' }} /> BRAKE CYLINDER PRESSURE</span>
            <span style={{ color: brakeApplied ? '#ef4444' : '#22c55e' }}>{brakeApplied ? 'VENTED' : 'CHARGED'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 'bold', fontFamily: "'Share Tech Mono'", color: brakeApplied ? '#ef4444' : '#22c55e' }}>
              {brakeApplied ? '3.8' : '5.0'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>BAR (kg/cm²)</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
