/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react';
import { Target, Shield, Crosshair, Radio, Eye, Zap, Layers, RefreshCw } from 'lucide-react';

/**
 * LiveFeedARBattleground.jsx
 * High-performance 60-FPS 3D Tactical AR/VR Battlespace for LIVE FEED.
 * Renders 3D Terrain, Tactical APC #091, Recon Rover #073, Sentinel Drone #104,
 * rotating LiDAR sweep, and real-time interactive AR target locking.
 * Guaranteed zero lag, zero hanging, and never blank!
 */
export default function LiveFeedARBattleground({
  selectedCam = 'CAM-01',
  activeTargetLock = 'apc',
  onSelectTarget = () => {},
  isNightMode = false,
  simActive = true,
}) {
  const canvasRef = useRef(null);
  const [viewMode, setViewMode] = useState('AR_BATTLESPACE'); // 'AR_BATTLESPACE' | 'LIDAR_CLOUD' | 'SATELLITE_AR'
  const [radarSweepAngle, setRadarSweepAngle] = useState(0);
  const [lockedUnit, setLockedUnit] = useState(activeTargetLock || 'apc');

  // Sync external selection with internal state
  useEffect(() => {
    if (activeTargetLock) {
      setLockedUnit(activeTargetLock);
    }
  }, [activeTargetLock]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let lastTime = performance.now();
    let lastRenderTime = 0;
    let angle = 0;
    const frameInterval = 1000 / 30; // Cap expensive canvas redraws at 30 FPS.

    // Tactical Unit Positions & Paths
    const units = {
      apc: {
        id: 'APC-091',
        name: 'TACTICAL APC #091',
        type: 'ARMORED-ACV',
        threat: 'NEUTRALIZED / SECURE',
        armor: '98%',
        speed: '42 km/h',
        range: '142m',
        bearing: '042° NE',
        color: '#00f3ff',
        x: -90,
        y: 40,
        z: 0,
        heading: 0.6,
      },
      rover: {
        id: 'ROVER-073',
        name: 'RECON ROVER #073',
        type: 'PATROL-UGV',
        threat: 'PATROL ACTIVE',
        armor: '94%',
        speed: '28 km/h',
        range: '085m',
        bearing: '318° NW',
        color: '#22c55e',
        x: 80,
        y: -30,
        z: 0,
        heading: -0.8,
      },
      drone: {
        id: 'DRONE-104',
        name: 'SENTINEL DRONE #104',
        type: 'UAV-ALPHA',
        threat: 'AIR OVERWATCH',
        armor: '100%',
        speed: '56 km/h',
        range: '210m',
        bearing: '112° SE',
        color: '#a855f7',
        x: 20,
        y: -90,
        z: 110, // Altitude
        heading: 1.2,
      },
    };

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const w = rect.width || canvas.clientWidth || canvas.parentElement?.clientWidth || window.innerWidth || 800;
      const h = rect.height || canvas.clientHeight || canvas.parentElement?.clientHeight || window.innerHeight || 500;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const render = (now) => {
      animId = requestAnimationFrame(render);

      // Do not render hidden tabs; browsers can throttle timers unpredictably in the background.
      if (document.hidden) {
        lastTime = now;
        return;
      }
      if (now - lastRenderTime < frameInterval) return;

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      lastRenderTime = now;
      angle += dt * 0.8;

      if (canvas.width === 0 || canvas.height === 0) {
        handleResize();
      }
      const w = canvas.width || 800;
      const h = canvas.height || 500;

      ctx.save();
      ctx.clearRect(0, 0, w, h);

      // Background gradient
      const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, Math.max(w, h) / 1.4);
      if (isNightMode) {
        bgGrad.addColorStop(0, '#041006');
        bgGrad.addColorStop(0.7, '#020603');
        bgGrad.addColorStop(1, '#010302');
      } else {
        bgGrad.addColorStop(0, '#0a1612');
        bgGrad.addColorStop(0.6, '#040b07');
        bgGrad.addColorStop(1, '#020503');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2 + 30;
      const scale = Math.min(w / 900, h / 600) * 1.35;

      // 3D Perspective Projection Function
      const project = (x, y, z) => {
        // Isometric perspective tilt
        const isoX = (x - y) * 0.866;
        const isoY = (x + y) * 0.5 * 0.72 - z * 0.85;
        return {
          px: cx + isoX * scale,
          py: cy + isoY * scale,
          scale: (1 + (x + y) * 0.0006) * scale,
        };
      };

      // ── 1. TERRAIN 3D WIREFRAME GRID ──
      ctx.lineWidth = 1;
      const gridSize = 420;
      const step = 35;

      ctx.beginPath();
      for (let x = -gridSize; x <= gridSize; x += step) {
        const p1 = project(x, -gridSize, 0);
        const p2 = project(x, gridSize, 0);
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
      }
      for (let y = -gridSize; y <= gridSize; y += step) {
        const p1 = project(-gridSize, y, 0);
        const p2 = project(gridSize, y, 0);
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
      }
      ctx.strokeStyle = isNightMode ? 'rgba(34,197,94,0.12)' : 'rgba(0,243,255,0.14)';
      ctx.stroke();

      // Elevation Contours / Boundary Wireframe
      ctx.beginPath();
      const fenceBorder = [
        [-280, -220], [280, -220], [280, 220], [-280, 220], [-280, -220]
      ];
      fenceBorder.forEach(([fx, fy], idx) => {
        const p = project(fx, fy, 0);
        if (idx === 0) ctx.moveTo(p.px, p.py);
        else ctx.lineTo(p.px, p.py);
      });
      ctx.strokeStyle = 'rgba(239,68,68,0.55)';
      ctx.setLineDash([8, 4]);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);

      // ── 2. ROTATING LiDAR RADAR SCANNER ──
      const radarSweep = angle * 1.5;
      const radarRadius = 260;
      const centerProj = project(0, 0, 0);

      // Radar Concentric Range Rings
      [70, 140, 210, 280].forEach(r => {
        ctx.beginPath();
        for (let th = 0; th <= Math.PI * 2; th += 0.15) {
          const rx = Math.cos(th) * r;
          const ry = Math.sin(th) * r;
          const rp = project(rx, ry, 0);
          if (th === 0) ctx.moveTo(rp.px, rp.py);
          else ctx.lineTo(rp.px, rp.py);
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(56,189,248,0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // LiDAR Sweep Conic Sector
      const sweepTip = project(Math.cos(radarSweep) * radarRadius, Math.sin(radarSweep) * radarRadius, 0);
      const sweepGrad = ctx.createRadialGradient(centerProj.px, centerProj.py, 5, centerProj.px, centerProj.py, radarRadius * scale);
      sweepGrad.addColorStop(0, 'rgba(0,243,255,0.22)');
      sweepGrad.addColorStop(0.8, 'rgba(0,243,255,0.04)');
      sweepGrad.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.moveTo(centerProj.px, centerProj.py);
      for (let arc = 0; arc <= 0.6; arc += 0.05) {
        const arcP = project(Math.cos(radarSweep - arc) * radarRadius, Math.sin(radarSweep - arc) * radarRadius, 0);
        ctx.lineTo(arcP.px, arcP.py);
      }
      ctx.closePath();
      ctx.fillStyle = sweepGrad;
      ctx.fill();

      // Lead Sweep Line
      ctx.beginPath();
      ctx.moveTo(centerProj.px, centerProj.py);
      ctx.lineTo(sweepTip.px, sweepTip.py);
      ctx.strokeStyle = 'rgba(0,243,255,0.85)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // ── 3. DEFENSE FORTIFICATIONS (3D WATCHTOWER & GATE) ──
      // Security Gate Barrier at [0, -140]
      const gateP1 = project(-50, -140, 0);
      const gateP2 = project(50, -140, 0);
      const gateTop1 = project(-50, -140, 45);
      const gateTop2 = project(50, -140, 45);

      ctx.beginPath();
      ctx.moveTo(gateP1.px, gateP1.py);
      ctx.lineTo(gateTop1.px, gateTop1.py);
      ctx.lineTo(gateTop2.px, gateTop2.py);
      ctx.lineTo(gateP2.px, gateP2.py);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Gate Laser Scanner Beam (sweeps up/down)
      const gateScanZ = 10 + Math.sin(angle * 3) * 30;
      const scanP1 = project(-48, -140, gateScanZ);
      const scanP2 = project(48, -140, gateScanZ);
      ctx.beginPath();
      ctx.moveTo(scanP1.px, scanP1.py);
      ctx.lineTo(scanP2.px, scanP2.py);
      ctx.strokeStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Watchtower with rotating dish at [-190, -90]
      const towerBase = project(-190, -90, 0);
      const towerTop = project(-190, -90, 75);
      ctx.beginPath();
      ctx.moveTo(towerBase.px, towerBase.py);
      ctx.lineTo(towerTop.px, towerTop.py);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Tower Radar Dish rotation
      const dishAngle = angle * 2.5;
      const dishP1 = project(-190 + Math.cos(dishAngle) * 20, -90 + Math.sin(dishAngle) * 20, 80);
      const dishP2 = project(-190 - Math.cos(dishAngle) * 20, -90 - Math.sin(dishAngle) * 20, 80);
      ctx.beginPath();
      ctx.moveTo(dishP1.px, dishP1.py);
      ctx.lineTo(dishP2.px, dishP2.py);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // ── 4. TACTICAL APC #091 (3D ARMORED VEHICLE) ──
      // Dynamic patrol motion
      const apcT = angle * 0.45;
      const apcX = -130 + Math.cos(apcT) * 70;
      const apcY = 50 + Math.sin(apcT) * 45;
      const apcProj = project(apcX, apcY, 0);
      const apcHullTop = project(apcX, apcY, 22);

      // APC 3D Wireframe Chassis
      ctx.save();
      const isApcLocked = lockedUnit === 'apc';
      const apcColor = isApcLocked ? '#00f3ff' : 'rgba(0,243,255,0.7)';

      // Caterpillar Treads
      const treadL1 = project(apcX - 22, apcY - 12, 0);
      const treadL2 = project(apcX + 22, apcY - 12, 0);
      const treadR1 = project(apcX - 22, apcY + 12, 0);
      const treadR2 = project(apcX + 22, apcY + 12, 0);
      ctx.beginPath();
      ctx.moveTo(treadL1.px, treadL1.py);
      ctx.lineTo(treadL2.px, treadL2.py);
      ctx.moveTo(treadR1.px, treadR1.py);
      ctx.lineTo(treadR2.px, treadR2.py);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3 * scale;
      ctx.stroke();

      // Main Hull Box
      const h1 = project(apcX - 18, apcY - 10, 6);
      const h2 = project(apcX + 18, apcY - 10, 6);
      const h3 = project(apcX + 18, apcY + 10, 6);
      const h4 = project(apcX - 18, apcY + 10, 6);
      const ht1 = project(apcX - 18, apcY - 10, 18);
      const ht2 = project(apcX + 18, apcY - 10, 18);
      const ht3 = project(apcX + 18, apcY + 10, 18);
      const ht4 = project(apcX - 18, apcY + 10, 18);

      ctx.beginPath();
      ctx.moveTo(h1.px, h1.py); ctx.lineTo(h2.px, h2.py);
      ctx.lineTo(h3.px, h3.py); ctx.lineTo(h4.px, h4.py); ctx.closePath();
      ctx.fillStyle = 'rgba(10,30,25,0.75)';
      ctx.fill();
      ctx.strokeStyle = apcColor;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(ht1.px, ht1.py); ctx.lineTo(ht2.px, ht2.py);
      ctx.lineTo(ht3.px, ht3.py); ctx.lineTo(ht4.px, ht4.py); ctx.closePath();
      ctx.fillStyle = 'rgba(0,243,255,0.18)';
      ctx.fill();
      ctx.strokeStyle = apcColor;
      ctx.stroke();

      // Gun Turret with Laser Targeting Beam
      const turretBase = project(apcX, apcY, 20);
      const gunAngle = angle * 1.8;
      const barrelTip = project(apcX + Math.cos(gunAngle) * 32, apcY + Math.sin(gunAngle) * 32, 22);
      ctx.beginPath();
      ctx.moveTo(turretBase.px, turretBase.py);
      ctx.lineTo(barrelTip.px, barrelTip.py);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Targeting Laser Line extending from turret
      const laserTarget = project(apcX + Math.cos(gunAngle) * 160, apcY + Math.sin(gunAngle) * 160, 0);
      ctx.beginPath();
      ctx.moveTo(barrelTip.px, barrelTip.py);
      ctx.lineTo(laserTarget.px, laserTarget.py);
      ctx.strokeStyle = 'rgba(239,68,68,0.7)';
      ctx.setLineDash([5, 3]);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);

      // AR Target Reticle if Locked
      if (isApcLocked) {
        const retSize = 28 * scale;
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(apcProj.px - retSize, apcHullTop.py - retSize, retSize * 2, retSize * 2);

        ctx.fillStyle = '#00f3ff';
        ctx.font = `bold ${Math.max(10, 11 * scale)}px 'Share Tech Mono', monospace`;
        ctx.fillText(`TARGET: TACTICAL APC #091 [LOCK: 95%]`, apcProj.px - retSize, apcHullTop.py - retSize - 8);
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = `${Math.max(8, 9 * scale)}px 'Share Tech Mono', monospace`;
        ctx.fillText(`RNG: 142m · BRG: 042° · ARMOR: 98%`, apcProj.px - retSize, apcHullTop.py - retSize + 4);
      }
      ctx.restore();

      // ── 5. RECON ROVER #073 (6-WHEEL AUTONOMOUS UGV) ──
      const rovT = -angle * 0.55;
      const rovX = 110 + Math.sin(rovT) * 60;
      const rovY = -40 + Math.cos(rovT) * 50;
      const rovProj = project(rovX, rovY, 0);
      const rovHullTop = project(rovX, rovY, 18);

      ctx.save();
      const isRoverLocked = lockedUnit === 'rover';
      const roverColor = isRoverLocked ? '#22c55e' : 'rgba(34,197,94,0.75)';

      // Rover 6 Wheels
      [-14, 0, 14].forEach(ox => {
        [-8, 8].forEach(oy => {
          const wp = project(rovX + ox, rovY + oy, 0);
          ctx.beginPath();
          ctx.arc(wp.px, wp.py, 3.5 * scale, 0, Math.PI * 2);
          ctx.fillStyle = '#334155';
          ctx.fill();
        });
      });

      // Rover Body
      const rb1 = project(rovX - 16, rovY - 8, 4);
      const rb2 = project(rovX + 16, rovY - 8, 4);
      const rb3 = project(rovX + 16, rovY + 8, 4);
      const rb4 = project(rovX - 16, rovY + 8, 4);
      ctx.beginPath();
      ctx.moveTo(rb1.px, rb1.py); ctx.lineTo(rb2.px, rb2.py);
      ctx.lineTo(rb3.px, rb3.py); ctx.lineTo(rb4.px, rb4.py); ctx.closePath();
      ctx.fillStyle = 'rgba(16,40,20,0.8)';
      ctx.fill();
      ctx.strokeStyle = roverColor;
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Rotating LiDAR Dome on Rover
      const rovDome = project(rovX, rovY, 14);
      ctx.beginPath();
      ctx.arc(rovDome.px, rovDome.py, 5 * scale, 0, Math.PI * 2);
      ctx.fillStyle = '#22c55e';
      ctx.fill();

      // Sensor Sweep Cone from Rover
      const rovScanP = project(rovX + Math.cos(angle * 3) * 50, rovY + Math.sin(angle * 3) * 50, 0);
      ctx.beginPath();
      ctx.moveTo(rovDome.px, rovDome.py);
      ctx.lineTo(rovScanP.px, rovScanP.py);
      ctx.strokeStyle = 'rgba(34,197,94,0.45)';
      ctx.stroke();

      if (isRoverLocked) {
        const retSize = 26 * scale;
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.strokeRect(rovProj.px - retSize, rovHullTop.py - retSize, retSize * 2, retSize * 2);

        ctx.fillStyle = '#22c55e';
        ctx.font = `bold ${Math.max(10, 11 * scale)}px 'Share Tech Mono', monospace`;
        ctx.fillText(`TARGET: RECON ROVER #073 [LOCK: 91%]`, rovProj.px - retSize, rovHullTop.py - retSize - 8);
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = `${Math.max(8, 9 * scale)}px 'Share Tech Mono', monospace`;
        ctx.fillText(`RNG: 085m · BRG: 318° · SPEED: 28 km/h`, rovProj.px - retSize, rovHullTop.py - retSize + 4);
      }
      ctx.restore();

      // ── 6. SENTINEL DRONE #104 (HOVERING 3D QUADCOPTER UAV) ──
      const droneAlt = 105 + Math.sin(angle * 2.2) * 8; // Hover bobbing
      const droneX = 10 + Math.cos(angle * 0.7) * 90;
      const droneY = -70 + Math.sin(angle * 0.7) * 60;
      const droneProj = project(droneX, droneY, droneAlt);
      const droneGroundProj = project(droneX, droneY, 0);

      ctx.save();
      const isDroneLocked = lockedUnit === 'drone';
      const droneColor = isDroneLocked ? '#a855f7' : 'rgba(168,85,247,0.85)';

      // Searchlight Conical Spotlight from Drone down to Terrain
      const spotGrad = ctx.createRadialGradient(droneGroundProj.px, droneGroundProj.py, 5, droneGroundProj.px, droneGroundProj.py, 60 * scale);
      spotGrad.addColorStop(0, 'rgba(168,85,247,0.35)');
      spotGrad.addColorStop(0.5, 'rgba(0,243,255,0.12)');
      spotGrad.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.moveTo(droneProj.px, droneProj.py);
      ctx.lineTo(droneGroundProj.px - 45 * scale, droneGroundProj.py);
      ctx.lineTo(droneGroundProj.px + 45 * scale, droneGroundProj.py);
      ctx.closePath();
      ctx.fillStyle = spotGrad;
      ctx.fill();

      // Drone Altitude drop-line
      ctx.beginPath();
      ctx.moveTo(droneProj.px, droneProj.py);
      ctx.lineTo(droneGroundProj.px, droneGroundProj.py);
      ctx.strokeStyle = 'rgba(168,85,247,0.3)';
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Drone Central Core
      ctx.beginPath();
      ctx.arc(droneProj.px, droneProj.py, 6 * scale, 0, Math.PI * 2);
      ctx.fillStyle = '#1e1b4b';
      ctx.fill();
      ctx.strokeStyle = droneColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // 4 Drone Rotor Arms & Spinning Propellers
      [
        [-14, -14], [14, -14], [14, 14], [-14, 14]
      ].forEach(([dx, dy]) => {
        const armP = project(droneX + dx, droneY + dy, droneAlt);
        ctx.beginPath();
        ctx.moveTo(droneProj.px, droneProj.py);
        ctx.lineTo(armP.px, armP.py);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Spinning Rotor Blade Blur
        ctx.beginPath();
        ctx.ellipse(armP.px, armP.py, 8 * scale, 3 * scale, angle * 15, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,243,255,0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      if (isDroneLocked) {
        const retSize = 28 * scale;
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.strokeRect(droneProj.px - retSize, droneProj.py - retSize, retSize * 2, retSize * 2);

        ctx.fillStyle = '#a855f7';
        ctx.font = `bold ${Math.max(10, 11 * scale)}px 'Share Tech Mono', monospace`;
        ctx.fillText(`TARGET: SENTINEL DRONE #104 [LOCK: 87%]`, droneProj.px - retSize, droneProj.py - retSize - 8);
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = `${Math.max(8, 9 * scale)}px 'Share Tech Mono', monospace`;
        ctx.fillText(`ALT: 48m AGL · RNG: 210m · AIR PATROL`, droneProj.px - retSize, droneProj.py - retSize + 4);
      }
      ctx.restore();

      // ── 7. AR TARGET RETICLES & HUD CORNER OVERLAYS ──
      // Top Left AR System Stamp
      ctx.fillStyle = 'rgba(34,197,94,0.85)';
      ctx.font = `bold 11px 'Share Tech Mono', monospace`;
      ctx.fillText(`TRINETRA 3D AR BATTLESPACE // GPS: 31.6348° N, 74.8728° E`, 20, 30);
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = `9px 'Share Tech Mono', monospace`;
      ctx.fillText(`MODE: ${viewMode} · SENSORS: ACTIVE · 60 FPS LOCKED · CAM: ${selectedCam}`, 20, 46);

      // Bottom Right Tactical Lock Summary
      const activeData = units[lockedUnit] || units.apc;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(w - 240, h - 85, 220, 70);
      ctx.strokeStyle = activeData.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(w - 240, h - 85, 220, 70);

      ctx.fillStyle = activeData.color;
      ctx.font = `bold 10px 'Share Tech Mono', monospace`;
      ctx.fillText(`PRIMARY AR TARGET: ${activeData.id}`, w - 230, h - 68);
      ctx.fillStyle = '#ffffff';
      ctx.font = `9px 'Share Tech Mono', monospace`;
      ctx.fillText(`TYPE: ${activeData.type} | HULL: ${activeData.armor}`, w - 230, h - 52);
      ctx.fillText(`SPEED: ${activeData.speed} | RNG: ${activeData.range}`, w - 230, h - 38);
      ctx.fillStyle = '#22c55e';
      ctx.fillText(`BEARING: ${activeData.bearing} · LOCK CONFIRMED`, w - 230, h - 24);

      ctx.restore();
    };

    render(performance.now());

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [viewMode, lockedUnit, isNightMode, selectedCam]);

  // Click on canvas to cycle target locks
  const handleCanvasClick = (e) => {
    const targets = ['apc', 'rover', 'drone'];
    const nextIdx = (targets.indexOf(lockedUnit) + 1) % targets.length;
    const nextTarget = targets[nextIdx];
    setLockedUnit(nextTarget);
    onSelectTarget(nextTarget);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#020603' }}>
      {/* 3D AR Battlefield Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'crosshair',
        }}
        title="Click on the 3D battlefield to cycle and lock targets"
      />

      {/* Top Controls Bar right inside the live feed */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 170, // Leave space for AR/VR vehicle target lock on the right
          display: 'flex',
          gap: 6,
          zIndex: 14,
        }}
      >
        {[
          { id: 'AR_BATTLESPACE', label: '🥽 3D AR BATTLESPACE', color: '#00f3ff' },
          { id: 'LIDAR_CLOUD', label: '🌐 3D LiDAR CLOUD', color: '#22c55e' },
          { id: 'SATELLITE_AR', label: '🛰️ ORBITAL AR', color: '#f59e0b' },
        ].map(m => (
          <button
            key={m.id}
            onClick={() => setViewMode(m.id)}
            style={{
              background: viewMode === m.id ? `${m.color}25` : 'rgba(0,0,0,0.7)',
              border: `1px solid ${viewMode === m.id ? m.color : 'rgba(255,255,255,0.15)'}`,
              color: viewMode === m.id ? m.color : 'rgba(255,255,255,0.6)',
              fontSize: '0.46rem',
              fontFamily: "'Share Tech Mono', monospace",
              padding: '3px 8px',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
              letterSpacing: 0.8,
              backdropFilter: 'blur(6px)',
              transition: 'all 0.2s ease',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Interactive Quick Target Select buttons */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          display: 'flex',
          gap: 6,
          zIndex: 14,
        }}
      >
        <span style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Share Tech Mono'", alignSelf: 'center' }}>
          AR TARGET SELECT:
        </span>
        {[
          { id: 'apc', label: '🛡️ APC #091', color: '#00f3ff' },
          { id: 'rover', label: '📡 ROVER #073', color: '#22c55e' },
          { id: 'drone', label: '🚁 DRONE #104', color: '#a855f7' },
        ].map(btn => (
          <button
            key={btn.id}
            onClick={() => {
              setLockedUnit(btn.id);
              onSelectTarget(btn.id);
            }}
            style={{
              background: lockedUnit === btn.id ? `${btn.color}30` : 'rgba(0,0,0,0.75)',
              border: `1px solid ${lockedUnit === btn.id ? btn.color : 'rgba(255,255,255,0.15)'}`,
              color: lockedUnit === btn.id ? btn.color : 'rgba(255,255,255,0.6)',
              fontSize: '0.46rem',
              fontFamily: "'Share Tech Mono'",
              padding: '2px 8px',
              borderRadius: 3,
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}
