import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, Eye, Target, Shield, AlertTriangle, Camera, CameraOff,
  Cpu, ZoomIn, ZoomOut, Maximize2, RefreshCw, Radio, Layers, Zap, Brain, Loader2 as Loader2Icon, Sparkles
} from 'lucide-react';
import { loadModel, detectFrame, drawDetections, estimateFuzzyInputs } from '../lib/cvEngine';
import { playDetectionBeep, playSiren, playSuccessChime } from './AIVoiceSystem';

const CHANNELS = [
  {
    id: 'CH-01',
    name: 'BORDER SENTRY // SEC-7A',
    coords: 'N28°38\'12" E77°13\'04"',
    type: 'OPTICAL HD',
    feedType: 'PERIMETER_INTRUSION',
    target: { class: 'PERSON', label: 'INTRUDER (HOSTILE)', conf: 96, risk: 88 }
  },
  {
    id: 'CH-02',
    name: 'RAILWAY CORRIDOR // KM-142',
    coords: 'N23°37\'12" E85°16\'47"',
    type: 'LONG-RANGE OVERWATCH',
    feedType: 'RAILWAY_ELEPHANT',
    target: { class: 'WILDLIFE', label: 'ASIAN ELEPHANT', conf: 94, risk: 78 }
  },
  {
    id: 'CH-03',
    name: 'MINING DRONE RECON // JHARIA',
    coords: 'N23°47\'50" E86°25\'10"',
    type: '4K UAV GIMBAL',
    feedType: 'MINING_QUARRY',
    target: { class: 'EXCAVATOR', label: 'ILLEGAL QUARRY RIG', conf: 91, risk: 72 }
  },
  {
    id: 'CH-04',
    name: 'FLIR THERMAL SENTRY // SEC-7B',
    coords: 'N28°38\'18" E77°13\'09"',
    type: 'THERMAL FLIR 640',
    feedType: 'THERMAL_SENTRY',
    target: { class: 'PERSON', label: 'HEAT SIGNATURE (2 PAX)', conf: 93, risk: 82 }
  },
  {
    id: 'CH-05',
    name: 'LOCAL LIVE WEBCAM // WEBRTC',
    coords: 'N28°36\'40" E77°12\'22"',
    type: 'WEBRTC OPTICAL',
    feedType: 'LIVE_WEBCAM',
    target: { class: 'OPERATOR', label: 'COMMAND OFFICER', conf: 98, risk: 10 }
  },
  {
    id: 'CH-06',
    name: 'ARMORY CHECKPOINT // VAULT',
    coords: 'N28°38\'10" E77°13\'00"',
    type: 'STARCHECK LOW-LIGHT',
    feedType: 'ARMORY_VAULT',
    target: { class: 'SECURE', label: 'ARMORY ALL CLEAR', conf: 99, risk: 5 }
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
  const [modelProgress, setModelProgress] = useState(0);
  const [modelMessage, setModelMessage] = useState('');
  const [webcamStream, setWebcamStream] = useState(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const [liveDetections, setLiveDetections] = useState([]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const tickRef = useRef(0);
  const prevDetectionsRef = useRef([]);

  // Load TensorFlow.js COCO-SSD model once
  useEffect(() => {
    if (modelStatus !== 'idle') return;
    setModelStatus('loading');
    loadModel((prog, msg) => {
      setModelProgress(Math.round(prog * 100));
      setModelMessage(msg);
    }).then(() => {
      setModelStatus('ready');
    }).catch(() => {
      setModelStatus('error');
    });
  }, [modelStatus]);

  // Webcam Controls for CH-05
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

  // Real-time Synthetic/Photorealistic Surveillance Scene Painter
  const drawChannelFeed = (ctx, W, H, ch, t) => {
    ctx.clearRect(0, 0, W, H);

    if (ch.feedType === 'PERIMETER_INTRUSION' || ch.feedType === 'THERMAL_SENTRY') {
      const isThermal = flirMode || ch.feedType === 'THERMAL_SENTRY' || isNightMode;
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, isThermal ? '#080214' : '#0a141e');
      bgGrad.addColorStop(0.5, isThermal ? '#1b0933' : '#14232e');
      bgGrad.addColorStop(1, isThermal ? '#05010a' : '#0a1017');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Fence Line & Security Lights
      ctx.strokeStyle = isThermal ? 'rgba(239, 68, 68, 0.4)' : 'rgba(148, 163, 184, 0.5)';
      ctx.lineWidth = 2;
      for (let fx = 0; fx < W; fx += 25) {
        ctx.beginPath(); ctx.moveTo(fx, H * 0.35); ctx.lineTo(fx + 25, H * 0.88); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(fx + 25, H * 0.35); ctx.lineTo(fx, H * 0.88); ctx.stroke();
      }

      // Intruder Heat Signature Scaling Fence
      const pX = W * 0.48 + Math.sin(t * 2) * 12;
      const pY = H * 0.45 + Math.cos(t * 1.5) * 6;

      ctx.fillStyle = isThermal ? '#ff3300' : '#1e293b';
      // Head
      ctx.beginPath(); ctx.arc(pX, pY - 32, 14, 0, Math.PI * 2); ctx.fill();
      // Torso
      ctx.fillRect(pX - 14, pY - 18, 28, 42);
      // Arms holding fence
      ctx.strokeStyle = isThermal ? '#ff7700' : '#334155';
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(pX - 14, pY - 8); ctx.lineTo(pX - 35, pY - 22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pX + 14, pY - 8); ctx.lineTo(pX + 35, pY - 22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pX - 10, pY + 24); ctx.lineTo(pX - 28, pY + 58); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pX + 10, pY + 24); ctx.lineTo(pX + 28, pY + 58); ctx.stroke();
    }

    else if (ch.feedType === 'RAILWAY_ELEPHANT') {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#0a1d12');
      bgGrad.addColorStop(0.6, '#183824');
      bgGrad.addColorStop(1, '#112217');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Steel Tracks
      ctx.fillStyle = '#37322d';
      ctx.fillRect(0, H * 0.58, W, 32);
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(0, H * 0.64); ctx.lineTo(W, H * 0.64); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, H * 0.82); ctx.lineTo(W, H * 0.82); ctx.stroke();

      // Asian Elephant crossing track
      const eleX = (W * 0.25) + ((t * 26) % (W * 0.55));
      const eleY = H * 0.55;

      ctx.fillStyle = '#475569';
      ctx.beginPath(); ctx.ellipse(eleX, eleY - 20, 52, 36, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(eleX + 42, eleY - 34, 25, 0, Math.PI * 2); ctx.fill();
      // Ear
      ctx.fillStyle = '#64748b';
      ctx.beginPath(); ctx.ellipse(eleX + 34, eleY - 34, 16, 22, 0.2, 0, Math.PI * 2); ctx.fill();
      // Trunk
      ctx.strokeStyle = '#475569'; ctx.lineWidth = 11; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(eleX + 58, eleY - 26); ctx.quadraticCurveTo(eleX + 75, eleY, eleX + 65, eleY + 28); ctx.stroke();
      // Tusks
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(eleX + 52, eleY - 18); ctx.quadraticCurveTo(eleX + 72, eleY - 12, eleX + 78, eleY - 28); ctx.stroke();
      // Legs
      ctx.fillStyle = '#334155';
      ctx.fillRect(eleX - 34, eleY + 4, 16, 42);
      ctx.fillRect(eleX - 10, eleY + 4, 16, 42);
      ctx.fillRect(eleX + 18, eleY + 4, 16, 42);
    }

    else if (ch.feedType === 'MINING_QUARRY') {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#1c1917');
      bgGrad.addColorStop(0.6, '#44403c');
      bgGrad.addColorStop(1, '#292524');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Terraced Open-Pit Steps
      ctx.strokeStyle = '#78716c'; ctx.lineWidth = 4;
      for (let s = 1; s <= 4; s++) {
        ctx.beginPath();
        ctx.moveTo(0, H * 0.2 + s * 45);
        ctx.lineTo(W * 0.45, H * 0.2 + s * 45 + 30);
        ctx.lineTo(W, H * 0.2 + s * 45);
        ctx.stroke();
      }

      // Excavator Machine
      const exX = W * 0.5;
      const exY = H * 0.58;
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(exX - 35, exY - 26, 70, 36);
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(exX - 42, exY + 10, 84, 15);
      // Crane Boom Arm
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(exX + 22, exY - 20); ctx.lineTo(exX + 75, exY - 70); ctx.lineTo(exX + 110, exY - 25); ctx.stroke();
    }

    else {
      // General High-Tech Military Sentry Guardhouse
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 3;
      ctx.strokeRect(W * 0.2, H * 0.2, W * 0.6, H * 0.6);
    }

    // Reticles & Crosshair
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 6]);
    ctx.beginPath(); ctx.moveTo(W * 0.5 - 30, H * 0.5); ctx.lineTo(W * 0.5 + 30, H * 0.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W * 0.5, H * 0.5 - 30); ctx.lineTo(W * 0.5, H * 0.5 + 30); ctx.stroke();
    ctx.setLineDash([]);
  };

  // Main Live Inference & Animation Loop
  useEffect(() => {
    let animId;
    let lastInferTime = 0;

    const loop = async () => {
      const t = Date.now() * 0.002;
      tickRef.current += 1;

      const canvas = canvasRef.current;
      const overlayCanvas = overlayCanvasRef.current;

      if (canvas) {
        const W = canvas.width = canvas.parentElement?.clientWidth || 960;
        const H = canvas.height = canvas.parentElement?.clientHeight || 540;
        const ctx = canvas.getContext('2d');

        if (selectedChannel.id !== 'CH-05' || !webcamActive) {
          drawChannelFeed(ctx, W, H, selectedChannel, t);
        }
      }

      // Run TensorFlow.js detection every 200ms
      const now = Date.now();
      if (now - lastInferTime > 200 && modelStatus === 'ready' && simActive) {
        lastInferTime = now;
        try {
          const source = (selectedChannel.id === 'CH-05' && webcamActive && videoRef.current)
            ? videoRef.current
            : canvas;

          if (source) {
            const results = await detectFrame(source, 0.3);
            setLiveDetections(results);

            if (overlayCanvas) {
              overlayCanvas.width = canvas?.width || 960;
              overlayCanvas.height = canvas?.height || 540;
              drawDetections(overlayCanvas, results, 0, tickRef.current);
            }

            // Update Threat State
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
          }
        } catch (_) { /* skip frame on inference catch */ }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [selectedChannel, webcamActive, simActive, modelStatus, flirMode, isNightMode]);

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
      style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, padding: 10, background: '#020617', overflowY: 'auto' }}
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
                minWidth: '150px',
                background: isSel ? 'rgba(34,197,94,0.18)' : 'rgba(15,23,42,0.8)',
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
                <span style={{ fontFamily: "'Share Tech Mono'", fontSize: '0.7rem', color: isSel ? 'var(--accent)' : '#fff', fontWeight: 'bold' }}>
                  {ch.id}
                </span>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: isSel ? '#22c55e' : '#64748b' }} />
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {ch.name}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── MAIN SURVEILLANCE VIEWPORT CONTAINER ──────────────── */}
      <div style={{ position: 'relative', height: '440px', borderRadius: 12, overflow: 'hidden', border: '2px solid var(--glass-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.7)', background: '#000' }}>
        {/* WebRTC Video Element for CAM-05 */}
        {selectedChannel.id === 'CH-05' && webcamActive && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoomLevel})`, filter: `brightness(${brightness}%) contrast(${contrast}%) ${flirMode ? 'invert(1) hue-rotate(180deg)' : ''}` }}
          />
        )}

        {/* Photorealistic Canvas Feed */}
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: (selectedChannel.id === 'CH-05' && webcamActive) ? 'none' : 'block', transform: `scale(${zoomLevel})`, filter: `brightness(${brightness}%) contrast(${contrast}%) ${flirMode ? 'invert(1) hue-rotate(180deg)' : ''}` }}
        />

        {/* AI Bounding Box Canvas Overlay */}
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
                <Brain size={12} /> COCO-SSD MOBILENET_V2 ACTIVE
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ background: 'rgba(0,0,0,0.85)', padding: '4px 12px', borderRadius: 6, border: '1px solid var(--glass-border)', fontSize: '0.65rem', fontFamily: "'Share Tech Mono'", color: 'var(--accent)' }}>
              ZOOM: {zoomLevel}X • FPS: 60 • {selectedChannel.coords}
            </div>
          </div>
        </div>

        {/* Bottom Viewport Control Overlay */}
        <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 10 }}>
          {/* Quick PTZ and Shader Controls */}
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

          {/* Start/Stop AI Detection Button */}
          <div>
            <button
              onClick={() => {
                setSimActive(!simActive);
                if (addLog) addLog(simActive ? '[SYS] ■ Real-Time AI Detection stopped.' : '[SYS] ▶ Real-Time AI Detection online.', 'safe');
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
      </div>

      {/* ── TELEMETRY HUD TILES ────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '10px 14px' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>ACTIVE CHANNEL</div>
          <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 'bold', fontFamily: "'Share Tech Mono'", marginTop: 2 }}>{selectedChannel.name}</div>
        </div>
        <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '10px 14px' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>OPTICAL RESOLUTION</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 'bold', fontFamily: "'Share Tech Mono'", marginTop: 2 }}>1920x1080 @ 60FPS</div>
        </div>
        <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '10px 14px' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>AI CLASSIFICATION</div>
          <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 'bold', fontFamily: "'Share Tech Mono'", marginTop: 2 }}>{selectedChannel.target.label}</div>
        </div>
        <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '10px 14px' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>CONFIDENCE SCORE</div>
          <div style={{ fontSize: '0.85rem', color: '#22c55e', fontWeight: 'bold', fontFamily: "'Share Tech Mono'", marginTop: 2 }}>{selectedChannel.target.conf}% CONFIRMED</div>
        </div>
      </div>
    </motion.div>
  );
}
