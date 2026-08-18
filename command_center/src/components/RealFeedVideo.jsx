import { useState, useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, RefreshCw, Play } from 'lucide-react';
import { REAL_MEDIA_BACKUP } from '../lib/realMediaFeeds';

// ═══════════════════════════════════════════════════
//  YOLOv-style Canvas Simulation Fallback
//  Renders animated bounding boxes and detection
//  overlays on a simulated surveillance background
//  when real video footage is unavailable
// ═══════════════════════════════════════════════════

const CHANNEL_SCENARIOS = {
  border: {
    bg: '#0a0f0a',
    imgUrl: 'https://images.unsplash.com/photo-1582236528766-419b4fcb5113?w=1080&q=80', // Barbed wire fence
    label: 'PERSON // INTRUDER',
    color: '#ef4444',
    objects: [
      { x: 0.25, y: 0.35, w: 0.12, h: 0.35, label: 'PERSON', conf: 96.4, cls: 'HOSTILE' },
      { x: 0.55, y: 0.45, w: 0.08, h: 0.25, label: 'PERSON', conf: 78.1, cls: 'UNCLASSIFIED' },
    ],
    gridColor: 'rgba(34,197,94,0.06)',
  },
  railway: {
    bg: '#080e08',
    imgUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1080&q=80', // Railway tracks
    label: 'WILDLIFE // ELEPHANT',
    color: '#f59e0b',
    objects: [
      { x: 0.35, y: 0.40, w: 0.22, h: 0.30, label: 'ELEPHANT', conf: 94.2, cls: 'WILDLIFE' },
    ],
    gridColor: 'rgba(245,158,11,0.06)',
  },
  mining: {
    bg: '#0a0a0a',
    imgUrl: 'https://images.unsplash.com/photo-1519782558509-0d29d8a395b1?w=1080&q=80', // Excavator/Mining
    label: 'VEHICLE // EXCAVATOR',
    color: '#38bdf8',
    objects: [
      { x: 0.30, y: 0.50, w: 0.18, h: 0.22, label: 'EXCAVATOR', conf: 91.7, cls: 'ILLEGAL' },
      { x: 0.60, y: 0.55, w: 0.14, h: 0.18, label: 'TRUCK', conf: 88.3, cls: 'VEHICLE' },
    ],
    gridColor: 'rgba(56,189,248,0.05)',
  },
  checkpoint: {
    bg: '#080a0a',
    imgUrl: 'https://images.unsplash.com/photo-1612260655452-f19589d8916d?w=1080&q=80', // Night street / checkpoint
    label: 'VEHICLE // ARMORED',
    color: '#22c55e',
    objects: [
      { x: 0.38, y: 0.42, w: 0.26, h: 0.22, label: 'CAR', conf: 99.1, cls: 'AUTHORIZED' },
    ],
    gridColor: 'rgba(34,197,94,0.05)',
  },
  wildlife: {
    bg: '#090c09',
    imgUrl: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=1080&q=80', // Elephant in dark
    label: 'WILDLIFE // ELEPHANT',
    color: '#a855f7',
    objects: [
      { x: 0.45, y: 0.38, w: 0.25, h: 0.35, label: 'ELEPHANT', conf: 97.6, cls: 'WILDLIFE' },
    ],
    gridColor: 'rgba(168,85,247,0.06)',
  },
};

function YoloSimCanvas({ scenario = 'border', label = 'LIVE FEED', style }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const animRef = useRef(null);
  const bgImgRef = useRef(null);
  const scene = CHANNEL_SCENARIOS[scenario] || CHANNEL_SCENARIOS.border;

  // Load the background image
  useEffect(() => {
    if (scene.imgUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = scene.imgUrl;
      img.onload = () => { bgImgRef.current = img; };
    }
  }, [scene.imgUrl]);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    frameRef.current += 1;
    const t = frameRef.current;
    const now = new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' });

    // Background Image or Solid Color
    if (bgImgRef.current) {
      ctx.drawImage(bgImgRef.current, 0, 0, W, H);
      // Darken overlay for CCTV effect
      ctx.fillStyle = 'rgba(0,5,5,0.4)';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = scene.bg;
      ctx.fillRect(0, 0, W, H);
    }

    // Grid overlay
    ctx.strokeStyle = scene.gridColor;
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Simulated terrain noise (subtle)
    for (let i = 0; i < 80; i++) {
      const nx = Math.sin(i * 0.31 + t * 0.01) * W * 0.4 + W * 0.5;
      const ny = Math.cos(i * 0.17 + t * 0.008) * H * 0.4 + H * 0.5;
      ctx.fillStyle = 'rgba(100,150,100,0.04)';
      ctx.beginPath(); ctx.arc(nx, ny, Math.random() * 2 + 1, 0, Math.PI * 2); ctx.fill();
    }

    // Draw each detected object with YOLOv-style box
    scene.objects.forEach((obj, idx) => {
      // Slight jitter for realism
      const jx = Math.sin(t * 0.03 + idx * 1.7) * 6;
      const jy = Math.cos(t * 0.025 + idx * 2.3) * 4;

      const bx = obj.x * W + jx;
      const by = obj.y * H + jy;
      const bw = obj.w * W;
      const bh = obj.h * H;

      // Outer glow
      ctx.shadowColor = scene.color;
      ctx.shadowBlur = 12;

      // Bounding box
      ctx.strokeStyle = scene.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.shadowBlur = 0;

      // Corner marks (YOLO style)
      const cLen = 14;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bx, by + cLen); ctx.lineTo(bx, by); ctx.lineTo(bx + cLen, by);
      ctx.moveTo(bx + bw - cLen, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + cLen);
      ctx.moveTo(bx, by + bh - cLen); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + cLen, by + bh);
      ctx.moveTo(bx + bw - cLen, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - cLen);
      ctx.stroke();
      ctx.lineWidth = 1;

      // Label pill
      const labelText = `${obj.label} ${obj.conf.toFixed(1)}%`;
      ctx.font = 'bold 11px "Share Tech Mono", monospace';
      const textW = ctx.measureText(labelText).width;
      ctx.fillStyle = scene.color;
      ctx.fillRect(bx - 1, by - 22, textW + 14, 20);
      ctx.fillStyle = '#000';
      ctx.fillText(labelText, bx + 6, by - 7);

      // Class badge
      ctx.font = '9px "Share Tech Mono", monospace';
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(bx, by + bh + 2, bw, 16);
      ctx.fillStyle = scene.color;
      ctx.fillText(`[${obj.cls}]`, bx + 4, by + bh + 13);

      // Confidence bar
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(bx, by + bh + 20, bw, 4);
      ctx.fillStyle = scene.color;
      ctx.fillRect(bx, by + bh + 20, bw * (obj.conf / 100), 4);

      // Crosshair center
      const cx = bx + bw / 2;
      const cy = by + bh / 2;
      ctx.strokeStyle = `${scene.color}66`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - 12, cy); ctx.lineTo(cx + 12, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - 12); ctx.lineTo(cx, cy + 12); ctx.stroke();
      ctx.strokeRect(cx - 5, cy - 5, 10, 10);
    });

    // ── Scan line effect ──
    const scanY = ((t * 2) % H);
    const grad = ctx.createLinearGradient(0, scanY - 10, 0, scanY + 10);
    grad.addColorStop(0, 'rgba(34,197,94,0)');
    grad.addColorStop(0.5, 'rgba(34,197,94,0.07)');
    grad.addColorStop(1, 'rgba(34,197,94,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, scanY - 10, W, 20);

    // ── HUD Overlay ──
    // Top-left: channel info
    ctx.font = 'bold 11px "Share Tech Mono", monospace';
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(8, 8, 200, 20);
    ctx.fillStyle = '#22c55e';
    ctx.fillText(`● LIVE  ${label}`, 14, 22);

    // Top-right: timestamp
    const tsText = `${now}  IST`;
    ctx.font = '10px "Share Tech Mono", monospace';
    const tsW = ctx.measureText(tsText).width;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(W - tsW - 18, 8, tsW + 12, 18);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(tsText, W - tsW - 12, 21);

    // Bottom: YOLOv banner
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, H - 22, W, 22);
    ctx.font = '9px "Share Tech Mono", monospace';
    ctx.fillStyle = 'rgba(168,85,247,0.9)';
    ctx.fillText(`YOLOv8-TRT  |  AI DETECTION ENGINE  |  ${scene.objects.length} OBJECT(S) TRACKED  |  NEURAL INFERENCE ACTIVE`, 8, H - 7);

    // Blinking REC dot
    if (Math.floor(t / 30) % 2 === 0) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(W - 14, H - 11, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '8px "Share Tech Mono", monospace';
      ctx.fillStyle = '#ef4444';
      ctx.fillText('REC', W - 42, H - 7);
    }
  }, [scene, label]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 960;
      canvas.height = canvas.parentElement?.clientHeight || 540;
    };
    resize();
    window.addEventListener('resize', resize);
    
    let isActive = true;
    const loop = () => {
      if (!isActive) return;
      drawFrame();
      animRef.current = requestAnimationFrame(loop);
    };
    loop();
    
    return () => {
      isActive = false;
      window.removeEventListener('resize', resize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [drawFrame]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', ...style }} />;
}

// ═══════════════════════════════════════════════════
//  RealFeedVideo — Smart video player with:
//  • Primary URL attempt
//  • Automatic backup URL fallback
//  • YOLOv canvas simulation when both fail
// ═══════════════════════════════════════════════════
export default function RealFeedVideo({
  src,
  backupKey,
  scenario = 'border',
  className = '',
  style,
  children,
  label = 'LIVE FEED',
  videoRef: externalVideoRef
}) {
  const [state, setState] = useState('loading'); // loading | playing | backup | yolo
  const [reloadKey, setReloadKey] = useState(0);
  const [activeSrc, setActiveSrc] = useState(src);
  const internalVideoRef = useRef(null);
  const videoRef = externalVideoRef || internalVideoRef;
  const backupSrc = backupKey ? REAL_MEDIA_BACKUP[backupKey] : null;

  useEffect(() => {
    setActiveSrc(src);
    setState('loading');
    setReloadKey(k => k + 1);
  }, [src]);

  const handleError = () => {
    if (state === 'loading' && backupSrc && backupSrc !== activeSrc) {
      // Try backup URL
      setActiveSrc(backupSrc);
      setState('backup');
      setReloadKey(k => k + 1);
    } else {
      // Fall back to YOLOv simulation canvas
      setState('yolo');
    }
  };

  const handlePlaying = () => {
    setState('playing');
  };

  const retry = () => {
    setActiveSrc(src);
    setState('loading');
    setReloadKey(k => k + 1);
  };

  if (state === 'yolo') {
    return (
      <div className={`real-feed-video ${className}`} style={{ position: 'relative', ...style }}>
        <YoloSimCanvas scenario={scenario} label={label} style={{ width: '100%', height: '100%' }} />
        <div style={{
          position: 'absolute', top: 8, right: 8,
          background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(168,85,247,0.5)',
          borderRadius: 6, padding: '4px 10px', fontSize: '0.6rem',
          color: '#a855f7', fontFamily: "'Share Tech Mono', monospace",
          display: 'flex', alignItems: 'center', gap: 6
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a855f7', display: 'inline-block', animation: 'softPulse 1s infinite' }} />
          YOLOv SIM ACTIVE
        </div>
        <button
          onClick={retry}
          style={{
            position: 'absolute', bottom: 30, right: 8,
            background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(34,197,94,0.4)',
            borderRadius: 6, padding: '4px 10px', fontSize: '0.6rem',
            color: '#22c55e', fontFamily: "'Share Tech Mono', monospace",
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
          }}
        >
          <RefreshCw size={10} /> RETRY LIVE FEED
        </button>
        {children}
      </div>
    );
  }

  return (
    <div className={`real-feed-video ${className}`} style={{ position: 'relative', ...style }}>
      <video
        ref={videoRef}
        key={`${activeSrc}-${reloadKey}`}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        src={activeSrc || undefined}
        aria-label={label}
        onError={handleError}
        onPlaying={handlePlaying}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      {(state === 'loading' || state === 'backup') && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(5,10,8,0.85)', gap: 12
        }}>
          <div style={{
            width: 32, height: 32, border: '3px solid rgba(34,197,94,0.2)',
            borderTop: '3px solid #22c55e', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <div style={{ fontSize: '0.65rem', color: '#22c55e', fontFamily: "'Share Tech Mono', monospace" }}>
            {state === 'backup' ? 'SWITCHING TO BACKUP FEED...' : 'CONNECTING TO FEED...'}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
