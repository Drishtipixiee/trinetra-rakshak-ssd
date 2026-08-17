import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Train, AlertTriangle, Shield, Volume2, VolumeX, Eye, Radio,
  Layers, Camera, Gauge, Compass, Activity, Zap, Play, Square, RefreshCw
} from 'lucide-react';
import { playKlaxon, playDetectionBeep, playSuccessChime } from './AIVoiceSystem';

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
  const [camMode, setCamMode] = useState('CAB'); // 'CAB' | 'TRACKSIDE' | 'THERMAL'
  const [obstacleDistance, setObstacleDistance] = useState(1450); // meters
  const [trainSpeed, setTrainSpeed] = useState(110); // km/h
  const [brakeApplied, setBrakeApplied] = useState(false);
  const [hornActive, setHornActive] = useState(false);
  const [kavachStatus, setKavachStatus] = useState('ACTIVE');
  const [elephantPos, setElephantPos] = useState({ x: 48, y: 38, size: 1.0, state: 'CROSSING' });
  const [timeToImpact, setTimeToImpact] = useState(48);
  const [aiConfidence, setAiConfidence] = useState(96.4);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const tickRef = useRef(0);

  // Sound horn effect
  const triggerHorn = () => {
    setHornActive(true);
    if (addLog) addLog('[TRK-GUARD] Locomotive Dual-Tone Horn sounded (120dB acoustic deterrent).', 'warning');
    setTimeout(() => setHornActive(false), 2000);
  };

  // Autonomous Track Guard Loop
  useEffect(() => {
    if (!trackActive) {
      setTrainSpeed(110);
      setObstacleDistance(2000);
      setBrakeApplied(false);
      setTimeToImpact(65);
      return;
    }

    const interval = setInterval(() => {
      tickRef.current += 1;
      const t = tickRef.current % 120; // 120-second dynamic scenario loop

      // Phase 1: 0-15s: Clear Track high speed
      if (t < 15) {
        setTrainSpeed(prev => Math.min(115, prev + 1));
        setObstacleDistance(2000);
        setBrakeApplied(false);
        setElephantPos({ x: 120, y: 36, size: 0.6, state: 'OFF_TRACK' });
        setTimeToImpact(99);
      }
      // Phase 2: 15-35s: Elephant enters corridor at 1400m
      else if (t < 35) {
        const dist = Math.max(800, 1450 - (t - 15) * 35);
        setObstacleDistance(Math.round(dist));
        setElephantPos({ x: 55 - (t - 15) * 0.4, y: 36, size: 0.9, state: 'ENTERING' });
        const speedMs = trainSpeed * (5 / 18);
        const eti = speedMs > 0 ? Math.round(dist / speedMs) : 99;
        setTimeToImpact(eti);

        if (t === 16) {
          playDetectionBeep();
          if (addLog) addLog('[TRK-GUARD] ⚠ Laser LiDAR & AI Vision: Obstacle sighted at 1,450m. Class: ASIAN ELEPHANT (Adult)', 'warning');
          if (voiceRef?.current && voiceEnabled) {
            voiceRef.current.speak('Track Guard warning. Wild elephant detected on railway corridor Kilo Mike 142. Range 1,450 meters. Initiating Kavach collision avoidance assessment.', 'normal');
          }
        }
      }
      // Phase 3: 35-70s: Critical Range — Auto-Brake Kavach Triggered
      else if (t < 70) {
        setBrakeApplied(true);
        // Decelerate rapidly
        setTrainSpeed(prev => Math.max(12, prev - 2.8));
        const dist = Math.max(120, 800 - (t - 35) * 18);
        setObstacleDistance(Math.round(dist));
        setElephantPos({ x: 49 + Math.sin(t * 0.3) * 1.5, y: 36, size: 1.1, state: 'ON_TRACK' });
        const speedMs = Math.max(5, trainSpeed * (5 / 18));
        const eti = Math.round(dist / speedMs);
        setTimeToImpact(eti);

        if (t === 36) {
          playKlaxon();
          if (addLog) addLog('[TRK-GUARD] 🚨 KAVACH AUTO-BRAKE ENGAGED! Full emergency pneumatic dump applied. Train decelerating.', 'critical');
          if (logToSupabase) logToSupabase('TRACK-GUARD', 95, 'KAVACH AUTO-BRAKE: Elephant on track KM-142. Distance: 780m');
          if (voiceRef?.current && voiceEnabled) {
            voiceRef.current.speak('Critical alert! Kavach Automatic Train Protection engaged. Emergency braking initiated for Rajdhani Express 12042. Elephant crossing active rail line.', 'critical');
          }
        }
      }
      // Phase 4: 70-95s: Elephant safely crosses off track into jungle
      else if (t < 95) {
        setBrakeApplied(true);
        setTrainSpeed(prev => Math.min(25, Math.max(8, prev - 0.5)));
        setElephantPos({ x: 45 - (t - 70) * 1.2, y: 36, size: 1.0, state: 'EXITING' });
        setObstacleDistance(150);
        setTimeToImpact(45);

        if (t === 71) {
          if (addLog) addLog('[TRK-GUARD] 🐘 Elephant moving off track toward North forest reserve. Acoustic deterrent active.', 'safe');
        }
      }
      // Phase 5: 95-120s: Track Clear — Auto Brake Released
      else {
        setBrakeApplied(false);
        setTrainSpeed(prev => Math.min(90, prev + 2.5));
        setObstacleDistance(2000);
        setElephantPos({ x: -40, y: 36, size: 0.7, state: 'CLEARED' });
        setTimeToImpact(99);

        if (t === 96) {
          playSuccessChime();
          if (addLog) addLog('[TRK-GUARD] ✅ Track section KM-142 is ALL CLEAR. Brake released. Resuming corridor cruise speed.', 'safe');
          if (voiceRef?.current && voiceEnabled) {
            voiceRef.current.speak('Track Guard all clear. Corridor is clear of wildlife. Brake pressure restored. Resuming schedule.', 'normal');
          }
        }
      }

      setAiConfidence(94.5 + Math.sin(t * 0.5) * 3);
    }, 1000);

    return () => clearInterval(interval);
  }, [trackActive, trainSpeed, voiceEnabled, voiceRef, addLog, logToSupabase]);

  // High-Resolution 3D Canvas Perspective Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frameId;

    const render = () => {
      const W = canvas.width = canvas.parentElement?.clientWidth || 960;
      const H = canvas.height = canvas.parentElement?.clientHeight || 540;
      const t = Date.now() * 0.003;

      ctx.clearRect(0, 0, W, H);

      // ── 1. SKY & HORIZON ──────────────────────────────────────────
      const horizonY = H * 0.38;
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);

      if (camMode === 'THERMAL') {
        skyGrad.addColorStop(0, '#05021a');
        skyGrad.addColorStop(1, '#1b0933');
      } else {
        skyGrad.addColorStop(0, '#0a1a2f');
        skyGrad.addColorStop(0.6, '#132e42');
        skyGrad.addColorStop(1, '#2c4a3e');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, horizonY);

      // Distant Forest Hills
      ctx.fillStyle = camMode === 'THERMAL' ? '#2a0845' : '#0d2818';
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      for (let x = 0; x <= W; x += 30) {
        const hillH = Math.sin(x * 0.008 + 1) * 25 + Math.cos(x * 0.02) * 10;
        ctx.lineTo(x, horizonY - 15 - hillH);
      }
      ctx.lineTo(W, horizonY);
      ctx.closePath();
      ctx.fill();

      // ── 2. GROUND & BALLAST TERRAIN ──────────────────────────────
      const groundGrad = ctx.createLinearGradient(0, horizonY, 0, H);
      if (camMode === 'THERMAL') {
        groundGrad.addColorStop(0, '#100520');
        groundGrad.addColorStop(1, '#05010a');
      } else {
        groundGrad.addColorStop(0, '#1b281b');
        groundGrad.addColorStop(0.3, '#2a261e');
        groundGrad.addColorStop(1, '#1a1815');
      }
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, horizonY, W, H - horizonY);

      // Dense Jungle Trees on Left & Right Margins
      const drawForest = (isLeft) => {
        const sideMult = isLeft ? -1 : 1;
        const startX = isLeft ? 0 : W;
        for (let i = 0; i < 16; i++) {
          const depth = (i + (t * (trainSpeed / 80)) % 1) / 16;
          const treeY = horizonY + depth * (H - horizonY);
          const treeX = isLeft
            ? (W * 0.5) - (W * 0.5 - startX) * depth - (1 - depth) * 140
            : (W * 0.5) + (startX - W * 0.5) * depth + (1 - depth) * 140;
          const treeH = 30 + depth * 140;
          const treeW = 20 + depth * 70;

          ctx.fillStyle = camMode === 'THERMAL'
            ? `rgba(${40 + depth * 40}, ${10 + depth * 20}, ${70 + depth * 50}, 0.8)`
            : `rgba(${10 + i * 2}, ${40 + i * 4}, ${15 + i * 2}, 0.85)`;

          // Tree trunk
          ctx.fillRect(treeX - treeW * 0.1, treeY - treeH * 0.3, treeW * 0.2, treeH * 0.35);
          // Tree foliage canopy
          ctx.beginPath();
          ctx.arc(treeX, treeY - treeH * 0.6, treeW * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      };
      drawForest(true);
      drawForest(false);

      // ── 3. 3D RAILWAY TRACKS & PERSPECTIVE SLEEPERS ───────────────
      const vanishingX = W * 0.5;
      const vanishingY = horizonY;
      const trackBaseW = W * 0.44;

      // Ballast Gravel Bed
      ctx.fillStyle = camMode === 'THERMAL' ? '#200a30' : '#2b2622';
      ctx.beginPath();
      ctx.moveTo(vanishingX - 25, vanishingY);
      ctx.lineTo(vanishingX + 25, vanishingY);
      ctx.lineTo(vanishingX + trackBaseW * 0.65, H);
      ctx.lineTo(vanishingX - trackBaseW * 0.65, H);
      ctx.closePath();
      ctx.fill();

      // Moving Concrete Sleepers (Ties)
      const sleeperCount = 22;
      const speedOffset = (t * (trainSpeed * 0.08)) % 1;

      for (let i = 0; i < sleeperCount; i++) {
        const rawDepth = (i + speedOffset) / sleeperCount;
        const depth = Math.pow(rawDepth, 2.2); // Exponential perspective
        const y = vanishingY + depth * (H - vanishingY);
        const w = (trackBaseW * 0.55) * depth + 20 * (1 - depth);
        const h = Math.max(2, depth * 14);

        ctx.fillStyle = camMode === 'THERMAL'
          ? `rgba(180, 80, 50, ${0.3 + depth * 0.5})`
          : `rgba(90, 85, 80, ${0.4 + depth * 0.6})`;
        ctx.fillRect(vanishingX - w, y, w * 2, h);

        // Fastener clips
        ctx.fillStyle = '#111';
        ctx.fillRect(vanishingX - w * 0.72, y - 1, Math.max(2, depth * 5), h + 2);
        ctx.fillRect(vanishingX + w * 0.72 - depth * 5, y - 1, Math.max(2, depth * 5), h + 2);
      }

      // Steel Rails (Left and Right)
      const drawRail = (side) => {
        const railX_bottom = vanishingX + side * trackBaseW * 0.38;
        const railX_top = vanishingX + side * 8;

        // Rail shadow
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(railX_top, vanishingY);
        ctx.lineTo(railX_bottom + side * 4, H);
        ctx.stroke();

        // Steel Head Shine
        const railGrad = ctx.createLinearGradient(0, vanishingY, 0, H);
        if (camMode === 'THERMAL') {
          railGrad.addColorStop(0, '#551177');
          railGrad.addColorStop(1, '#ffaa33');
        } else {
          railGrad.addColorStop(0, '#888');
          railGrad.addColorStop(0.5, '#ddd');
          railGrad.addColorStop(1, '#fff');
        }
        ctx.strokeStyle = railGrad;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(railX_top, vanishingY);
        ctx.lineTo(railX_bottom, H);
        ctx.stroke();
      };
      drawRail(-1);
      drawRail(1);

      // Catenary Overhead Wires & Mast Poles
      for (let p = 0; p < 4; p++) {
        const mastDepth = Math.pow((p + (speedOffset * 0.25)) / 4, 2);
        const mastY = vanishingY + mastDepth * (H - vanishingY);
        const mastX = vanishingX + (trackBaseW * 0.8) * mastDepth + 40;
        const mastH = 120 * mastDepth + 20;

        ctx.strokeStyle = camMode === 'THERMAL' ? '#442266' : '#4a5568';
        ctx.lineWidth = Math.max(1, mastDepth * 4);
        // Vertical Mast
        ctx.beginPath();
        ctx.moveTo(mastX, mastY);
        ctx.lineTo(mastX, mastY - mastH);
        // Horizontal Cantilever Arm
        ctx.lineTo(vanishingX, mastY - mastH + 15);
        ctx.stroke();
      }

      // ── 4. REALISTIC GREY ASIAN ELEPHANT (WILDLIFE TARGET) ────────
      if (elephantPos.state !== 'CLEARED') {
        const eleX_norm = (elephantPos.x / 100) * W;
        const eleDepth = 0.38 + (1.0 - (obstacleDistance / 2000)) * 0.45;
        const eleY = vanishingY + eleDepth * (H - vanishingY) - 15;
        const scale = (0.5 + eleDepth * 1.6) * elephantPos.size;

        const eleW = 85 * scale;
        const eleH = 65 * scale;

        ctx.save();
        ctx.translate(eleX_norm, eleY);

        // Thermal color vs Realistic Natural Grey
        const bodyColor = camMode === 'THERMAL' ? '#ff3300' : '#4a4d52';
        const highlightColor = camMode === 'THERMAL' ? '#ffff33' : '#6b7077';
        const shadowColor = camMode === 'THERMAL' ? '#990000' : '#2c2e33';

        // Elephant Drop Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.ellipse(0, eleH * 0.45, eleW * 0.5, eleH * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hind & Front Legs with Walking Animation
        const walkCycle = Math.sin(t * 8) * 6 * scale;
        ctx.fillStyle = shadowColor;
        // Back legs
        ctx.fillRect(-eleW * 0.35, -eleH * 0.1, eleW * 0.16, eleH * 0.55 + walkCycle);
        ctx.fillRect(eleW * 0.15, -eleH * 0.1, eleW * 0.16, eleH * 0.55 - walkCycle);

        // Massive Body Torso
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.ellipse(-eleW * 0.1, -eleH * 0.15, eleW * 0.42, eleH * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();

        // Forehead & Head
        ctx.beginPath();
        ctx.arc(eleW * 0.28, -eleH * 0.3, eleH * 0.26, 0, Math.PI * 2);
        ctx.fill();

        // Large Ear with flap
        ctx.fillStyle = highlightColor;
        ctx.beginPath();
        ctx.ellipse(eleW * 0.18, -eleH * 0.28, eleW * 0.16, eleH * 0.24, Math.sin(t * 3) * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Long Trunk (moving naturally)
        const trunkSwing = Math.sin(t * 5) * 8 * scale;
        ctx.strokeStyle = bodyColor;
        ctx.lineWidth = eleW * 0.11;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(eleW * 0.36, -eleH * 0.2);
        ctx.quadraticCurveTo(eleW * 0.5 + trunkSwing, eleH * 0.05, eleW * 0.45 + trunkSwing * 1.3, eleH * 0.35);
        ctx.stroke();

        // White Ivory Tusks
        ctx.strokeStyle = camMode === 'THERMAL' ? '#ffffff' : '#f8f4e6';
        ctx.lineWidth = Math.max(2, 3 * scale);
        ctx.beginPath();
        ctx.moveTo(eleW * 0.32, -eleH * 0.12);
        ctx.quadraticCurveTo(eleW * 0.46, -eleH * 0.05, eleW * 0.52, -eleH * 0.18);
        ctx.stroke();

        // Near Legs
        ctx.fillStyle = bodyColor;
        ctx.fillRect(-eleW * 0.28, -eleH * 0.05, eleW * 0.16, eleH * 0.52 - walkCycle);
        ctx.fillRect(eleW * 0.22, -eleH * 0.05, eleW * 0.16, eleH * 0.52 + walkCycle);

        ctx.restore();

        // ── 5. REAL-TIME AI BOUNDING BOX & DISTANCE TELEMETRY ────────
        const bboxX = eleX_norm - eleW * 0.55;
        const bboxY = eleY - eleH * 0.65;
        const bboxW = eleW * 1.15;
        const bboxH = eleH * 1.15;

        const isCrit = obstacleDistance < 850;
        const boxColor = isCrit ? '#ef4444' : '#f59e0b';

        // Laser LiDAR Target Box
        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(bboxX, bboxY, bboxW, bboxH);

        // Corner Military Reticles
        const cLen = Math.min(bboxW, bboxH) * 0.25;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(bboxX, bboxY + cLen); ctx.lineTo(bboxX, bboxY); ctx.lineTo(bboxX + cLen, bboxY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bboxX + bboxW - cLen, bboxY); ctx.lineTo(bboxX + bboxW, bboxY); ctx.lineTo(bboxX + bboxW, bboxY + cLen); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bboxX, bboxY + bboxH - cLen); ctx.lineTo(bboxX, bboxY + bboxH); ctx.lineTo(bboxX + cLen, bboxY + bboxH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bboxX + bboxW - cLen, bboxY + bboxH); ctx.lineTo(bboxX + bboxW, bboxY + bboxH); ctx.lineTo(bboxX + bboxW, bboxY + bboxH - cLen); ctx.stroke();

        // Target Tag Header
        ctx.fillStyle = boxColor;
        ctx.fillRect(bboxX, bboxY - 22, bboxW, 20);
        ctx.fillStyle = '#000';
        ctx.font = 'bold 11px "Share Tech Mono", monospace';
        ctx.fillText(`🐘 ELEPHANT [${aiConfidence.toFixed(1)}%] • ${obstacleDistance}m`, bboxX + 6, bboxY - 8);

        // Distance Leader Line & Ground Range
        ctx.strokeStyle = `rgba(${isCrit ? '239,68,68' : '245,158,11'}, 0.6)`;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(eleX_norm, bboxY + bboxH);
        ctx.lineTo(vanishingX, H - 40);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // ── 6. LOCOMOTIVE WINDSHIELD CAB OVERLAY (When in CAB Mode) ──
      if (camMode === 'CAB') {
        // Windshield Pillar Left & Right
        ctx.fillStyle = '#11161b';
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(W * 0.12, 0); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(W, 0); ctx.lineTo(W * 0.88, 0); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();

        // Locomotive Dash Console
        const dashGrad = ctx.createLinearGradient(0, H - 75, 0, H);
        dashGrad.addColorStop(0, '#151d24');
        dashGrad.addColorStop(1, '#0b0f14');
        ctx.fillStyle = dashGrad;
        ctx.fillRect(0, H - 75, W, 75);
        ctx.strokeStyle = '#2d3748';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, H - 75, W, 75);

        // Cab Glass Reflection
        const glassGrad = ctx.createLinearGradient(0, 0, W, H);
        glassGrad.addColorStop(0, 'rgba(255,255,255,0.06)');
        glassGrad.addColorStop(0.3, 'transparent');
        glassGrad.addColorStop(0.7, 'rgba(56,189,248,0.03)');
        ctx.fillStyle = glassGrad;
        ctx.fillRect(0, 0, W, H - 75);
      }

      // ── 7. SCANLINES & TACTICAL HUD OVERLAYS ──────────────────────
      const scanY = (t * 60) % H;
      ctx.fillStyle = 'rgba(34, 197, 94, 0.04)';
      ctx.fillRect(0, scanY, W, 4);

      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, [camMode, obstacleDistance, trainSpeed, elephantPos, aiConfidence]);

  return (
    <motion.div
      key="track-guard-real"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, padding: 12, overflowY: 'auto' }}
    >
      {/* ── HEADER & CAMERA ANGLE SELECTOR ──────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.6)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: '10px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ padding: 8, background: 'rgba(34,197,94,0.15)', border: '1px solid var(--accent)', borderRadius: 8, color: 'var(--accent)' }}>
            <Train size={20} />
          </div>
          <div>
            <div style={{ fontFamily: "'Share Tech Mono'", fontSize: '1rem', color: 'var(--accent)', fontWeight: 'bold', letterSpacing: 2 }}>
              TRACK-GUARD // RAILWAY WILDLIFE OVERWATCH
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
              Locomotive AI Telemetry • Rajdhani Express #12042 • Section KM-142 (Jharkhand Elephant Corridor)
            </div>
          </div>
        </div>

        {/* Camera Views & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setCamMode('CAB')}
            style={{
              background: camMode === 'CAB' ? 'rgba(34,197,94,0.2)' : 'transparent',
              border: `1px solid ${camMode === 'CAB' ? 'var(--accent)' : '#334155'}`,
              color: camMode === 'CAB' ? 'var(--accent)' : '#94a3b8',
              padding: '6px 12px', borderRadius: 6, fontSize: '0.65rem', fontFamily: "'Share Tech Mono'", cursor: 'pointer'
            }}
          >
            CAB VIEW
          </button>
          <button
            onClick={() => setCamMode('TRACKSIDE')}
            style={{
              background: camMode === 'TRACKSIDE' ? 'rgba(56,189,248,0.2)' : 'transparent',
              border: `1px solid ${camMode === 'TRACKSIDE' ? '#38bdf8' : '#334155'}`,
              color: camMode === 'TRACKSIDE' ? '#38bdf8' : '#94a3b8',
              padding: '6px 12px', borderRadius: 6, fontSize: '0.65rem', fontFamily: "'Share Tech Mono'", cursor: 'pointer'
            }}
          >
            TRACKSIDE MAST
          </button>
          <button
            onClick={() => setCamMode('THERMAL')}
            style={{
              background: camMode === 'THERMAL' ? 'rgba(168,85,247,0.2)' : 'transparent',
              border: `1px solid ${camMode === 'THERMAL' ? '#a855f7' : '#334155'}`,
              color: camMode === 'THERMAL' ? '#a855f7' : '#94a3b8',
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
            {trackActive ? <><Square size={14} /> STOP TRACK SCAN</> : <><Play size={14} /> START TRACK AI</>}
          </button>
        </div>
      </div>

      {/* ── MAIN HIGH-RES 3D OVERWATCH CANVAS ───────────────────── */}
      <div style={{ position: 'relative', height: '420px', borderRadius: 12, overflow: 'hidden', border: `2px solid ${brakeApplied ? '#ef4444' : 'var(--glass-border)'}`, boxShadow: brakeApplied ? '0 0 35px rgba(239,68,68,0.3)' : '0 8px 32px rgba(0,0,0,0.6)' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

        {/* Top HUD Badges */}
        <div style={{ position: 'absolute', top: 12, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ background: 'rgba(0,0,0,0.85)', border: '1px solid var(--glass-border)', padding: '4px 10px', borderRadius: 6, fontSize: '0.65rem', fontFamily: "'Share Tech Mono'", color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'softPulse 1s infinite' }} />
              OPTICAL SENSOR MAST #142 • LIVE
            </div>
            <div style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid #a855f7', padding: '4px 10px', borderRadius: 6, fontSize: '0.65rem', fontFamily: "'Share Tech Mono'", color: '#c084fc' }}>
              TF.js COCO-SSD MOBILENET_V2 • ACTIVE
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ background: brakeApplied ? 'rgba(239,68,68,0.9)' : 'rgba(0,0,0,0.85)', border: `1px solid ${brakeApplied ? '#fff' : '#334155'}`, padding: '4px 12px', borderRadius: 6, fontSize: '0.7rem', fontFamily: "'Share Tech Mono'", fontWeight: 'bold', color: '#fff' }}>
              {brakeApplied ? '🚨 KAVACH ATP: AUTO-BRAKE ENGAGED' : 'KAVACH ATP: MONITORING'}
            </div>
          </div>
        </div>

        {/* Emergency Brake Alert Banner on Canvas */}
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
              <AlertTriangle size={28} color="#fff" style={{ animation: 'blink 0.5s infinite' }} />
              <div>
                <div style={{ color: '#fff', fontSize: '1rem', fontWeight: 'bold', fontFamily: "'Share Tech Mono'", letterSpacing: 1 }}>
                  WILDLIFE OBSTRUCTION ON ACTIVE TRACK
                </div>
                <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.7rem' }}>
                  Distance: {obstacleDistance}m • Decelerating to avoid impact • Cab Signal RED
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Interactive Dashboard Overlays */}
        <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          {/* Horn and Override Buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={triggerHorn}
              style={{
                background: hornActive ? '#f59e0b' : 'rgba(0,0,0,0.8)',
                border: '1px solid #f59e0b',
                color: hornActive ? '#000' : '#f59e0b',
                padding: '8px 16px', borderRadius: 8, fontSize: '0.75rem', fontFamily: "'Share Tech Mono'", fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: hornActive ? '0 0 20px #f59e0b' : 'none'
              }}
            >
              <Volume2 size={16} /> {hornActive ? 'SOUNDING HORN (120dB)...' : 'BLOW ACOUSTIC HORN'}
            </button>
          </div>

          {/* GPS Coordinates */}
          <div style={{ background: 'rgba(0,0,0,0.85)', padding: '6px 12px', borderRadius: 6, border: '1px solid var(--glass-border)', fontSize: '0.65rem', fontFamily: "'Share Tech Mono'", color: 'var(--text-dim)' }}>
            GPS: 23°37'12"N 85°16'47"E • TRACK KM-142.8 • GRADIENT: +0.2%
          </div>
        </div>
      </div>

      {/* ── TELEMETRY & SENSOR METRIC TILES ────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {/* Speed Dial */}
        <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: 'var(--text-dim)' }}>
            <span><Gauge size={13} style={{ verticalAlign: 'middle' }} /> LOCOMOTIVE SPEED</span>
            <span style={{ color: brakeApplied ? '#ef4444' : 'var(--accent)' }}>{brakeApplied ? 'BRAKING' : 'CRUISING'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 'bold', fontFamily: "'Share Tech Mono'", color: brakeApplied ? '#ef4444' : 'var(--accent)' }}>
              {trainSpeed}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>KM / H</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', height: 5, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${(trainSpeed / 130) * 100}%`, height: '100%', background: brakeApplied ? '#ef4444' : 'var(--accent)', transition: 'width 0.4s' }} />
          </div>
        </div>

        {/* Distance to Obstacle */}
        <div style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${obstacleDistance < 800 ? 'rgba(239,68,68,0.5)' : 'var(--glass-border)'}`, borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
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
          <div style={{ background: 'rgba(255,255,255,0.1)', height: 5, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, (obstacleDistance / 2000) * 100)}%`, height: '100%', background: obstacleDistance < 800 ? '#ef4444' : '#38bdf8', transition: 'width 0.4s' }} />
          </div>
        </div>

        {/* Estimated Time to Impact */}
        <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
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
          <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>
            Braking distance required: {Math.round((Math.pow(trainSpeed * (5/18), 2)) / (2 * 1.2))}m
          </div>
        </div>

        {/* Pneumatic Cylinder Pressure */}
        <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: 'var(--text-dim)' }}>
            <span><Zap size={13} style={{ verticalAlign: 'middle' }} /> BRAKE CYLINDER PIPE</span>
            <span style={{ color: brakeApplied ? '#ef4444' : '#22c55e' }}>{brakeApplied ? 'VENTED' : 'CHARGED'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 'bold', fontFamily: "'Share Tech Mono'", color: brakeApplied ? '#ef4444' : '#22c55e' }}>
              {brakeApplied ? '3.8' : '5.0'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>BAR (kg/cm²)</span>
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>
            Kavach ATP Electronic Subsystem: Synced
          </div>
        </div>
      </div>
    </motion.div>
  );
}
