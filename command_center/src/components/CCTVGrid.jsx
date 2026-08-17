import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, Maximize2, X, AlertTriangle, Shield, Camera, CameraOff,
  Download, Eye, ZoomIn, ZoomOut, Radio, RefreshCw, Play, Square, Layers, Sparkles
} from 'lucide-react';
import { playDetectionBeep, playKlaxon, playSuccessChime } from './AIVoiceSystem';

const CAMERAS = [
  {
    id: 'CAM-01',
    name: 'MAIN GATE // SEC-7A',
    coords: 'N28°38\'12" E77°13\'04"',
    type: 'OPTICAL HIGH-RES',
    fps: 30,
    feedType: 'GATE_SECURITY',
    target: { class: 'VEHICLE', conf: 92, risk: 65, label: 'ARMORED SUV' }
  },
  {
    id: 'CAM-02',
    name: 'PERIMETER FENCE // NORTH',
    coords: 'N28°38\'18" E77°13\'09"',
    type: 'THERMAL FLIR',
    fps: 25,
    feedType: 'PERIMETER_INTRUSION',
    target: { class: 'PERSON', conf: 96, risk: 88, label: 'INTRUDER (ARMED)' }
  },
  {
    id: 'CAM-03',
    name: 'RAILWAY KM-142 CORRIDOR',
    coords: 'N23°37\'12" E85°16\'47"',
    type: 'OVERWATCH LONG-RANGE',
    fps: 30,
    feedType: 'RAILWAY_ELEPHANT',
    target: { class: 'WILDLIFE', conf: 94, risk: 78, label: 'ASIAN ELEPHANT' }
  },
  {
    id: 'CAM-04',
    name: 'MINING DRONE RECON',
    coords: 'N23°47\'50" E86°25\'10"',
    type: 'UAV 4K GIMBAL',
    fps: 60,
    feedType: 'MINING_QUARRY',
    target: { class: 'EXCAVATOR', conf: 91, risk: 72, label: 'ILLEGAL QUARRY RIG' }
  },
  {
    id: 'CAM-05',
    name: 'LOCAL LIVE WEBCAM',
    coords: 'N28°36\'40" E77°12\'22"',
    type: 'WEBRTC OPTICAL',
    fps: 30,
    feedType: 'LIVE_WEBCAM',
    target: { class: 'OPERATOR', conf: 98, risk: 15, label: 'AUTHORIZED USER' }
  },
  {
    id: 'CAM-06',
    name: 'COMMAND BUNKER // SEC-2',
    coords: 'N28°38\'10" E77°13\'00"',
    type: 'LOW-LIGHT STARCHECK',
    fps: 24,
    feedType: 'ARMORY_VAULT',
    target: { class: 'SECURE', conf: 99, risk: 10, label: 'ALL CLEAR' }
  }
];

export default function CCTVGrid({
  active,
  voiceRef,
  voiceEnabled,
  setDetectionData,
  setSmsText,
  setSmsVisible,
  playDetectionBeep
}) {
  const [expandedCam, setExpandedCam] = useState(null);
  const [nightVision, setNightVision] = useState(false);
  const [thermalFilter, setThermalFilter] = useState(false);
  const [webcamStream, setWebcamStream] = useState(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const [capturedSnaps, setCapturedSnaps] = useState([]);
  const [alertCamId, setAlertCamId] = useState('CAM-02');

  const canvasRefs = useRef([]);
  const modalCanvasRef = useRef(null);
  const webcamVideoRef = useRef(null);
  const animRef = useRef(null);

  // Initialize WebRTC Webcam on CAM-05
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setWebcamStream(stream);
      setWebcamActive(true);
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Webcam permission denied:', err);
    }
  };

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(t => t.stop());
      setWebcamStream(null);
      setWebcamActive(false);
    }
  };

  // High-Resolution Synthetic/Realistic Surveillance Scene Renderer
  const drawScene = (ctx, W, H, cam, t) => {
    ctx.clearRect(0, 0, W, H);

    // ── 1. BACKGROUND SCENERY DEPENDING ON FEED TYPE ────────────────
    if (cam.feedType === 'GATE_SECURITY') {
      // Concrete road, security gate barrier, brick guardhouse, streetlamps
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Road pavement
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(W * 0.2, H * 0.45);
      ctx.lineTo(W * 0.8, H * 0.45);
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fill();

      // Road markings (yellow dashed)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      ctx.moveTo(W * 0.5, H * 0.45);
      ctx.lineTo(W * 0.5, H);
      ctx.stroke();
      ctx.setLineDash([]);

      // Security Boom Barrier (yellow/black stripes)
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(W * 0.25, H * 0.55, W * 0.5, 6);

      // Approaching Vehicle
      const vProgress = (Math.sin(t * 1.5) + 1) * 0.5;
      const vX = W * 0.45 + Math.sin(t * 1.2) * 20;
      const vY = H * 0.5 + vProgress * 40;
      const vW = 80 + vProgress * 40;
      const vH = 45 + vProgress * 25;

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(vX - vW * 0.5, vY, vW, vH);
      // Windshield
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(vX - vW * 0.35, vY + 6, vW * 0.7, vH * 0.35);
      // Headlights glow
      ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
      ctx.beginPath();
      ctx.moveTo(vX - vW * 0.4, vY + vH * 0.7);
      ctx.lineTo(vX - vW * 0.9, H);
      ctx.lineTo(vX - vW * 0.1, H);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(vX + vW * 0.4, vY + vH * 0.7);
      ctx.lineTo(vX + vW * 0.1, H);
      ctx.lineTo(vX + vW * 0.9, H);
      ctx.fill();

      // Bounding Box
      drawBBox(ctx, vX - vW * 0.55, vY - 4, vW * 1.1, vH * 1.2, 'ARMORED SUV', 92, '#f59e0b');
    }

    else if (cam.feedType === 'PERIMETER_INTRUSION') {
      // Night thermal fence line with human intruder scaling fence
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#090514');
      bgGrad.addColorStop(0.5, '#190a2e');
      bgGrad.addColorStop(1, '#05020a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Chainlink Mesh Fence Line
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 1.5;
      for (let fx = 0; fx < W; fx += 18) {
        ctx.beginPath(); ctx.moveTo(fx, H * 0.3); ctx.lineTo(fx + 18, H * 0.85); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(fx + 18, H * 0.3); ctx.lineTo(fx, H * 0.85); ctx.stroke();
      }
      // Top Barbed Wire Coils
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      for (let bx = 0; bx < W; bx += 24) {
        ctx.beginPath();
        ctx.arc(bx + 12, H * 0.3, 12, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Human Intruder Thermal Silhouette (scaling fence)
      const pX = W * 0.48 + Math.sin(t * 2) * 8;
      const pY = H * 0.42 + Math.cos(t * 1.5) * 4;

      ctx.fillStyle = '#ff2200';
      // Head
      ctx.beginPath(); ctx.arc(pX, pY - 24, 9, 0, Math.PI * 2); ctx.fill();
      // Torso
      ctx.fillRect(pX - 9, pY - 14, 18, 28);
      // Limbs holding fence
      ctx.strokeStyle = '#ff5500';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(pX - 9, pY - 8); ctx.lineTo(pX - 22, pY - 16); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pX + 9, pY - 8); ctx.lineTo(pX + 22, pY - 16); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pX - 6, pY + 14); ctx.lineTo(pX - 18, pY + 36); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pX + 6, pY + 14); ctx.lineTo(pX + 16, pY + 36); ctx.stroke();

      drawBBox(ctx, pX - 30, pY - 38, 60, 85, 'INTRUDER (HOSTILE)', 96, '#ef4444');
    }

    else if (cam.feedType === 'RAILWAY_ELEPHANT') {
      // Jungle railway line with Asian Elephant crossing
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#0c1c14');
      bgGrad.addColorStop(0.5, '#1e382b');
      bgGrad.addColorStop(1, '#13221b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Steel Tracks
      ctx.fillStyle = '#3e3833';
      ctx.fillRect(0, H * 0.58, W, 22);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, H * 0.62); ctx.lineTo(W, H * 0.62); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, H * 0.74); ctx.lineTo(W, H * 0.74); ctx.stroke();

      // Elephant crossing
      const eleX = (W * 0.2) + ((t * 22) % (W * 0.65));
      const eleY = H * 0.56;

      ctx.fillStyle = '#4b5563'; // Grey skin
      ctx.beginPath(); ctx.ellipse(eleX, eleY - 15, 34, 24, 0, 0, Math.PI * 2); ctx.fill(); // Body
      ctx.beginPath(); ctx.arc(eleX + 28, eleY - 24, 16, 0, Math.PI * 2); ctx.fill(); // Head
      // Ear
      ctx.fillStyle = '#64748b';
      ctx.beginPath(); ctx.ellipse(eleX + 22, eleY - 24, 10, 14, 0.2, 0, Math.PI * 2); ctx.fill();
      // Trunk
      ctx.strokeStyle = '#4b5563'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(eleX + 38, eleY - 18); ctx.quadraticCurveTo(eleX + 48, eleY, eleX + 42, eleY + 18); ctx.stroke();
      // Tusks
      ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(eleX + 34, eleY - 12); ctx.quadraticCurveTo(eleX + 46, eleY - 8, eleX + 50, eleY - 18); ctx.stroke();
      // Legs
      ctx.fillStyle = '#374151';
      ctx.fillRect(eleX - 22, eleY, 11, 26);
      ctx.fillRect(eleX - 6, eleY, 11, 26);
      ctx.fillRect(eleX + 12, eleY, 11, 26);

      drawBBox(ctx, eleX - 38, eleY - 44, 96, 75, 'ASIAN ELEPHANT (WILDLIFE)', 94, '#22c55e');
    }

    else if (cam.feedType === 'MINING_QUARRY') {
      // Terraced Open-Pit Quarry with Excavator and Truck
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#1c1917');
      bgGrad.addColorStop(0.6, '#44403c');
      bgGrad.addColorStop(1, '#292524');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Terraces
      ctx.strokeStyle = '#78716c';
      ctx.lineWidth = 3;
      for (let tier = 1; tier <= 4; tier++) {
        ctx.beginPath();
        ctx.moveTo(0, H * 0.2 + tier * 35);
        ctx.lineTo(W * 0.4, H * 0.2 + tier * 35 + 20);
        ctx.lineTo(W, H * 0.2 + tier * 35);
        ctx.stroke();
      }

      // Excavator Rig
      const exX = W * 0.48;
      const exY = H * 0.58;
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(exX - 25, exY - 18, 50, 24);
      // Tread Tracks
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(exX - 30, exY + 6, 60, 10);
      // Crane Boom
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(exX + 15, exY - 14); ctx.lineTo(exX + 55, exY - 48); ctx.lineTo(exX + 80, exY - 15); ctx.stroke();

      drawBBox(ctx, exX - 36, exY - 56, 125, 78, 'ILLEGAL EXCAVATOR RIG', 91, '#ef4444');
    }

    else if (cam.feedType === 'ARMORY_VAULT') {
      // Steel Bunker Interior with Gun Racks and Biometric Scanner
      ctx.fillStyle = '#0b1118';
      ctx.fillRect(0, 0, W, H);

      // Vault Steel Door
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.strokeRect(W * 0.25, H * 0.18, W * 0.5, H * 0.7);

      // Vault Lock Wheel
      const spin = t * 0.8;
      const vx = W * 0.5, vy = H * 0.52;
      ctx.beginPath(); ctx.arc(vx, vy, 28, 0, Math.PI * 2); ctx.stroke();
      for (let s = 0; s < 4; s++) {
        const ang = spin + s * (Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(vx, vy);
        ctx.lineTo(vx + Math.cos(ang) * 28, vy + Math.sin(ang) * 28);
        ctx.stroke();
      }

      // Biometric Scanner Green LED
      ctx.fillStyle = '#22c55e';
      ctx.beginPath(); ctx.arc(W * 0.72, H * 0.48, 6, 0, Math.PI * 2); ctx.fill();

      drawBBox(ctx, W * 0.22, H * 0.15, W * 0.56, H * 0.75, 'VAULT PERIMETER -- LOCKED', 99, '#22c55e');
    }

    // ── 2. GLOBAL SURVEILLANCE HUD ON EVERY TILE ──────────────────
    // Crosshair Center Reticle
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(W * 0.5 - 20, H * 0.5); ctx.lineTo(W * 0.5 + 20, H * 0.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W * 0.5, H * 0.5 - 20); ctx.lineTo(W * 0.5, H * 0.5 + 20); ctx.stroke();
    ctx.setLineDash([]);

    // Scanline bar
    const scanY = (t * 50) % H;
    ctx.fillStyle = 'rgba(34, 197, 94, 0.06)';
    ctx.fillRect(0, scanY, W, 3);
  };

  // Helper function to draw crisp military bounding boxes
  const drawBBox = (ctx, x, y, w, h, label, conf, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Corner brackets
    const cl = Math.min(w, h) * 0.22;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, y + cl); ctx.lineTo(x, y); ctx.lineTo(x + cl, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w - cl, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + cl); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + h - cl); ctx.lineTo(x, y + h); ctx.lineTo(x + cl, y + h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w - cl, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cl); ctx.stroke();

    // Header tag
    ctx.fillStyle = color;
    ctx.fillRect(x, y - 18, ctx.measureText(label).width + 24, 16);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 10px "Share Tech Mono", monospace';
    ctx.fillText(`${label} ${conf}%`, x + 4, y - 6);
  };

  // Main Canvas Render Animation Loop
  useEffect(() => {
    let frameId;
    const renderLoop = () => {
      const t = Date.now() * 0.002;

      CAMERAS.forEach((cam, idx) => {
        if (cam.id === 'CAM-05' && webcamActive) return; // Skip canvas rendering if user webcam is active
        const canvas = canvasRefs.current[idx];
        if (canvas) {
          const W = canvas.width = canvas.parentElement?.clientWidth || 320;
          const H = canvas.height = canvas.parentElement?.clientHeight || 200;
          const ctx = canvas.getContext('2d');
          drawScene(ctx, W, H, cam, t + idx * 2.5);
        }
      });

      // Render Modal Canvas if open
      if (expandedCam !== null && modalCanvasRef.current) {
        const cam = CAMERAS[expandedCam];
        const canvas = modalCanvasRef.current;
        const W = canvas.width = canvas.parentElement?.clientWidth || 900;
        const H = canvas.height = canvas.parentElement?.clientHeight || 500;
        const ctx = canvas.getContext('2d');
        drawScene(ctx, W, H, cam, t + expandedCam * 2.5);
      }

      frameId = requestAnimationFrame(renderLoop);
    };

    frameId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(frameId);
  }, [expandedCam, webcamActive]);

  const snapPhoto = (cam) => {
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' });
    setCapturedSnaps(prev => [
      { id: Date.now(), cam: cam.name, time: timeStr, target: cam.target.label, conf: cam.target.conf },
      ...prev.slice(0, 5)
    ]);
    playDetectionBeep();
  };

  const camTime = new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' });

  return (
    <motion.div
      key="cctv-overhaul"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, padding: 10, background: '#020617' }}
    >
      {/* ── TOP CONTROL BAR ────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15,23,42,0.8)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: '10px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ padding: 6, background: 'rgba(34,197,94,0.15)', border: '1px solid var(--accent)', borderRadius: 6, color: 'var(--accent)' }}>
            <Video size={18} />
          </div>
          <div>
            <div style={{ fontFamily: "'Share Tech Mono'", fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 'bold', letterSpacing: 2 }}>
              INTEGRATED CCTV SURVEILLANCE GRID // 6 ACTIVE CHANNELS
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
              Optical Sentry • Thermal FLIR • Indian Railways Corridor • Mining Recon • Live WebRTC
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setNightVision(!nightVision)}
            style={{
              background: nightVision ? 'rgba(34,197,94,0.25)' : 'transparent',
              border: `1px solid ${nightVision ? 'var(--accent)' : '#334155'}`,
              color: nightVision ? 'var(--accent)' : '#94a3b8',
              padding: '6px 12px', borderRadius: 6, fontSize: '0.65rem', fontFamily: "'Share Tech Mono'", cursor: 'pointer'
            }}
          >
            {nightVision ? '● NIGHT VISION: ON' : 'NIGHT VISION'}
          </button>
          <button
            onClick={() => setThermalFilter(!thermalFilter)}
            style={{
              background: thermalFilter ? 'rgba(168,85,247,0.25)' : 'transparent',
              border: `1px solid ${thermalFilter ? '#a855f7' : '#334155'}`,
              color: thermalFilter ? '#a855f7' : '#94a3b8',
              padding: '6px 12px', borderRadius: 6, fontSize: '0.65rem', fontFamily: "'Share Tech Mono'", cursor: 'pointer'
            }}
          >
            {thermalFilter ? '● FLIR THERMAL: ON' : 'FLIR THERMAL'}
          </button>
        </div>
      </div>

      {/* ── 6-CAMERA GRID ──────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, flex: 1 }}>
        {CAMERAS.map((cam, idx) => {
          const isAlert = cam.id === alertCamId;
          return (
            <div
              key={cam.id}
              onClick={() => setExpandedCam(idx)}
              style={{
                position: 'relative', height: '220px', borderRadius: 10, overflow: 'hidden',
                border: `2px solid ${isAlert ? '#ef4444' : 'rgba(56,189,248,0.25)'}`,
                boxShadow: isAlert ? '0 0 25px rgba(239,68,68,0.3)' : '0 4px 20px rgba(0,0,0,0.6)',
                cursor: 'pointer', background: '#090d16'
              }}
            >
              {/* Webcam View on CAM-05 or Canvas Feed */}
              {cam.id === 'CAM-05' && webcamActive ? (
                <video
                  ref={webcamVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <canvas
                  ref={el => canvasRefs.current[idx] = el}
                  style={{
                    width: '100%', height: '100%', display: 'block',
                    filter: nightVision ? 'brightness(1.2) contrast(1.4) hue-rotate(90deg)' : thermalFilter ? 'invert(1) hue-rotate(180deg)' : 'none'
                  }}
                />
              )}

              {/* Webcam Start Button Overlay on CAM-05 when inactive */}
              {cam.id === 'CAM-05' && !webcamActive && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', zIndex: 10 }}>
                  <Camera size={28} color="#38bdf8" style={{ marginBottom: 8 }} />
                  <button
                    onClick={(e) => { e.stopPropagation(); startWebcam(); }}
                    style={{ background: 'rgba(56,189,248,0.2)', border: '1px solid #38bdf8', color: '#38bdf8', padding: '6px 14px', borderRadius: 6, fontSize: '0.7rem', fontFamily: "'Share Tech Mono'", cursor: 'pointer' }}
                  >
                    START LIVE WEBCAM
                  </button>
                </div>
              )}

              {/* Top Camera Header Tag */}
              <div style={{ position: 'absolute', top: 8, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.85)', padding: '3px 8px', borderRadius: 4, border: '1px solid var(--glass-border)', fontSize: '0.65rem', fontFamily: "'Share Tech Mono'", color: '#fff' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: isAlert ? '#ef4444' : '#22c55e', animation: 'softPulse 1s infinite' }} />
                  {cam.id}
                </div>
                <div style={{ background: isAlert ? '#ef4444' : 'rgba(0,0,0,0.85)', color: isAlert ? '#fff' : '#38bdf8', fontSize: '0.6rem', fontFamily: "'Share Tech Mono'", padding: '3px 8px', borderRadius: 4 }}>
                  {cam.target.label}
                </div>
              </div>

              {/* Bottom Camera Info Bar */}
              <div style={{ position: 'absolute', bottom: 8, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#fff', fontFamily: "'Share Tech Mono'" }}>{cam.name}</div>
                  <div style={{ fontSize: '0.55rem', color: 'var(--text-dim)' }}>{cam.coords} • {cam.type}</div>
                </div>

                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); snapPhoto(cam); }}
                    style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid #64748b', color: '#fff', padding: '4px', borderRadius: 4, cursor: 'pointer' }}
                    title="Take Snapshot"
                  >
                    <Camera size={12} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setExpandedCam(idx); }}
                    style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '4px', borderRadius: 4, cursor: 'pointer' }}
                    title="Full Screen Inspection"
                  >
                    <Maximize2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── EXPANDED TACTICAL MODAL INSPECTION VIEW ─────────────── */}
      <AnimatePresence>
        {expandedCam !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(10px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
            }}
          >
            <div style={{ width: '90%', maxWidth: '1100px', background: '#0a0f1d', border: '2px solid var(--accent)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 0 50px rgba(34,197,94,0.3)' }}>
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: 'rgba(15,23,42,0.9)', borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ color: 'var(--accent)', fontSize: '1rem', fontWeight: 'bold', fontFamily: "'Share Tech Mono'" }}>
                    TACTICAL SURVEILLANCE INSPECTOR // {CAMERAS[expandedCam].name}
                  </div>
                  <div style={{ fontSize: '0.65rem', background: 'rgba(34,197,94,0.2)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 4 }}>
                    LIVE FEED 1080P • 60 FPS
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    onClick={() => snapPhoto(CAMERAS[expandedCam])}
                    style={{ background: 'rgba(56,189,248,0.2)', border: '1px solid #38bdf8', color: '#38bdf8', padding: '6px 14px', borderRadius: 6, fontSize: '0.7rem', fontFamily: "'Share Tech Mono'", cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Camera size={14} /> CAPTURE EVIDENCE
                  </button>
                  <button
                    onClick={() => setExpandedCam(null)}
                    style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', color: '#ef4444', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Modal High-Res Canvas */}
              <div style={{ height: '480px', position: 'relative', background: '#000' }}>
                <canvas ref={modalCanvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
              </div>

              {/* Modal Telemetry Footer */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: 14, background: '#0b1120', borderTop: '1px solid var(--glass-border)', gap: 10 }}>
                <div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>GPS POSITION</div>
                  <div style={{ fontSize: '0.8rem', color: '#fff', fontFamily: "'Share Tech Mono'" }}>{CAMERAS[expandedCam].coords}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>SENSOR OPTICS</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontFamily: "'Share Tech Mono'" }}>{CAMERAS[expandedCam].type}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>PRIMARY TARGET</div>
                  <div style={{ fontSize: '0.8rem', color: '#ef4444', fontFamily: "'Share Tech Mono'", fontWeight: 'bold' }}>{CAMERAS[expandedCam].target.label}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>AI CONFIDENCE</div>
                  <div style={{ fontSize: '0.8rem', color: '#22c55e', fontFamily: "'Share Tech Mono'", fontWeight: 'bold' }}>{CAMERAS[expandedCam].target.conf}% CONFIRMED</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
