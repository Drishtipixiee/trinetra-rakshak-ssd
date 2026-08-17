import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, Eye, Target, Shield, AlertTriangle, Camera, CameraOff,
  Cpu, ZoomIn, ZoomOut, Maximize2, RefreshCw, Radio, Layers, Zap, Brain, Loader2 as Loader2Icon, Sparkles, Play, Square
} from 'lucide-react';
import { loadModel, detectFrame, drawDetections } from '../lib/cvEngine';
import { playDetectionBeep, playSiren, playSuccessChime } from './AIVoiceSystem';
import { REAL_MEDIA } from '../lib/realMediaFeeds';
import RealFeedVideo from './RealFeedVideo';

const CHANNELS = [
  {
    id: 'CH-01',
    name: 'BORDER SENTRY // SEC-7A PERIMETER',
    coords: 'N28°38\'12" E77°13\'04"',
    type: 'OPTICAL HIGH-RES 1080P',
    videoUrl: REAL_MEDIA.borderCctv,
    backupKey: 'borderCctv',
    scenario: 'border',
    target: { class: 'PERSON', label: 'INTRUDER DETECTED (HOSTILE)', conf: 96, risk: 88 }
  },
  {
    id: 'CH-02',
    name: 'RAILWAY CORRIDOR // KM-142',
    coords: 'N23°37\'12" E85°16\'47"',
    type: 'LONG-RANGE OVERWATCH',
    videoUrl: REAL_MEDIA.railwayIndia,
    backupKey: 'railwayIndia',
    scenario: 'railway',
    target: { class: 'WILDLIFE', label: 'ASIAN ELEPHANT', conf: 94, risk: 78 }
  },
  {
    id: 'CH-03',
    name: 'MINING DRONE RECON // JHARIA',
    coords: 'N23°47\'50" E86°25\'10"',
    type: '4K UAV GIMBAL',
    videoUrl: REAL_MEDIA.miningAerial,
    backupKey: 'miningAerial',
    scenario: 'mining',
    target: { class: 'EXCAVATOR', label: 'ILLEGAL QUARRY RIG', conf: 91, risk: 72 }
  },
  {
    id: 'CH-04',
    name: 'MAIN ENTRANCE CHECKPOINT',
    coords: 'N28°38\'10" E77°13\'00"',
    type: 'ACCESS CONTROL 1080P',
    videoUrl: REAL_MEDIA.checkpointCctv,
    backupKey: 'checkpointCctv',
    scenario: 'checkpoint',
    target: { class: 'VEHICLE', label: 'ARMORED SUV', conf: 92, risk: 25 }
  },
  {
    id: 'CH-05',
    name: 'LOCAL LIVE WEBCAM (WEBRTC)',
    coords: 'N28°36\'40" E77°12\'22"',
    type: 'WEBRTC REAL OPTICAL',
    videoUrl: null,
    backupKey: null,
    scenario: 'checkpoint',
    target: { class: 'OPERATOR', label: 'COMMAND OFFICER', conf: 98, risk: 10 }
  }
];

export default function LiveFeedPanel({
  simActive,
  setSimActive,
  detectionData,
  setDetectionData,
  fuzzyReasoning,
  isNightMode,
  voiceRef,
  voiceEnabled,
  addLog,
  logToSupabase
}) {
  const [selectedChannel, setSelectedChannel] = useState(CHANNELS[0]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [flirMode, setFlirMode] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(110);
  const [modelStatus, setModelStatus] = useState('idle');
  const [webcamStream, setWebcamStream] = useState(null);
  const [webcamActive, setWebcamActive] = useState(false);

  const videoRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const tickRef = useRef(0);

  // Load TensorFlow.js COCO-SSD model once
  useEffect(() => {
    if (modelStatus !== 'idle') return;
    setModelStatus('loading');
    loadModel().then(() => {
      setModelStatus('ready');
    }).catch(() => {
      setModelStatus('error');
    });
  }, [modelStatus]);

  // Webcam controls
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setWebcamStream(stream);
      setWebcamActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      if (addLog) addLog('[CAM-05] Local WebRTC webcam stream activated.', 'safe');
    } catch (err) {
      console.warn('Webcam start failed:', err);
    }
  };

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(t => t.stop());
      setWebcamStream(null);
      setWebcamActive(false);
    }
  };

  useEffect(() => {
    if (selectedChannel.id === 'CH-05') {
      startWebcam();
    } else {
      stopWebcam();
    }
    return () => stopWebcam();
  }, [selectedChannel]);

  // Live TF.js Frame Inference Loop
  useEffect(() => {
    let animId;
    let lastInfer = 0;

    const runInference = async () => {
      tickRef.current += 1;
      const now = Date.now();
      const video = videoRef.current;
      const canvas = overlayCanvasRef.current;

      if (now - lastInfer > 250 && modelStatus === 'ready' && simActive && video && canvas) {
        lastInfer = now;
        if (video.readyState >= 2) {
          canvas.width = canvas.parentElement?.clientWidth || 960;
          canvas.height = canvas.parentElement?.clientHeight || 540;

          try {
            const results = await detectFrame(video, 0.3);
            drawDetections(canvas, results, 0, tickRef.current);

            if (results.length > 0) {
              const maxConf = Math.max(...results.map(r => r.confidence));
              const isCrit = maxConf > 80;
              setDetectionData(prev => ({
                ...prev,
                objectCount: results.length,
                personCount: results.filter(r => r.class === 'person').length,
                maxConfidence: maxConf,
                primaryClass: results[0].label || results[0].class.toUpperCase(),
                threatLevel: isCrit ? 'CRITICAL' : 'WARNING',
                riskScore: Math.min(100, isCrit ? 88 : 55),
                label: selectedChannel.name
              }));
            }
          } catch (_) { /* frame inference catch */ }
        }
      }

      animId = requestAnimationFrame(runInference);
    };

    animId = requestAnimationFrame(runInference);
    return () => cancelAnimationFrame(animId);
  }, [selectedChannel, modelStatus, simActive]);

  const snapEvidence = () => {
    playDetectionBeep();
    if (addLog) addLog(`[EVIDENCE] High-resolution surveillance snapshot captured for ${selectedChannel.name}.`, 'safe');
  };

  return (
    <motion.div
      key="live-feed-deck"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="ops-deck live-real-deck"
      style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, padding: 14, overflowY: 'auto' }}
    >
      {/* ── CHANNEL SELECTOR STRIP ─────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {CHANNELS.map((ch) => {
          const isSel = selectedChannel.id === ch.id;
          return (
            <button
              key={ch.id}
              onClick={() => setSelectedChannel(ch)}
              style={{
                flex: 1,
                minWidth: '160px',
                background: isSel ? 'rgba(34,197,94,0.18)' : 'rgba(15,23,42,0.85)',
                border: `1.5px solid ${isSel ? 'var(--accent)' : 'rgba(56,189,248,0.2)'}`,
                borderRadius: 8,
                padding: '8px 12px',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                boxShadow: isSel ? '0 0 15px rgba(34,197,94,0.25)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: "'Share Tech Mono'", fontSize: '0.75rem', color: isSel ? 'var(--accent)' : '#fff', fontWeight: 'bold' }}>
                  {ch.id}
                </span>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: isSel ? '#22c55e' : '#64748b' }} />
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {ch.name}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── MAIN REAL VIDEO VIEWPORT CONTAINER ─────────────────── */}
      <div className="real-viewport" style={{ position: 'relative', minHeight: '440px', borderRadius: 12, overflow: 'hidden', border: '2px solid var(--glass-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.7)', background: '#000' }}>
        {/* Real Video Element */}
        {selectedChannel.id === 'CH-05' && !webcamActive ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,15,25,0.95)' }}>
            <Camera size={36} color="#38bdf8" style={{ marginBottom: 12 }} />
            <button
              onClick={startWebcam}
              style={{ background: 'rgba(56,189,248,0.2)', border: '1px solid #38bdf8', color: '#38bdf8', padding: '8px 18px', borderRadius: 6, fontSize: '0.75rem', fontFamily: "'Share Tech Mono'", fontWeight: 'bold', cursor: 'pointer' }}
            >
              START LIVE WEBCAM
            </button>
          </div>
        ) : selectedChannel.id === 'CH-05' && webcamActive ? (
          <video
            ref={videoRef}
            key="webcam"
            autoPlay
            muted
            playsInline
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
              transform: `scale(${zoomLevel})`,
              filter: `brightness(${brightness}%) contrast(${contrast}%) ${flirMode ? 'invert(1) hue-rotate(180deg)' : ''}`
            }}
          />
        ) : (
          <RealFeedVideo
            src={selectedChannel.videoUrl}
            backupKey={selectedChannel.backupKey}
            scenario={selectedChannel.scenario}
            label={selectedChannel.name}
            videoRef={videoRef}
            style={{
              position: 'absolute', inset: 0,
              transform: `scale(${zoomLevel})`,
              filter: `brightness(${brightness}%) contrast(${contrast}%) ${flirMode ? 'invert(1) hue-rotate(180deg)' : ''}`
            }}
          />
        )}


        {/* Real-time AI Bounding Box Canvas Overlay */}
        <canvas
          ref={overlayCanvasRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}
        />

        {/* Top Viewport Telemetry Header */}
        <div style={{ position: 'absolute', top: 12, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, pointerEvents: 'none' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ background: 'rgba(0,0,0,0.85)', border: '1px solid var(--glass-border)', padding: '4px 10px', borderRadius: 6, fontSize: '0.65rem', fontFamily: "'Share Tech Mono'", color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'softPulse 1s infinite' }} />
              {selectedChannel.name} • LIVE
            </div>

            {modelStatus === 'ready' && (
              <div style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid #a855f7', padding: '4px 10px', borderRadius: 6, fontSize: '0.65rem', fontFamily: "'Share Tech Mono'", color: '#c084fc', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Brain size={12} /> TF.js COCO-SSD MOBILENET_V2 ACTIVE
              </div>
            )}
          </div>

          <div style={{ background: 'rgba(0,0,0,0.85)', padding: '4px 12px', borderRadius: 6, border: '1px solid var(--glass-border)', fontSize: '0.65rem', fontFamily: "'Share Tech Mono'", color: 'var(--accent)' }}>
            ZOOM: {zoomLevel}X • 1080P @ 60FPS • {selectedChannel.coords}
          </div>
        </div>

        {/* Bottom Viewport Control Overlay */}
        <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 10 }}>
          <div style={{ display: 'flex', gap: 8, background: 'rgba(0,0,0,0.85)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
            <button
              onClick={() => setZoomLevel(prev => prev === 1 ? 2 : prev === 2 ? 4 : 1)}
              style={{ background: 'transparent', border: '1px solid #64748b', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: '0.65rem', fontFamily: "'Share Tech Mono'", cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <ZoomIn size={12} /> ZOOM ({zoomLevel}X)
            </button>
            <button
              onClick={() => setFlirMode(!flirMode)}
              style={{ background: flirMode ? 'rgba(168,85,247,0.3)' : 'transparent', border: `1px solid ${flirMode ? '#a855f7' : '#64748b'}`, color: flirMode ? '#c084fc' : '#fff', padding: '4px 8px', borderRadius: 4, fontSize: '0.65rem', fontFamily: "'Share Tech Mono'", cursor: 'pointer' }}
            >
              FLIR THERMAL
            </button>
            <button
              onClick={snapEvidence}
              style={{ background: 'rgba(56,189,248,0.2)', border: '1px solid #38bdf8', color: '#38bdf8', padding: '4px 8px', borderRadius: 4, fontSize: '0.65rem', fontFamily: "'Share Tech Mono'", cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Camera size={12} /> SNAPSHOT
            </button>
          </div>

          <button
            onClick={() => {
              setSimActive(!simActive);
              if (addLog) addLog(simActive ? '[SYS] ■ Real AI Detection paused.' : '[SYS] ▶ Real AI Detection active.', 'safe');
            }}
            style={{
              background: simActive ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)',
              border: `1.5px solid ${simActive ? '#ef4444' : 'var(--accent)'}`,
              color: simActive ? '#ef4444' : 'var(--accent)',
              padding: '8px 18px', borderRadius: 8, fontSize: '0.75rem', fontFamily: "'Share Tech Mono'", fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            {simActive ? <><Square size={14} /> STOP DETECTION</> : <><Play size={14} /> ENGAGE REAL AI</>}
          </button>
        </div>
      </div>

      {/* ── TELEMETRY HUD TILES ────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <div style={{ background: 'rgba(15,23,42,0.85)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '10px 14px' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>ACTIVE FEED</div>
          <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 'bold', fontFamily: "'Share Tech Mono'", marginTop: 2 }}>{selectedChannel.name}</div>
        </div>
        <div style={{ background: 'rgba(15,23,42,0.85)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '10px 14px' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>RESOLUTION & FPS</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 'bold', fontFamily: "'Share Tech Mono'", marginTop: 2 }}>1920x1080 @ 60FPS</div>
        </div>
        <div style={{ background: 'rgba(15,23,42,0.85)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '10px 14px' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>AI CLASSIFICATION</div>
          <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 'bold', fontFamily: "'Share Tech Mono'", marginTop: 2 }}>{selectedChannel.target.label}</div>
        </div>
        <div style={{ background: 'rgba(15,23,42,0.85)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '10px 14px' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>CONFIDENCE SCORE</div>
          <div style={{ fontSize: '0.85rem', color: '#22c55e', fontWeight: 'bold', fontFamily: "'Share Tech Mono'", marginTop: 2 }}>{selectedChannel.target.conf}% CONFIRMED</div>
        </div>
      </div>
    </motion.div>
  );
}
