/* eslint-disable react/prop-types */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Maximize2, X, AlertTriangle, Shield, Camera, CameraOff, Download, User, Eye } from 'lucide-react';

// ─── Real human surveillance & suspect portraits matching Image 2 ───
const HUMAN_IMAGES = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80', // Male suspect 1 (Image 2 S-003)
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80', // Armed intruder suspect
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80', // Male suspect 2 (Image 2 S-004)
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&auto=format&fit=crop&q=80', // Infiltrator suspect
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80', // Checkpoint evader
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80', // Female suspect
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&q=80', // S-003 thumbnail (Image 2)
  'https://images.unsplash.com/photo-1494790108755-2616b612b550?w=200&h=200&fit=crop&q=80', // S-002 thumbnail
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&q=80', // S-004 thumbnail (Image 2)
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&fit=crop&q=80', // S-005 thumbnail
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&q=80', // S-006 thumbnail
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&q=80', // S-001 thumbnail
];

const SUSPECT_PROFILES = [
  { id: 'S-001', label: 'ARMED INTRUDER', match: '96%', threat: 'CRITICAL', img: HUMAN_IMAGES[1] },
  { id: 'S-002', label: 'PERIMETER BREACHER', match: '93%', threat: 'CRITICAL', img: HUMAN_IMAGES[3] },
  { id: 'S-003', label: 'UNAUTHORIZED SENTRY', match: '88%', threat: 'HIGH', img: HUMAN_IMAGES[6] },
  { id: 'S-004', label: 'WANTED RECON SCOUT', match: '82%', threat: 'HIGH', img: HUMAN_IMAGES[8] },
  { id: 'S-005', label: 'UNIDENTIFIED INFILTRATOR', match: '78%', threat: 'WARNING', img: HUMAN_IMAGES[9] },
  { id: 'S-006', label: 'CHECKPOINT EVADER', match: '74%', threat: 'WARNING', img: HUMAN_IMAGES[10] },
];

const CAMERAS = [
  {
    id: 'CAM-01', name: 'MAIN GATE -- SEC-7A', coords: "N28°38'12\" E77°13'04\"",
    posterImg: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&auto=format&fit=crop&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-car-approaching-a-security-gate-at-night-42171-large.mp4',
    scenario: [
      { time: [0, 6], detections: [], status: 'CLEAR' },
      { time: [6, 12], detections: [{ class: 'vehicle', conf: 82, x: 20, y: 40, w: 22, h: 14, risk: 55, dx: 4 }], status: 'VEHICLE APPROACHING' },
      { time: [12, 18], detections: [{ class: 'person', conf: 91, x: 45, y: 30, w: 10, h: 28, risk: 75, dx: 1 }], status: 'PERSONNEL EXITING VEHICLE' },
      { time: [18, 180], detections: [], status: 'ACCESS GRANTED' },
    ]
  },
  {
    id: 'CAM-02', name: 'PERIMETER NORTH', coords: "N28°38'18\" E77°13'09\"",
    posterImg: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=700&auto=format&fit=crop&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-security-camera-recording-a-robbery-41484-large.mp4',
    scenario: [
      { time: [0, 8], detections: [], status: 'SCANNING' },
      { time: [8, 15], detections: [{ class: 'person', conf: 68, x: 80, y: 35, w: 9, h: 22, risk: 62, dx: -3 }, { class: 'person', conf: 55, x: 90, y: 38, w: 8, h: 20, risk: 58, dx: -3.5 }], status: '!! 2 UNKNOWNS DETECTED' },
      { time: [15, 25], detections: [{ class: 'person', conf: 92, x: 50, y: 30, w: 18, h: 45, risk: 92, dx: -1 }], status: '!! BREACH ATTEMPT - COMBATANT' },
      { time: [25, 180], detections: [], status: 'THREAT NEUTRALIZED' },
    ]
  },
  {
    id: 'CAM-03', name: 'EAST WATCHTOWER', coords: "N28°38'15\" E77°13'15\"",
    posterImg: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=700&auto=format&fit=crop&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-fence-with-barbed-wire-39853-large.mp4',
    scenario: [
      { time: [0, 20], detections: [], status: 'CLEAR' },
      { time: [20, 30], detections: [{ class: 'animal', conf: 88, x: 10, y: 50, w: 15, h: 10, risk: 20, dx: 3 }], status: 'WILDLIFE (STRAY DOG)' },
      { time: [30, 40], detections: [], status: 'CLEAR -- AUTO-CLASSIFIED' },
      { time: [40, 180], detections: [{ class: 'drone', conf: 73, x: 20, y: 15, w: 8, h: 5, risk: 90, dx: 5, dy: 2 }], status: '!! UAV IN AIRSPACE' },
    ]
  },
  {
    id: 'CAM-04', name: 'COMMAND BUNKER', coords: "N28°38'10\" E77°13'00\"",
    posterImg: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=700&auto=format&fit=crop&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-guard-walking-in-the-snow-during-winter-39845-large.mp4',
    scenario: [
      { time: [0, 180], detections: [], status: 'SECURE -- NO MOVEMENT' },
    ]
  },
];

// ─── Draw 3D-like human figures on canvas ───
function draw3DHuman(ctx, x, y, w, h, color, rgbStr, risk, tick, idx) {
  const cx = x + w / 2;
  const headR = w * 0.14;
  const shY = y + headR * 4.5;
  const hipY = y + h * 0.56;
  const walkPhase = Math.sin(tick * 1.8 + idx) * 0.15;

  // Shadow beneath feet
  ctx.fillStyle = `rgba(${rgbStr}, 0.15)`;
  ctx.beginPath();
  ctx.ellipse(cx, y + h + 4, w * 0.3, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── 3D Head ──
  // Shadow
  ctx.fillStyle = `rgba(0,0,0,0.4)`;
  ctx.beginPath();
  ctx.arc(cx + 2, y + headR * 2 + 2, headR, 0, Math.PI * 2);
  ctx.fill();
  // Base sphere gradient
  const headGrad = ctx.createRadialGradient(cx - headR * 0.3, y + headR * 1.5, 0, cx, y + headR * 2, headR * 1.1);
  headGrad.addColorStop(0, `rgba(${rgbStr}, 0.9)`);
  headGrad.addColorStop(0.6, `rgba(${rgbStr}, 0.55)`);
  headGrad.addColorStop(1, `rgba(0,0,0,0.6)`);
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.arc(cx, y + headR * 2, headR, 0, Math.PI * 2);
  ctx.fill();
  // Highlight
  ctx.fillStyle = `rgba(255,255,255,0.2)`;
  ctx.beginPath();
  ctx.arc(cx - headR * 0.3, y + headR * 1.5, headR * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // ── 3D Torso ──
  const torsoGrad = ctx.createLinearGradient(cx - w * 0.22, shY, cx + w * 0.22, shY);
  torsoGrad.addColorStop(0, `rgba(0,0,0,0.5)`);
  torsoGrad.addColorStop(0.4, `rgba(${rgbStr}, 0.7)`);
  torsoGrad.addColorStop(1, `rgba(0,0,0,0.5)`);
  ctx.fillStyle = torsoGrad;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.22, shY);
  ctx.lineTo(cx + w * 0.22, shY);
  ctx.lineTo(cx + w * 0.17, hipY);
  ctx.lineTo(cx - w * 0.17, hipY);
  ctx.closePath();
  ctx.fill();
  // Torso highlight
  ctx.strokeStyle = `rgba(${rgbStr}, 0.3)`;
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // ── 3D Arms ──
  ctx.strokeStyle = `rgba(${rgbStr}, 0.7)`;
  ctx.lineWidth = w * 0.07;
  ctx.lineCap = 'round';
  // Left arm (upper + lower)
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.22, shY + 3);
  ctx.quadraticCurveTo(cx - w * 0.38, shY + h * 0.15, cx - w * 0.42, shY + h * 0.25 + walkPhase * 28);
  ctx.stroke();
  // Right arm
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.22, shY + 3);
  ctx.quadraticCurveTo(cx + w * 0.38, shY + h * 0.15, cx + w * 0.42, shY + h * 0.25 - walkPhase * 28);
  ctx.stroke();

  // ── 3D Legs ──
  ctx.lineWidth = w * 0.09;
  // Left leg
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.1, hipY);
  ctx.quadraticCurveTo(cx - w * 0.15, y + h * 0.78, cx - w * 0.2, y + h - 3 + walkPhase * 22);
  ctx.stroke();
  // Right leg
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.1, hipY);
  ctx.quadraticCurveTo(cx + w * 0.15, y + h * 0.78, cx + w * 0.2, y + h - 3 - walkPhase * 22);
  ctx.stroke();
  ctx.lineCap = 'butt';

  // Weapon for high-risk
  if (risk > 70) {
    ctx.strokeStyle = 'rgba(239,68,68,0.8)';
    ctx.lineWidth = 2;
    const wx = cx + w * 0.44;
    const wy = shY + h * 0.08;
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    ctx.lineTo(wx + 10, wy + 20);
    ctx.stroke();
    const pulseR = 5 + Math.sin(tick * 3.5) * 2;
    ctx.beginPath();
    ctx.arc(wx + 5, wy + 24, pulseR, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(239,68,68,${0.5 + Math.sin(tick * 3.5) * 0.3})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

// ─── Draw detections on canvas ───
function drawCameraDetections(canvas, phase, tick) {
  if (!canvas || !phase) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Subtle dark overlay
  ctx.fillStyle = 'rgba(0, 15, 5, 0.06)';
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = 'rgba(34,197,94,0.03)';
  ctx.lineWidth = 0.5;
  for (let gx = 0; gx < W; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
  for (let gy = 0; gy < H; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

  // Scan line
  const scanY = (tick * 60) % H;
  ctx.fillStyle = 'rgba(34,197,94,0.05)';
  ctx.fillRect(0, scanY, W, 3);

  const jitter = Math.sin(tick * 5) * 1.5;
  const phaseStart = phase.time[0];
  const detections = phase.detections;

  detections.forEach((det, idx) => {
    const tDiff = tick - phaseStart;
    const xOff = det.dx ? tDiff * det.dx : 0;
    const yOff = det.dy ? tDiff * det.dy : 0;
    const x = ((det.x + xOff) / 100) * W + jitter;
    const y = ((det.y + yOff) / 100) * H + jitter;
    const w = (det.w / 100) * W;
    const h = (det.h / 100) * H;
    if (x < -W || x > W * 2) return;

    const color = det.risk > 70 ? '#ef4444' : det.risk > 40 ? '#f59e0b' : '#22c55e';
    const rgbStr = det.risk > 70 ? '239,68,68' : det.risk > 40 ? '245,158,11' : '34,197,94';
    const conf = Math.min(99, det.conf + Math.floor(Math.random() * 3 - 1));

    // Glow halo
    const gradient = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, Math.max(w, h) * 0.85);
    gradient.addColorStop(0, `rgba(${rgbStr}, 0.12)`);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - w * 0.2, y - h * 0.2, w * 1.4, h * 1.4);

    // Box
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.strokeRect(x, y, w, h);

    // Corner brackets
    const cl = Math.min(w, h) * 0.3;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = color;
    [[[x, y + cl], [x, y], [x + cl, y]], [[x + w - cl, y], [x + w, y], [x + w, y + cl]],
     [[x, y + h - cl], [x, y + h], [x + cl, y + h]], [[x + w - cl, y + h], [x + w, y + h], [x + w, y + h - cl]]
    ].forEach(pts => {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      ctx.lineTo(pts[1][0], pts[1][1]);
      ctx.lineTo(pts[2][0], pts[2][1]);
      ctx.stroke();
    });

    // 3D Human / Vehicle / Drone rendering
    if (det.class === 'person') {
      draw3DHuman(ctx, x, y, w, h, color, rgbStr, det.risk, tick, idx);
    }

    if (det.class === 'vehicle') {
      // 3D isometric vehicle
      const vx = x + w * 0.05, vy = y + h * 0.3;
      const vw = w * 0.9, vh = h * 0.5;
      // Body
      const bodyGrad = ctx.createLinearGradient(vx, vy, vx + vw, vy + vh);
      bodyGrad.addColorStop(0, `rgba(${rgbStr}, 0.4)`);
      bodyGrad.addColorStop(1, `rgba(0,0,0,0.3)`);
      ctx.fillStyle = bodyGrad;
      ctx.fillRect(vx, vy, vw, vh);
      // Roof
      ctx.fillStyle = `rgba(${rgbStr}, 0.5)`;
      ctx.fillRect(vx + vw * 0.1, vy - vh * 0.38, vw * 0.6, vh * 0.42);
      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(vx + vw * 0.12, vy - vh * 0.35, vw * 0.3, vh * 0.12);
      // Wheels
      [0.18, 0.78].forEach(ox => {
        ctx.fillStyle = `rgba(${rgbStr}, 0.5)`;
        ctx.beginPath();
        ctx.arc(vx + vw * ox, vy + vh, w * 0.07, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(${rgbStr}, 0.3)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(vx + vw * ox, vy + vh, w * 0.1, 0, Math.PI * 2);
        ctx.stroke();
      });
    }

    if (det.class === 'drone') {
      // 3D quad-rotor drone
      const dcx = x + w / 2, dcy = y + h / 2;
      ctx.strokeStyle = `rgba(${rgbStr}, 0.7)`;
      ctx.lineWidth = 2;
      // Frame cross
      ctx.beginPath(); ctx.moveTo(dcx - w * 0.32, dcy - h * 0.22); ctx.lineTo(dcx + w * 0.32, dcy + h * 0.22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(dcx + w * 0.32, dcy - h * 0.22); ctx.lineTo(dcx - w * 0.32, dcy + h * 0.22); ctx.stroke();
      // Central body
      ctx.fillStyle = `rgba(${rgbStr}, 0.4)`;
      ctx.beginPath(); ctx.rect(dcx - w * 0.08, dcy - h * 0.08, w * 0.16, h * 0.16); ctx.fill();
      // Spinning rotors
      const rotorAngle = tick * 8;
      [[-0.32, -0.22], [0.32, -0.22], [-0.32, 0.22], [0.32, 0.22]].forEach(([ox, oy]) => {
        const rx = dcx + w * ox, ry = dcy + h * oy;
        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(rotorAngle);
        ctx.strokeStyle = `rgba(${rgbStr}, 0.7)`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, w * 0.1, w * 0.03, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = `rgba(${rgbStr}, 0.4)`;
        ctx.beginPath(); ctx.arc(rx, ry, 2.5, 0, Math.PI * 2); ctx.fill();
      });
    }

    if (det.class === 'animal') {
      // Simple animal silhouette
      ctx.fillStyle = `rgba(${rgbStr}, 0.3)`;
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h * 0.55, w * 0.35, h * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
      // Head
      ctx.beginPath();
      ctx.arc(x + w * 0.75, y + h * 0.38, w * 0.12, 0, Math.PI * 2);
      ctx.fill();
      // Legs
      ctx.strokeStyle = `rgba(${rgbStr}, 0.5)`;
      ctx.lineWidth = w * 0.05;
      [0.25, 0.4, 0.6, 0.75].forEach(lx => {
        ctx.beginPath();
        ctx.moveTo(x + w * lx, y + h * 0.68);
        ctx.lineTo(x + w * lx + (lx < 0.5 ? -3 : 3), y + h - 4);
        ctx.stroke();
      });
    }

    // Label
    const label = `${det.class.toUpperCase()} ${conf}% [${det.risk > 70 ? 'CRIT' : det.risk > 40 ? 'WARN' : 'LOW'}]`;
    ctx.font = '10px "Share Tech Mono"';
    const tw = ctx.measureText(label).width + 8;
    ctx.fillStyle = color;
    ctx.fillRect(x, y - 15, tw, 14);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 9px "Share Tech Mono"';
    ctx.fillText(label, x + 4, y - 4);

    // Risk bar
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x, y + h + 2, w, 4);
    ctx.fillStyle = color; ctx.fillRect(x, y + h + 2, w * (det.risk / 100), 4);

    // Distance
    ctx.font = '8px "Share Tech Mono"';
    ctx.fillStyle = `rgba(${rgbStr}, 0.65)`;
    ctx.fillText(`${Math.floor(60 + det.risk * 1.5)}m | TGT-${String(idx + 1).padStart(2, '0')}`, x, y + h + 14);
  });

  // Crosshair
  ctx.strokeStyle = 'rgba(34,197,94,0.08)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
  ctx.setLineDash([]);

  // Timestamp
  ctx.font = '8px "Share Tech Mono"';
  ctx.fillStyle = 'rgba(34,197,94,0.25)';
  ctx.fillText(new Date().toISOString().slice(11, 19) + ' UTC', W - 84, H - 6);
}

export default function CCTVGrid({ active = false, voiceRef, voiceEnabled, setDetectionData, setSmsText, setSmsVisible, playDetectionBeep }) {
  const [expandedCam, setExpandedCam] = useState(null);
  const [tick, setTick] = useState(0);
  const [failedVideos, setFailedVideos] = useState({});
  const canvasRefs = useRef([]);
  const videoRefs = useRef([]);
  const modalCanvasRef = useRef(null);
  const prevStatusRef = useRef({});

  const downloadSnapshot = (index, camId) => {
    const video = videoRefs.current[index];
    const canvas = canvasRefs.current[index];
    if (!video || !canvas) return;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width || 320;
    tempCanvas.height = canvas.height || 200;
    const ctx = tempCanvas.getContext('2d');
    try { ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height); } catch (e) { /* */ }
    ctx.drawImage(canvas, 0, 0);
    const link = document.createElement('a');
    link.download = `${camId}_${Date.now()}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
  };

  // Live webcam
  const [liveStream, setLiveStream] = useState(null);
  const [liveError, setLiveError] = useState('');
  const liveVideoRef = useRef(null);
  const liveCanvasRef = useRef(null);
  const liveAnimRef = useRef(null);

  const startLiveFeed = async () => {
    setLiveError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 360 } });
      setLiveStream(stream);
      if (liveVideoRef.current) liveVideoRef.current.srcObject = stream;
    } catch (err) {
      if (err.name === 'NotAllowedError') setLiveError('Camera permission denied.');
      else if (err.name === 'NotFoundError') setLiveError('No camera found on this system.');
      else setLiveError(`Camera error: ${err.message}`);
    }
  };

  const stopLiveFeed = () => {
    if (liveStream) { liveStream.getTracks().forEach(t => t.stop()); setLiveStream(null); }
    if (liveAnimRef.current) { cancelAnimationFrame(liveAnimRef.current); liveAnimRef.current = null; }
  };

  useEffect(() => {
    if (!liveStream || !liveVideoRef.current || !liveCanvasRef.current) return;
    const video = liveVideoRef.current;
    const canvas = liveCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const drawFrame = () => {
      if (!liveStream) return;
      canvas.width = canvas.parentElement?.clientWidth || 320;
      canvas.height = canvas.parentElement?.clientHeight || 200;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const scanY = (Date.now() * 0.06) % canvas.height;
      ctx.fillStyle = 'rgba(34,197,94,0.06)';
      ctx.fillRect(0, scanY, canvas.width, 3);
      ctx.strokeStyle = 'rgba(34,197,94,0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2); ctx.stroke();
      ctx.setLineDash([]);
      liveAnimRef.current = requestAnimationFrame(drawFrame);
    };
    video.onloadedmetadata = () => drawFrame();
    return () => { if (liveAnimRef.current) cancelAnimationFrame(liveAnimRef.current); };
  }, [liveStream]);

  useEffect(() => {
    return () => { if (liveStream) liveStream.getTracks().forEach(t => t.stop()); };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => Number((t + 0.25).toFixed(2)) % 180), 250);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    CAMERAS.forEach((cam, i) => {
      const phase = cam.scenario.find(s => tick >= s.time[0] && tick < s.time[1]);
      if (phase && canvasRefs.current[i]) {
        const canvas = canvasRefs.current[i];
        canvas.width = canvas.parentElement?.clientWidth || 320;
        canvas.height = canvas.parentElement?.clientHeight || 200;
        drawCameraDetections(canvas, phase, tick);

        const status = phase.status;
        if (prevStatusRef.current[cam.id] !== status && status !== 'CLEAR' && status !== 'SCANNING' && status !== 'SECURE -- NO MOVEMENT') {
          if (status.includes('!!') && voiceRef?.current && voiceEnabled) {
            const txt = `CCTV Alert. ${cam.name}. ${status.replace('!!', '')}. Security detail respond.`;
            voiceRef.current.speak(txt, 'critical');
            if (setDetectionData && status.includes('BREACH')) {
              setDetectionData(prev => ({ ...prev, threatLevel: 'CRITICAL', riskScore: 95, primaryClass: 'ARMED INTRUDER', personCount: 2, label: cam.id }));
              if (playDetectionBeep) playDetectionBeep();
              if (setSmsText) { setSmsText(`ALERT: ${status.replace('⚠', '')} at ${cam.name}. Deploy QRF immediately.`); setSmsVisible(true); setTimeout(() => setSmsVisible(false), 6000); }
            }
          } else if (voiceRef?.current && voiceEnabled && phase.detections.length > 0) {
            voiceRef.current.speak(`CCTV Update. ${cam.name}. ${status}.`, 'normal');
          }
        } else if (prevStatusRef.current[cam.id] !== status && (status === 'CLEAR' || status === 'THREAT NEUTRALIZED')) {
          if (voiceRef?.current && voiceEnabled) voiceRef.current.speak(`CCTV All clear. ${cam.name}.`);
          if (setDetectionData && prevStatusRef.current[cam.id]?.includes('BREACH')) {
            setDetectionData(prev => ({ ...prev, threatLevel: 'LOW', riskScore: 0, primaryClass: 'NONE', personCount: 0, label: 'IDLE' }));
          }
        }
        prevStatusRef.current[cam.id] = status;
      } else if (!phase) {
        prevStatusRef.current[cam.id] = cam.scenario[0].status;
      }
    });

    if (expandedCam !== null && modalCanvasRef.current) {
      const cam = CAMERAS[expandedCam];
      const phase = cam.scenario.find(s => tick >= s.time[0] && tick < s.time[1]);
      if (phase) {
        modalCanvasRef.current.width = modalCanvasRef.current.parentElement?.clientWidth || 900;
        modalCanvasRef.current.height = modalCanvasRef.current.parentElement?.clientHeight || 506;
        drawCameraDetections(modalCanvasRef.current, phase, tick);
      }
    }
  }, [tick, expandedCam]);

  const getStatus = (cam) => cam.scenario.find(s => tick >= s.time[0] && tick < s.time[1]) || cam.scenario[0];
  const camTime = new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' });

  // Determine which cameras have active threats for suspect profiles
  const hasCritical = CAMERAS.some(cam => {
    const phase = getStatus(cam);
    return phase.detections.some(d => d.risk > 70);
  });

  return (
    <motion.div key="cctv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 6, gap: 6, background: '#000' }}>

      {/* SUSPECT PROFILES HEADER STRIP — shows when threats detected */}
      {hasCritical && (
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex', gap: 8, padding: '6px 10px',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8, alignItems: 'center'
          }}>
          <AlertTriangle size={12} color="#ef4444" />
          <span style={{ fontSize: '0.55rem', color: '#ef4444', fontFamily: "'Share Tech Mono'", letterSpacing: 2, marginRight: 8 }}>THREAT PROFILES DETECTED</span>
          {SUSPECT_PROFILES.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '4px 8px' }}>
              <img src={p.img} alt={p.label}
                style={{ width: 28, height: 36, objectFit: 'cover', borderRadius: 3, filter: 'grayscale(40%) contrast(1.2)', border: '1px solid #ef4444' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
              <div>
                <div style={{ fontSize: '0.42rem', color: '#fff', fontWeight: 'bold', fontFamily: "'Share Tech Mono'" }}>{p.label}</div>
                <div style={{ fontSize: '0.38rem', color: '#ef4444', fontFamily: "'Share Tech Mono'" }}>MATCH: {p.match}</div>
                <div style={{ fontSize: '0.35rem', color: 'rgba(255,255,255,0.4)' }}>ID: {p.id}</div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      <div className="cctv-grid">
        {CAMERAS.map((cam, index) => {
          const phase = getStatus(cam);
          const hasDetections = phase.detections.length > 0;
          const isCritical = phase.detections.some(d => d.risk > 70);
          const camFilters = {
            'CAM-01': 'brightness(1.05)',
            'CAM-02': 'sepia(1) hue-rotate(90deg) saturate(3) brightness(0.8)',
            'CAM-03': 'contrast(1.2) grayscale(0.2)',
            'CAM-04': 'sepia(1) hue-rotate(300deg) saturate(3) brightness(0.6)'
          };
          const isOffline = cam.id === 'CAM-04' && Math.floor(tick / 20) % 3 === 2;

          return (
            <div key={cam.id} className={`cctv-feed ${isCritical ? 'critical' : hasDetections ? 'degraded' : ''}`}
              onClick={() => setExpandedCam(index)} style={{ position: 'relative' }}>
              {/* Real Human Surveillance Photo backdrop */}
              <img
                src={cam.posterImg}
                alt={cam.name}
                style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                  zIndex: 0, opacity: isOffline ? 0 : 0.75, filter: camFilters[cam.id] || 'none'
                }}
              />
              <video autoPlay loop muted playsInline preload="metadata"
                ref={el => videoRefs.current[index] = el}
                onError={() => setFailedVideos(prev => ({ ...prev, [cam.id]: true }))}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: isOffline || failedVideos[cam.id] ? 0 : 0.65, filter: camFilters[cam.id] || 'none' }}
                src={cam.videoUrl}
              />

              {/* 3D Human overlay images when person detected and video failed */}
              {!isOffline && failedVideos[cam.id] && hasDetections && phase.detections.some(d => d.class === 'person') && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'linear-gradient(135deg, #0a110a, #060d06)' }}>
                  {HUMAN_IMAGES.slice(0, Math.min(2, phase.detections.filter(d => d.class === 'person').length)).map((img, imgIdx) => (
                    <img key={imgIdx} src={img} alt="detected person"
                      style={{
                        position: 'absolute',
                        left: `${20 + imgIdx * 30}%`, top: '15%',
                        width: '25%', height: '70%',
                        objectFit: 'cover', opacity: 0.55,
                        filter: 'grayscale(60%) contrast(1.3) brightness(0.7)',
                        borderRadius: 4
                      }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  ))}
                </div>
              )}

              {isOffline && (
                <div style={{ position: 'absolute', inset: 0, background: '#111', zIndex: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontFamily: "'Share Tech Mono'", fontSize: '1.2rem' }}>
                  <CameraOff size={24} style={{ marginRight: 8 }} /> OFFLINE
                </div>
              )}

              <canvas ref={el => canvasRefs.current[index] = el} className="cctv-noise"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }} />

              {/* Face capture + suspect thumbnail for critical */}
              {isCritical && hasDetections && (
                <div style={{ position: 'absolute', right: 6, top: 36, width: 66, background: 'rgba(0,0,0,0.88)', border: '1px solid #ef4444', zIndex: 10, borderRadius: 4, overflow: 'hidden', boxShadow: '0 0 10px rgba(239,68,68,0.4)' }}>
                  <img src={SUSPECT_PROFILES[index % SUSPECT_PROFILES.length].img} alt="suspect"
                    style={{ width: '100%', height: 54, objectFit: 'cover', filter: 'grayscale(20%) contrast(1.2)' }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  <div style={{ fontSize: '5.5px', color: '#ef4444', textAlign: 'center', padding: '2px 1px', fontFamily: "'Share Tech Mono'", fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {SUSPECT_PROFILES[index % SUSPECT_PROFILES.length].label}
                  </div>
                </div>
              )}

              <div className="cctv-overlay">
                <div className="cctv-top-bar">
                  <div className="cctv-id">
                    <span className={`cctv-rec-dot ${isCritical ? 'degraded' : 'recording'}`} style={isCritical ? { background: '#ef4444', animation: 'blink 0.5s step-end infinite' } : {}} />
                    {cam.id}
                  </div>
                  <div className="cctv-status" style={isCritical ? { color: '#ef4444', background: 'rgba(239,68,68,0.15)' } : hasDetections ? { color: '#f59e0b' } : {}}>
                    {phase.status}
                  </div>
                </div>

                {hasDetections && (
                  <div className="cctv-alert-badge" style={isCritical ? { borderColor: '#ef4444', color: '#ef4444', background: 'rgba(239,68,68,0.15)' } : {}}>
                    {isCritical ? <AlertTriangle size={10} /> : <Shield size={10} />}
                    {phase.detections.length} TARGET{phase.detections.length > 1 ? 'S' : ''}
                  </div>
                )}

                <div className="cctv-crosshair"><div className="ch-h" /><div className="ch-v" /></div>

                <div className="cctv-bottom-bar">
                  <div>
                    <div className="cctv-name">{cam.name}</div>
                    <div className="cctv-coords">{cam.coords}</div>
                  </div>
                  <div className="cctv-time">{camTime}</div>
                </div>
              </div>

              <button className="cctv-expand-btn" onClick={e => { e.stopPropagation(); setExpandedCam(index); }}>
                <Maximize2 size={12} />
              </button>
              <button className="cctv-expand-btn" style={{ right: 30 }} onClick={e => { e.stopPropagation(); downloadSnapshot(index, cam.id); }}>
                <Download size={12} />
              </button>
              <div className="cctv-scanlines" />
            </div>
          );
        })}

        {/* CAM-05: LIVE WEBCAM */}
        <div className={`cctv-feed ${liveStream ? 'degraded' : ''}`} style={{ position: 'relative' }}>
          <video ref={liveVideoRef} autoPlay muted playsInline style={{ display: 'none' }} />
          {liveStream ? (
            <canvas ref={liveCanvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }} />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.9)', zIndex: 1, gap: 8 }}>
              {/* 3D camera icon SVG */}
              <svg width="40" height="40" viewBox="0 0 40 40">
                <rect x="4" y="12" width="32" height="22" rx="3" fill="none" stroke="rgba(34,197,94,0.4)" strokeWidth="1.5" />
                <polygon points="13,12 27,12 23,6 17,6" fill="none" stroke="rgba(34,197,94,0.4)" strokeWidth="1.5" />
                <circle cx="20" cy="22" r="7" fill="none" stroke="rgba(34,197,94,0.5)" strokeWidth="1.5" />
                <circle cx="20" cy="22" r="3.5" fill="rgba(34,197,94,0.2)" />
                <circle cx="28" cy="16" r="2" fill="rgba(239,68,68,0.5)" />
              </svg>
              <div style={{ fontSize: '0.55rem', color: 'var(--text-dim)', textAlign: 'center', padding: '0 8px' }}>
                {liveError || 'Press START to activate live webcam'}
              </div>
              {liveError && <div style={{ fontSize: '0.5rem', color: 'var(--danger)', textAlign: 'center', padding: '0 8px' }}>{liveError}</div>}
            </div>
          )}

          <div className="cctv-overlay">
            <div className="cctv-top-bar">
              <div className="cctv-id">
                <span className={`cctv-rec-dot ${liveStream ? 'recording' : ''}`} style={liveStream ? { background: '#ef4444' } : {}} />
                CAM-05
              </div>
              <div className="cctv-status" style={liveStream ? { color: '#22c55e' } : {}}>
                {liveStream ? 'LIVE FEED ACTIVE' : 'STANDBY'}
              </div>
            </div>
            <div className="cctv-crosshair"><div className="ch-h" /><div className="ch-v" /></div>
            <div className="cctv-bottom-bar">
              <div>
                <div className="cctv-name">LIVE CAM -- LOCAL DEVICE</div>
                <div className="cctv-coords">getUserMedia WebRTC</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {!liveStream ? (
                  <button onClick={startLiveFeed} style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 4, cursor: 'pointer', fontFamily: "'Share Tech Mono'", fontSize: '0.5rem' }}>START</button>
                ) : (
                  <button onClick={stopLiveFeed} style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', color: '#ef4444', padding: '2px 8px', borderRadius: 4, cursor: 'pointer', fontFamily: "'Share Tech Mono'", fontSize: '0.5rem' }}>STOP</button>
                )}
              </div>
            </div>
          </div>
          <div className="cctv-scanlines" />
        </div>

        {/* CAM-06: 3D Scene Preview (was blank, now has a 3D-like visualization) */}
        <div className="cctv-feed" style={{ position: 'relative', background: '#0a0a0a' }}>
          {/* 3D wireframe scene as SVG */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
            <svg width="90%" height="80%" viewBox="0 0 300 200">
              {/* Ground grid */}
              {Array.from({ length: 8 }).map((_, i) => (
                <line key={`h${i}`} x1={10 + i * 40} y1="50" x2={40 + i * 28} y2="170" stroke="rgba(34,197,94,0.15)" strokeWidth="0.5" />
              ))}
              {Array.from({ length: 6 }).map((_, i) => (
                <line key={`v${i}`} x1="10" y1={50 + i * 20} x2="290" y2={80 + i * 18} stroke="rgba(34,197,94,0.1)" strokeWidth="0.5" />
              ))}
              {/* 3D Building outlines */}
              <rect x="60" y="80" width="40" height="60" fill="none" stroke="rgba(34,197,94,0.4)" strokeWidth="1" />
              <rect x="65" y="75" width="40" height="60" fill="rgba(34,197,94,0.04)" stroke="rgba(34,197,94,0.2)" strokeWidth="0.5" />
              <line x1="60" y1="80" x2="65" y2="75" stroke="rgba(34,197,94,0.3)" strokeWidth="0.8" />
              <line x1="100" y1="80" x2="105" y2="75" stroke="rgba(34,197,94,0.3)" strokeWidth="0.8" />
              <line x1="100" y1="140" x2="105" y2="135" stroke="rgba(34,197,94,0.3)" strokeWidth="0.8" />
              {/* 3D Person wireframe */}
              <circle cx="180" cy="90" r="9" fill="none" stroke="rgba(56,189,248,0.7)" strokeWidth="1.5" />
              <line x1="180" y1="99" x2="180" y2="130" stroke="rgba(56,189,248,0.6)" strokeWidth="2" />
              <line x1="180" y1="110" x2="165" y2="120" stroke="rgba(56,189,248,0.6)" strokeWidth="1.5" />
              <line x1="180" y1="110" x2="195" y2="120" stroke="rgba(56,189,248,0.6)" strokeWidth="1.5" />
              <line x1="180" y1="130" x2="170" y2="155" stroke="rgba(56,189,248,0.6)" strokeWidth="1.5" />
              <line x1="180" y1="130" x2="190" y2="155" stroke="rgba(56,189,248,0.6)" strokeWidth="1.5" />
              {/* Bounding box */}
              <rect x="163" y="76" width="35" height="83" fill="none" stroke="rgba(56,189,248,0.5)" strokeWidth="1" strokeDasharray="3 2" />
              {/* Label */}
              <rect x="163" y="62" width="55" height="13" fill="rgba(56,189,248,0.8)" rx="2" />
              <text x="167" y="72" fill="#000" fontSize="8" fontFamily="monospace" fontWeight="bold">PERSON 94%</text>
              {/* Drone wireframe */}
              <line x1="220" y1="50" x2="240" y2="50" stroke="rgba(168,85,247,0.7)" strokeWidth="1.5" />
              <line x1="230" y1="40" x2="230" y2="60" stroke="rgba(168,85,247,0.7)" strokeWidth="1.5" />
              <circle cx="222" cy="42" r="4" fill="none" stroke="rgba(168,85,247,0.6)" strokeWidth="1" />
              <circle cx="238" cy="42" r="4" fill="none" stroke="rgba(168,85,247,0.6)" strokeWidth="1" />
              <circle cx="222" cy="58" r="4" fill="none" stroke="rgba(168,85,247,0.6)" strokeWidth="1" />
              <circle cx="238" cy="58" r="4" fill="none" stroke="rgba(168,85,247,0.6)" strokeWidth="1" />
              <circle cx="230" cy="50" r="5" fill="rgba(168,85,247,0.2)" stroke="rgba(168,85,247,0.5)" strokeWidth="1" />
              {/* Danger ring */}
              <circle cx="230" cy="50" r="20" fill="none" stroke="rgba(239,68,68,0.3)" strokeWidth="0.8" strokeDasharray="4 2" />
              {/* AR text */}
              <text x="10" y="15" fill="rgba(34,197,94,0.6)" fontSize="8" fontFamily="monospace">3D SPATIAL MAP — AR VIEW</text>
              <text x="10" y="185" fill="rgba(34,197,94,0.3)" fontSize="7" fontFamily="monospace">N28°38'12" E77°13'04" | ALT:412m</text>
            </svg>
          </div>

          <div className="cctv-overlay">
            <div className="cctv-top-bar">
              <div className="cctv-id" style={{ color: '#38bdf8' }}>
                <span className="cctv-rec-dot" style={{ background: '#38bdf8', animation: 'breathe 2s infinite' }} />
                CAM-06
              </div>
              <div className="cctv-status" style={{ color: '#38bdf8' }}>3D AR VIEW</div>
            </div>
            <div className="cctv-bottom-bar">
              <div>
                <div className="cctv-name" style={{ color: '#38bdf8' }}>AR SPATIAL MAP -- SEC-3</div>
                <div className="cctv-coords" style={{ color: 'rgba(56,189,248,0.5)' }}>THREE.JS 3D ENGINE</div>
              </div>
            </div>
          </div>
          <div className="cctv-scanlines" />
        </div>
      </div>

      {/* Expanded Modal */}
      <AnimatePresence>
        {expandedCam !== null && (
          <motion.div className="cctv-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setExpandedCam(null)}>
            <motion.div className="cctv-modal-content" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
              <div className="cctv-modal-header">
                <span>{CAMERAS[expandedCam].id} — {CAMERAS[expandedCam].name}</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>{CAMERAS[expandedCam].coords}</span>
                <button className="cctv-close-btn" onClick={() => setExpandedCam(null)}><X size={14} /></button>
              </div>
              <div className="cctv-modal-feed" style={{ position: 'relative' }}>
                <video autoPlay loop muted playsInline
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.65 }}
                  src={CAMERAS[expandedCam].videoUrl}
                />
                <canvas ref={modalCanvasRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 1 }} />

                {/* Expanded suspect profiles panel */}
                {getStatus(CAMERAS[expandedCam]).detections.some(d => d.risk > 70) && (
                  <div style={{ position: 'absolute', right: 12, top: 12, width: 150, background: 'rgba(0,0,0,0.9)', border: '1px solid #ef4444', borderRadius: 8, zIndex: 10, padding: 10 }}>
                    <div style={{ fontSize: '0.48rem', color: '#ef4444', marginBottom: 8, fontFamily: "'Share Tech Mono'", letterSpacing: 1 }}>⚠ SUSPECT PROFILES</div>
                    {SUSPECT_PROFILES.map(p => (
                      <div key={p.id} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                        <img src={p.img} alt={p.label}
                          style={{ width: 36, height: 48, objectFit: 'cover', borderRadius: 3, filter: 'grayscale(20%) contrast(1.1)', border: '1px solid #ef4444' }}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                        <div>
                          <div style={{ fontSize: '0.42rem', color: '#fff', fontWeight: 'bold', fontFamily: "'Share Tech Mono'" }}>{p.label}</div>
                          <div style={{ fontSize: '0.38rem', color: '#ef4444', fontFamily: "'Share Tech Mono'" }}>MATCH: {p.match}</div>
                          <div style={{ fontSize: '0.35rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Share Tech Mono'" }}>{p.id}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="cctv-modal-rec" style={{ zIndex: 2 }}>
                  <div className="rec-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'breathe 1.5s infinite' }} /> REC
                </div>
                <div className="video-scanlines" />
                <div style={{ position: 'absolute', bottom: 10, left: 10, display: 'flex', gap: 6 }}>
                  <div className="hud-badge info" style={{ fontSize: '0.65rem' }}>{getStatus(CAMERAS[expandedCam]).status}</div>
                  {getStatus(CAMERAS[expandedCam]).detections.length > 0 && (
                    <div className="hud-badge warning" style={{ fontSize: '0.65rem' }}>
                      {getStatus(CAMERAS[expandedCam]).detections.length} DETECTION(S)
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
