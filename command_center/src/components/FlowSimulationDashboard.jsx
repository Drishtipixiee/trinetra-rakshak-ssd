import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Train, Map as MapIcon, Terminal, Play, CheckCircle2, ChevronRight, Activity, Shield, Zap } from 'lucide-react';

const FLOWS = [
  {
    id: 'perimeter',
    title: 'PERIMETER DEFENSE RESPONSE',
    icon: Shield,
    color: 'var(--accent)',
    description: 'Autonomous border sentry AI target isolation & QRF mobilization.',
    steps: [
      { text: 'Switch to BORDER SENTRY Live Feed.', action: (p) => p.setActiveTab('LIVE'), duration: 1500 },
      { text: 'Initialize TF.js COCO-SSD neural detection engine.', action: (p) => p.setSimActive(true), duration: 2000 },
      { text: 'Real-time AI locks target bounding boxes & velocity.', action: null, duration: 3500 },
      { text: 'Push intrusion telemetry to SQLite DB & Supabase.', action: null, duration: 2500 },
      { text: 'Dispatch alert to National Defense Command Overview.', action: (p) => p.setActiveTab('DASHBOARD'), duration: 2000 }
    ]
  },
  {
    id: 'track',
    title: 'KAVACH RAILWAY OVERWATCH',
    icon: Train,
    color: 'var(--safe)',
    description: 'Autonomous Asian elephant detection & locomotive emergency braking.',
    steps: [
      { text: 'Engage TRACK-GUARD locomotive telemetry deck.', action: (p) => p.setActiveTab('TRACK-GUARD'), duration: 1500 },
      { text: 'Initialize LiDAR & Optical Mast surveillance on KM-142.', action: (p) => p.setTrackActive(true), duration: 2000 },
      { text: 'AI Vision isolates Elephant crossing on active track.', action: null, duration: 4000 },
      { text: 'Compute Laser LiDAR Distance & Deceleration Profile.', action: null, duration: 3000 },
      { text: 'Transmit Kavach ATP Emergency Brake signal (5.0 -> 3.8 bar).', action: null, duration: 3000 }
    ]
  },
  {
    id: 'geoeye',
    title: 'SENTINEL-2 MINING SURVEILLANCE',
    icon: MapIcon,
    color: '#f59e0b',
    description: 'Multispectral satellite terrain subtraction & illegal mining detection.',
    steps: [
      { text: 'Switch to GEO-EYE Satellite GIS portal.', action: (p) => p.setActiveTab('GEO-EYE'), duration: 1500 },
      { text: 'Query Sentinel-2 WMS cloudless multispectral passes.', action: (p) => p.triggerGeoScan && p.triggerGeoScan(), duration: 2500 },
      { text: 'Apply NDVI Vegetation Subtraction Index across Jharkhand.', action: null, duration: 3000 },
      { text: 'Plot documented illegal mining excavation polygons.', action: null, duration: 3000 },
      { text: 'Generate environmental degradation compliance report.', action: null, duration: 2500 }
    ]
  },
  {
    id: 'backend',
    title: 'LIVE INCIDENT DISPATCH',
    icon: Terminal,
    color: '#a855f7',
    description: 'Backend Python Flask & SQLite incident injection pipeline.',
    steps: [
      { text: 'Open LIVE OPS & INCIDENT DISPATCH center.', action: (p) => p.setActiveTab('SIMULATION'), duration: 1500 },
      { text: 'Prepare UAV DRONE Airspace Incursion payload.', action: null, duration: 2000 },
      { text: 'Transmit payload to Python Flask /api/log_incident API.', action: (p) => p.triggerBackendSim('DRONE'), duration: 2500 },
      { text: 'Insert incident records into local SQLite database.', action: null, duration: 3000 },
      { text: 'Synchronize React Frontend with live event stream.', action: null, duration: 3000 }
    ]
  }
];

export default function FlowSimulationDashboard({
  setActiveTab,
  setSimActive,
  setTrackActive,
  triggerGeoScan,
  triggerBackendSim,
  addLog
}) {
  const [activeFlowId, setActiveFlowId] = useState(FLOWS[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const playRef = useRef(null);

  const activeFlow = FLOWS.find(f => f.id === activeFlowId);

  // Auto-play logic
  useEffect(() => {
    if (!isPlaying) {
      if (playRef.current) clearTimeout(playRef.current);
      return;
    }

    const steps = activeFlow.steps;

    if (currentStepIndex < steps.length) {
      const step = steps[currentStepIndex === -1 ? 0 : currentStepIndex];

      if (step.action && currentStepIndex !== -1) {
        step.action({ setActiveTab, setSimActive, setTrackActive, triggerGeoScan, triggerBackendSim });
      }

      playRef.current = setTimeout(() => {
        if (currentStepIndex + 1 < steps.length) {
          setCurrentStepIndex(prev => prev + 1);
        } else {
          setIsPlaying(false);
          addLog(`[SYSTEM] Defense runner "${activeFlow.title}" successfully completed.`, 'safe');
          setTimeout(() => setCurrentStepIndex(-1), 3000);
        }
      }, currentStepIndex === -1 ? 500 : step.duration);
    }

    return () => {
      if (playRef.current) clearTimeout(playRef.current);
    };
  }, [isPlaying, currentStepIndex, activeFlow, setActiveTab, setSimActive, setTrackActive, triggerGeoScan, triggerBackendSim, addLog]);

  const handleStartFlow = () => {
    if (isPlaying) return;
    addLog(`[SYSTEM] Executing operational sequence: ${activeFlow.title}`, 'normal');
    setIsPlaying(true);
    setCurrentStepIndex(0);
  };

  const handleStopFlow = () => {
    setIsPlaying(false);
    setCurrentStepIndex(-1);
    if (playRef.current) clearTimeout(playRef.current);
  };

  const getRGB = (colorStr) => {
    if (colorStr.includes('#')) {
      const hex = colorStr.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `${r}, ${g}, ${b}`;
    }
    return '34, 197, 94';
  };

  return (
    <div style={{
      background: 'rgba(0,0,0,0.4)',
      border: '1px solid var(--glass-border)',
      borderRadius: 12,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      marginTop: 8
    }}>
      {/* Header Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)' }}>
        {FLOWS.map((flow) => {
          const Icon = flow.icon;
          const isActive = activeFlowId === flow.id;
          return (
            <div
              key={flow.id}
              onClick={() => {
                if (!isPlaying) {
                  setActiveFlowId(flow.id);
                  setCurrentStepIndex(-1);
                }
              }}
              style={{
                flex: 1,
                padding: '12px 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                cursor: isPlaying ? 'not-allowed' : 'pointer',
                background: isActive ? `rgba(${getRGB(flow.color)}, 0.1)` : 'transparent',
                borderBottom: isActive ? `2px solid ${flow.color}` : '2px solid transparent',
                transition: 'all 0.3s ease'
              }}
            >
              <Icon size={16} color={isActive ? flow.color : 'var(--text-dim)'} />
              <span style={{
                fontSize: '0.65rem',
                fontFamily: "'Share Tech Mono'",
                color: isActive ? '#fff' : 'var(--text-dim)',
                letterSpacing: 1,
                fontWeight: isActive ? 'bold' : 'normal'
              }}>
                {flow.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Flow Content */}
      <div style={{ padding: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 'bold', marginBottom: 4, fontFamily: "'Share Tech Mono'" }}>
            {activeFlow.title}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginBottom: 12 }}>
            {activeFlow.description}
          </div>

          {/* Stepper Display */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {activeFlow.steps.map((step, idx) => {
              const isCurrent = currentStepIndex === idx;
              const isDone = currentStepIndex > idx;
              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: 6,
                    background: isCurrent ? 'rgba(34,197,94,0.15)' : isDone ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isCurrent ? 'var(--accent)' : isDone ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.05)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.55rem', color: isCurrent ? 'var(--accent)' : 'var(--text-dim)' }}>
                    <span>STEP {idx + 1}</span>
                    {isDone && <CheckCircle2 size={10} color="var(--accent)" />}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: isCurrent ? '#fff' : isDone ? 'var(--text-dim)' : 'rgba(255,255,255,0.4)', lineHeight: 1.3 }}>
                    {step.text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Execution Trigger Button */}
        <div>
          {isPlaying ? (
            <button
              onClick={handleStopFlow}
              style={{
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid #ef4444',
                color: '#ef4444',
                padding: '12px 20px',
                borderRadius: 8,
                fontSize: '0.75rem',
                fontFamily: "'Share Tech Mono'",
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap'
              }}
            >
              <Square size={14} /> ABORT SEQUENCE
            </button>
          ) : (
            <button
              onClick={handleStartFlow}
              style={{
                background: 'rgba(34,197,94,0.15)',
                border: '1px solid var(--accent)',
                color: 'var(--accent)',
                padding: '12px 20px',
                borderRadius: 8,
                fontSize: '0.75rem',
                fontFamily: "'Share Tech Mono'",
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap'
              }}
            >
              <Play size={14} /> EXECUTE RUNNER
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
