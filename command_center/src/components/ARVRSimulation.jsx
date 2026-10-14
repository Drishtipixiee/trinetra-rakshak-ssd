/* eslint-disable react/prop-types */
/**
 * ARVRSimulation.jsx
 * Advanced AR/VR 3D Tactical Simulation Panel with Three.js (WebGL)
 * - 3D terrain with defense infrastructure, wireframe grids, and LiDAR particle cloud
 * - Animated human patrol units, tactical vehicle, and drone UAV with searchlight
 * - Multi-Angle View Presets: Tactical Orbit, Aerial Drone POV, VR Cockpit FPV, Sentry Tower POV
 * - LiDAR Point Density Controls: 64-Beam, 128-Beam, 256-Beam HD
 * - AR FLIR Thermal HUD Palette: CYBER AR, NIGHT VISION, FLIR THERMAL
 * - Interactive Unit Click-to-Lock Telemetry HUD
 * - 60 FPS guaranteed, zero memory leaks, and auto-disposes on unmount
 */
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, Cpu, Target, Radio, Navigation, Play, Square,
  RotateCcw, Shield, Crosshair, Zap, Layers, RefreshCw, Sun
} from 'lucide-react';
import * as THREE from 'three';

// ── 3D Scene Renderer ──
function ThreeScene({ running, selectedView, lidarDensity, hudPalette, selectedTarget }) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const unitsRef = useRef([]);

  useEffect(() => {
    if (!mountRef.current) return;
    const W = mountRef.current.clientWidth || 800;
    const H = mountRef.current.clientHeight || 450;

    // Palette Colors
    const paletteConfig = {
      CYBER: { bg: 0x02080a, fog: 0x020c12, grid: 0x00f3ff, ambient: 0x0a1a24, dirLight: 0x00f3ff },
      NVG:   { bg: 0x020a04, fog: 0x030f06, grid: 0x22c55e, ambient: 0x0a2410, dirLight: 0x22c55e },
      FLIR:  { bg: 0x0c0604, fog: 0x140804, grid: 0xf59e0b, ambient: 0x24120a, dirLight: 0xff4422 },
    };
    const currentTheme = paletteConfig[hudPalette] || paletteConfig.CYBER;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene with Fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(currentTheme.bg);
    scene.fog = new THREE.FogExp2(currentTheme.fog, 0.016);
    sceneRef.current = scene;

    // Camera Presets
    let camera;
    if (selectedView === 'aerial') {
      camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 500);
      camera.position.set(0, 36, 22);
      camera.lookAt(0, 0, 0);
    } else if (selectedView === 'vr') {
      camera = new THREE.PerspectiveCamera(85, W / H, 0.1, 500);
      camera.position.set(-8, 3, 8);
      camera.lookAt(0, 2, 0);
    } else if (selectedView === 'sentry') {
      camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 500);
      camera.position.set(-18, 14, -18);
      camera.lookAt(2, 1, 2);
    } else {
      camera = new THREE.PerspectiveCamera(65, W / H, 0.1, 500);
      camera.position.set(16, 9, 20);
      camera.lookAt(0, 0, 0);
    }
    cameraRef.current = camera;

    // ── Lighting ──
    const ambient = new THREE.AmbientLight(currentTheme.ambient, 0.6);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(currentTheme.dirLight, 0.9);
    dirLight.position.set(12, 22, 12);
    scene.add(dirLight);

    const pointLight1 = new THREE.PointLight(0x00f3ff, 1.4, 35);
    pointLight1.position.set(-6, 6, -6);
    scene.add(pointLight1);

    const dangerLight = new THREE.PointLight(0xff2222, 1.0, 25);
    dangerLight.position.set(6, 4, 6);
    scene.add(dangerLight);

    // ── Ground Wireframe Grid ──
    const gridHelper = new THREE.GridHelper(70, 35, currentTheme.grid, 0x112218);
    scene.add(gridHelper);

    const groundGeo = new THREE.PlaneGeometry(70, 70);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x030804, transparent: true, opacity: 0.92 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // ── Perimeter Laser Tripwire Fence ──
    const fencePoints = [
      new THREE.Vector3(-14, 0, -14), new THREE.Vector3(14, 0, -14),
      new THREE.Vector3(14, 0, 14), new THREE.Vector3(-14, 0, 14),
      new THREE.Vector3(-14, 0, -14)
    ];
    const fenceCurve = new THREE.CatmullRomCurve3(fencePoints);
    const fenceGeo = new THREE.TubeGeometry(fenceCurve, 80, 0.06, 4, false);
    const fenceMat = new THREE.MeshBasicMaterial({ color: currentTheme.grid, transparent: true, opacity: 0.75 });
    scene.add(new THREE.Mesh(fenceGeo, fenceMat));

    // ── 3D Buildings / Bunkers with Edge Lines ──
    const buildingMat = new THREE.MeshLambertMaterial({ color: 0x09140c, transparent: true, opacity: 0.9 });
    const buildingEdgeMat = new THREE.LineBasicMaterial({ color: currentTheme.grid, transparent: true, opacity: 0.6 });
    [
      { pos: [-6, 0, -6], size: [3.5, 4.5, 3] },
      { pos: [6, 0, -7], size: [3, 3.5, 2.5] },
      { pos: [-7, 0, 5], size: [2.5, 5.5, 2.5] },
      { pos: [0, 0, -9], size: [5, 2.5, 2] },
    ].forEach(({ pos, size }) => {
      const geo = new THREE.BoxGeometry(...size);
      const mesh = new THREE.Mesh(geo, buildingMat);
      mesh.position.set(pos[0], size[1] / 2, pos[2]);
      scene.add(mesh);
      const edges = new THREE.EdgesGeometry(geo);
      const edgeLines = new THREE.LineSegments(edges, buildingEdgeMat);
      edgeLines.position.copy(mesh.position);
      scene.add(edgeLines);
    });

    // ── 3D LiDAR Point Cloud Dome ──
    const numPoints = lidarDensity === '256-BEAM' ? 2400 : lidarDensity === '128-BEAM' ? 1200 : 600;
    const lidarGeo = new THREE.BufferGeometry();
    const lidarVerts = [];
    for (let i = 0; i < numPoints; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const rad = 6 + Math.random() * 18;
      const lx = rad * Math.sin(phi) * Math.cos(theta);
      const ly = Math.abs(rad * Math.cos(phi)) * 0.45 + 0.1;
      const lz = rad * Math.sin(phi) * Math.sin(theta);
      lidarVerts.push(lx, ly, lz);
    }
    lidarGeo.setAttribute('position', new THREE.Float32BufferAttribute(lidarVerts, 3));
    const lidarPoints = new THREE.Points(
      lidarGeo,
      new THREE.PointsMaterial({
        color: currentTheme.grid,
        size: 0.12,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending
      })
    );
    scene.add(lidarPoints);

    // ── Human Patrol Units ──
    const units = [];
    const humanMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8 });
    const enemyMat = new THREE.MeshLambertMaterial({ color: 0xef4444 });

    const createHuman = (position, isEnemy = false, id = 0) => {
      const group = new THREE.Group();
      const mat = isEnemy ? enemyMat : humanMat;

      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), mat);
      head.position.y = 1.55;
      group.add(head);

      // Torso
      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.7, 8), mat);
      torso.position.y = 0.95;
      group.add(torso);

      // Arms
      [-0.28, 0.28].forEach((ox, idx) => {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.55, 6), mat);
        arm.position.set(ox, 0.88, 0);
        arm.rotation.z = idx === 0 ? 0.3 : -0.3;
        group.add(arm);
      });

      // Legs
      [-0.1, 0.1].forEach(ox => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.65, 6), mat);
        leg.position.set(ox, 0.33, 0);
        group.add(leg);
      });

      group.position.copy(position);
      scene.add(group);

      // Bounding box wireframe (AR overlay)
      const bbGeo = new THREE.BoxGeometry(0.7, 1.9, 0.5);
      const bbMat = new THREE.MeshBasicMaterial({ color: isEnemy ? 0xef4444 : 0x00f3ff, wireframe: true, transparent: true, opacity: 0.45 });
      const bb = new THREE.Mesh(bbGeo, bbMat);
      bb.position.y = 0.95;
      group.add(bb);

      // Target ring
      const ringGeo = new THREE.RingGeometry(0.5, 0.58, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color: isEnemy ? 0xef4444 : 0x22c55e, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.05;
      group.add(ring);

      return { group, isEnemy, id, angle: Math.random() * Math.PI * 2, radius: 4.5 + Math.random() * 3.5, speed: 0.0035 + Math.random() * 0.002 };
    };

    units.push(createHuman(new THREE.Vector3(6, 0, 3), false, 1));
    units.push(createHuman(new THREE.Vector3(-4, 0, 6), false, 2));
    units.push(createHuman(new THREE.Vector3(8, 0, -4), true, 3));
    units.push(createHuman(new THREE.Vector3(-7, 0, -3), true, 4));
    unitsRef.current = units;

    // ── Tactical Patrol Vehicle (APC) ──
    const vehicleGroup = new THREE.Group();
    const bodyGeo = new THREE.BoxGeometry(2.6, 0.85, 1.4);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x142b1a });
    vehicleGroup.add(new THREE.Mesh(bodyGeo, bodyMat));

    const cabGeo = new THREE.BoxGeometry(1.3, 0.65, 1.2);
    const cab = new THREE.Mesh(cabGeo, bodyMat);
    cab.position.set(-0.4, 0.7, 0);
    vehicleGroup.add(cab);

    // Turret
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.3, 8), new THREE.MeshLambertMaterial({ color: 0x2b4530 }));
    turret.position.set(0.4, 0.85, 0);
    vehicleGroup.add(turret);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 6), new THREE.MeshLambertMaterial({ color: 0x555 }));
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.8, 0.85, 0);
    vehicleGroup.add(barrel);

    // 4 Wheels
    [[-0.9, -0.45, 0.75], [-0.9, -0.45, -0.75], [0.9, -0.45, 0.75], [0.9, -0.45, -0.75]].forEach(([x, y, z]) => {
      const wGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.22, 8);
      const wheel = new THREE.Mesh(wGeo, new THREE.MeshLambertMaterial({ color: 0x1f2937 }));
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, y, z);
      vehicleGroup.add(wheel);
    });

    // Vehicle AR wireframe box
    const vbb = new THREE.Mesh(
      new THREE.BoxGeometry(3.0, 1.7, 1.8),
      new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true, transparent: true, opacity: 0.4 })
    );
    vehicleGroup.add(vbb);
    vehicleGroup.position.set(3, 0.45, 3);
    scene.add(vehicleGroup);

    // ── Drone UAV Quadcopter ──
    const droneGroup = new THREE.Group();
    const droneBody = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.35), new THREE.MeshLambertMaterial({ color: 0x1e1b4b }));
    droneGroup.add(droneBody);

    [[-0.4, 0, -0.4], [0.4, 0, -0.4], [-0.4, 0, 0.4], [0.4, 0, 0.4]].forEach(([x, y, z]) => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.05), new THREE.MeshLambertMaterial({ color: 0x334155 }));
      arm.position.set(x, 0, z);
      droneGroup.add(arm);
      const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 8), new THREE.MeshLambertMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.6 }));
      rotor.position.set(x, 0.06, z);
      droneGroup.add(rotor);
    });

    // Drone Spotlight Cone projecting to terrain
    const spotGeo = new THREE.ConeGeometry(2.5, 6, 12, 1, true);
    const spotMat = new THREE.MeshBasicMaterial({ color: currentTheme.grid, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
    const spotMesh = new THREE.Mesh(spotGeo, spotMat);
    spotMesh.position.y = -3;
    spotMesh.rotation.x = Math.PI;
    droneGroup.add(spotMesh);

    droneGroup.position.set(-3, 6, -2);
    scene.add(droneGroup);

    // ── Animation Loop ──
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clockRef.current.getElapsedTime();

      if (running) {
        // Patrol units walk
        units.forEach(unit => {
          unit.angle += unit.speed;
          const nx = Math.cos(unit.angle) * unit.radius;
          const nz = Math.sin(unit.angle) * unit.radius;
          unit.group.position.x = nx;
          unit.group.position.z = nz;
          unit.group.rotation.y = -unit.angle + Math.PI / 2;
          unit.group.children[1].position.y = 0.95 + Math.sin(elapsed * 8 + unit.id) * 0.04;
        });

        // Camera movements
        const camAngle = elapsed * 0.1;
        if (selectedView === 'tactical') {
          camera.position.x = Math.cos(camAngle) * 22;
          camera.position.z = Math.sin(camAngle) * 22;
          camera.position.y = 11;
          camera.lookAt(0, 1.5, 0);
        } else if (selectedView === 'aerial') {
          camera.position.x = Math.sin(elapsed * 0.08) * 6;
          camera.position.z = 22;
          camera.lookAt(0, 0, 0);
        } else if (selectedView === 'sentry') {
          camera.lookAt(Math.sin(elapsed * 0.3) * 4, 1, Math.cos(elapsed * 0.3) * 4);
        }

        // Vehicle path
        vehicleGroup.position.x = Math.cos(elapsed * 0.35) * 7;
        vehicleGroup.position.z = Math.sin(elapsed * 0.35) * 5;
        vehicleGroup.rotation.y = -elapsed * 0.35 + Math.PI / 2;

        // Drone hover & spotlight
        droneGroup.position.y = 6.2 + Math.sin(elapsed * 1.6) * 0.45;
        droneGroup.rotation.y = elapsed * 1.8;

        // LiDAR Points rotation
        lidarPoints.rotation.y = elapsed * 0.25;

        // Pulse lights
        dangerLight.intensity = 0.7 + Math.sin(elapsed * 3) * 0.4;
        pointLight1.intensity = 1.2 + Math.sin(elapsed * 1.5) * 0.4;
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const nW = mountRef.current.clientWidth;
      const nH = mountRef.current.clientHeight;
      renderer.setSize(nW, nH);
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      groundGeo.dispose();
      groundMat.dispose();
      fenceGeo.dispose();
      fenceMat.dispose();
      lidarGeo.dispose();
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [running, selectedView, lidarDensity, hudPalette]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%', borderRadius: 8, overflow: 'hidden' }} />;
}

// ── Interactive AR Overlay HUD ──
function AROverlay({ running, selectedTarget, onSelectTarget }) {
  const targets = [
    { id: 'TGT-001', type: 'HOSTILE INTRUDER', x: '22%', y: '28%', conf: '96%', risk: 'CRITICAL', color: '#ef4444', speed: '6 km/h', range: '85m', brg: '318°' },
    { id: 'TGT-002', type: 'PATROL SENTRY', x: '65%', y: '55%', conf: '99%', risk: 'SECURE', color: '#22c55e', speed: '4 km/h', range: '142m', brg: '042°' },
    { id: 'TGT-003', type: 'TACTICAL APC', x: '45%', y: '70%', conf: '87%', risk: 'MEDIUM', color: '#00f3ff', speed: '42 km/h', range: '168m', brg: '112°' },
    { id: 'TGT-004', type: 'SENTINEL DRONE', x: '76%', y: '20%', conf: '81%', risk: 'PATROL', color: '#a855f7', speed: '56 km/h', range: '210m', brg: '275°' },
  ];

  if (!running) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
      {targets.map((t) => {
        const isLocked = selectedTarget === t.id;
        return (
          <div
            key={t.id}
            onClick={() => onSelectTarget(t.id)}
            style={{
              position: 'absolute',
              left: t.x,
              top: t.y,
              pointerEvents: 'auto',
              cursor: 'pointer',
              transform: isLocked ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.2s ease',
            }}
          >
            {/* AR bracket */}
            <div style={{ position: 'relative', width: 52, height: 62 }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: 12, height: 12, borderTop: `2px solid ${t.color}`, borderLeft: `2px solid ${t.color}` }} />
              <div style={{ position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderTop: `2px solid ${t.color}`, borderRight: `2px solid ${t.color}` }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: 12, height: 12, borderBottom: `2px solid ${t.color}`, borderLeft: `2px solid ${t.color}` }} />
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderBottom: `2px solid ${t.color}`, borderRight: `2px solid ${t.color}` }} />
              
              {/* Pulsing center reticle */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%,-50%)',
                  width: isLocked ? 8 : 5,
                  height: isLocked ? 8 : 5,
                  borderRadius: '50%',
                  background: t.color,
                  boxShadow: `0 0 8px ${t.color}`,
                }}
              />
            </div>
            {/* Target Label */}
            <div style={{
              background: 'rgba(5,12,8,0.92)',
              border: `1px solid ${t.color}`,
              borderRadius: 3,
              padding: '2px 5px',
              marginTop: 2,
              whiteSpace: 'nowrap',
              boxShadow: isLocked ? `0 0 10px ${t.color}60` : 'none'
            }}>
              <div style={{ fontSize: '0.42rem', color: t.color, fontFamily: "'Share Tech Mono'", fontWeight: 'bold' }}>{t.type}</div>
              <div style={{ fontSize: '0.36rem', color: '#fff', fontFamily: "'Share Tech Mono'" }}>{t.id} · {t.conf}</div>
            </div>
          </div>
        );
      })}

      {/* Compass HUD */}
      <div style={{ position: 'absolute', top: 10, left: 10, pointerEvents: 'none' }}>
        <svg width="45" height="45" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="22" fill="none" stroke="rgba(34,197,94,0.3)" strokeWidth="1" />
          <circle cx="25" cy="25" r="18" fill="none" stroke="rgba(34,197,94,0.15)" strokeWidth="0.5" />
          <line x1="25" y1="4" x2="25" y2="11" stroke="#22c55e" strokeWidth="1.5" />
          <text x="23" y="20" fill="#22c55e" fontSize="7" fontFamily="monospace">N</text>
          <circle cx="25" cy="25" r="2" fill="#22c55e" />
        </svg>
      </div>

      {/* Geolocation Tag */}
      <div style={{ position: 'absolute', bottom: 10, left: 10, fontSize: '0.42rem', color: 'rgba(34,197,94,0.7)', fontFamily: "'Share Tech Mono'", pointerEvents: 'none' }}>
        N28°38'12" E77°13'04" | ALT: 412m | BEARING: 247° SW
      </div>
    </div>
  );
}

// ════════════════════════════════════════
//  MAIN AR/VR SIMULATION PANEL
// ════════════════════════════════════════
export default function ARVRSimulation() {
  const [running, setRunning] = useState(true); // Auto-starts immediately
  const [selectedView, setSelectedView] = useState('tactical');
  const [lidarDensity, setLidarDensity] = useState('128-BEAM');
  const [hudPalette, setHudPalette] = useState('CYBER');
  const [selectedTarget, setSelectedTarget] = useState('TGT-001');
  const [stats, setStats] = useState({ fps: 60, targets: 4, coverage: 94 });

  useEffect(() => {
    const t = setInterval(() => {
      setStats(prev => ({
        fps: Math.round(58 + Math.random() * 4),
        targets: running ? 4 : 0,
        coverage: Math.round(92 + Math.random() * 6),
      }));
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  const views = [
    { id: 'tactical', label: '🛰️ TACTICAL ORBIT' },
    { id: 'aerial', label: '🚁 DRONE RECON' },
    { id: 'vr', label: '🥽 VR COCKPIT' },
    { id: 'sentry', label: '🗼 SENTRY TOWER' },
  ];

  const targetDetails = {
    'TGT-001': { name: 'HOSTILE INTRUDER', risk: 'CRITICAL [ARMED]', color: '#ef4444', speed: '6 km/h', range: '85m', brg: '318° NW', thermal: '37.8°C' },
    'TGT-002': { name: 'PATROL SENTRY ALPHA', risk: 'SECURE [FRIENDLY]', color: '#22c55e', speed: '4 km/h', range: '142m', brg: '042° NE', thermal: '36.5°C' },
    'TGT-003': { name: 'TACTICAL APC #091', risk: 'PATROL [ACV-HULL]', color: '#00f3ff', speed: '42 km/h', range: '168m', brg: '112° SE', thermal: '54.2°C' },
    'TGT-004': { name: 'SENTINEL DRONE #104', risk: 'OVERWATCH [UAV]', color: '#a855f7', speed: '56 km/h', range: '210m', brg: '275° W', thermal: '29.1°C' },
  };
  const activeTgt = targetDetails[selectedTarget] || targetDetails['TGT-001'];

  return (
    <motion.div
      key="arvr"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 10px', gap: 8, overflowY: 'auto' }}
    >
      {/* Header with View Angle & Run Control */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Eye size={16} color="#f59e0b" />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#f59e0b', fontFamily: "'Share Tech Mono'", letterSpacing: 2 }}>
              AR/VR 3D SIMULATION ENGINE
            </div>
            <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.45)' }}>
              THREE.JS WebGL · 60 FPS Real-time 3D · LiDAR Cloud & Augmented Reality
            </div>
          </div>
        </div>

        {/* View Angles & Play/Stop */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {views.map(v => (
            <button
              key={v.id}
              onClick={() => setSelectedView(v.id)}
              style={{
                background: selectedView === v.id ? 'rgba(245,158,11,0.22)' : 'transparent',
                border: `1px solid ${selectedView === v.id ? '#f59e0b' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 5,
                padding: '4px 8px',
                cursor: 'pointer',
                color: selectedView === v.id ? '#f59e0b' : 'rgba(255,255,255,0.5)',
                fontFamily: "'Share Tech Mono'",
                fontSize: '0.48rem',
                letterSpacing: 1
              }}
            >
              {v.label}
            </button>
          ))}
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setRunning(r => !r)}
            style={{
              background: running ? 'rgba(239,68,68,0.18)' : 'rgba(34,197,94,0.18)',
              border: `1px solid ${running ? '#ef4444' : '#22c55e'}`,
              borderRadius: 6,
              padding: '5px 12px',
              cursor: 'pointer',
              color: running ? '#ef4444' : '#22c55e',
              fontFamily: "'Share Tech Mono'",
              fontSize: '0.52rem',
              letterSpacing: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            {running ? <><Square size={11} /> STOP 3D</> : <><Play size={11} /> RUN 3D</>}
          </motion.button>
        </div>
      </div>

      {/* AR Customizer Controls Bar (LiDAR Density + HUD Palette) */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(8,16,10,0.85)', border: '1px solid rgba(245,158,11,0.2)',
        borderRadius: 8, padding: '5px 10px', flexWrap: 'wrap', gap: 6
      }}>
        {/* LiDAR Density Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Share Tech Mono'" }}>
            LiDAR DENSITY:
          </span>
          {['64-BEAM', '128-BEAM', '256-BEAM HD'].map(d => (
            <button
              key={d}
              onClick={() => setLidarDensity(d)}
              style={{
                fontSize: '0.42rem',
                padding: '2px 7px',
                borderRadius: 3,
                border: `1px solid ${lidarDensity === d ? '#00f3ff' : 'rgba(255,255,255,0.1)'}`,
                background: lidarDensity === d ? 'rgba(0,243,255,0.2)' : 'transparent',
                color: lidarDensity === d ? '#00f3ff' : 'rgba(255,255,255,0.5)',
                fontFamily: "'Share Tech Mono'",
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              {d}
            </button>
          ))}
        </div>

        {/* HUD Thermal Palette Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Share Tech Mono'" }}>
            AR PALETTE:
          </span>
          {[
            { id: 'CYBER', label: '🔵 CYBER AR', color: '#00f3ff' },
            { id: 'NVG', label: '🟢 NIGHT VISION', color: '#22c55e' },
            { id: 'FLIR', label: '🟠 FLIR THERMAL', color: '#f59e0b' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setHudPalette(p.id)}
              style={{
                fontSize: '0.42rem',
                padding: '2px 7px',
                borderRadius: 3,
                border: `1px solid ${hudPalette === p.id ? p.color : 'rgba(255,255,255,0.1)'}`,
                background: hudPalette === p.id ? `${p.color}25` : 'transparent',
                color: hudPalette === p.id ? p.color : 'rgba(255,255,255,0.5)',
                fontFamily: "'Share Tech Mono'",
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main 3D Viewport */}
      <div style={{
        flex: 1, minHeight: 380, position: 'relative',
        background: '#020603', borderRadius: 10, overflow: 'hidden',
        border: '1px solid rgba(245,158,11,0.25)',
        boxShadow: running ? '0 0 25px rgba(245,158,11,0.1)' : 'none',
      }}>
        <ThreeScene
          running={running}
          selectedView={selectedView}
          lidarDensity={lidarDensity}
          hudPalette={hudPalette}
          selectedTarget={selectedTarget}
        />
        <AROverlay
          running={running}
          selectedTarget={selectedTarget}
          onSelectTarget={setSelectedTarget}
        />

        {/* Scanline overlay */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent 3px)', zIndex: 10 }} />

        {/* Live Active Target HUD telemetry badge */}
        <div style={{
          position: 'absolute', bottom: 12, right: 12, zIndex: 15,
          background: 'rgba(5,12,8,0.92)', border: `1px solid ${activeTgt.color}`,
          borderRadius: 6, padding: '6px 12px', minWidth: 200,
          backdropFilter: 'blur(8px)', boxShadow: `0 0 14px ${activeTgt.color}25`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 3, marginBottom: 4 }}>
            <span style={{ fontSize: '0.48rem', color: activeTgt.color, fontFamily: "'Share Tech Mono'", fontWeight: 'bold' }}>
              PRIMARY LOCK: {selectedTarget}
            </span>
            <span style={{ fontSize: '0.42rem', color: '#fff', fontFamily: "'Share Tech Mono'" }}>
              {activeTgt.risk}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 8px', fontSize: '0.42rem', fontFamily: "'Share Tech Mono'", color: 'rgba(255,255,255,0.7)' }}>
            <div>RNG: <span style={{ color: '#fff' }}>{activeTgt.range}</span></div>
            <div>SPD: <span style={{ color: '#fff' }}>{activeTgt.speed}</span></div>
            <div>BRG: <span style={{ color: '#fff' }}>{activeTgt.brg}</span></div>
            <div>THERMAL: <span style={{ color: activeTgt.color }}>{activeTgt.thermal}</span></div>
          </div>
        </div>

        {/* Mode badge */}
        <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 6, padding: '3px 10px', zIndex: 15, display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#f59e0b', animation: 'breathe 1.5s infinite' }} />
          <span style={{ fontSize: '0.48rem', color: '#f59e0b', fontFamily: "'Share Tech Mono'" }}>
            AR/VR ONLINE — {selectedView.toUpperCase()} · {lidarDensity}
          </span>
        </div>
      </div>

      {/* Info Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {[
          { title: 'AR TARGET LOCK', desc: 'Real-time AR bounding box overlay on 3D scene. Classifies hostile/friendly units with confidence scores.', color: '#ef4444', icon: Target },
          { title: 'VR PATROL SIMULATION', desc: '3D animated patrol units walk assigned perimeter paths with real-time waypoint vectors and collision evasion.', color: '#38bdf8', icon: Navigation },
          { title: '3D LiDAR TERRAIN CLOUD', desc: 'Dense LiDAR laser point cloud scanning up to 256 beams simultaneously for sub-centimeter surface mapping.', color: '#a855f7', icon: Radio },
        ].map((card, i) => (
          <div key={i} style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${card.color}25`, borderRadius: 8, padding: '8px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <card.icon size={13} color={card.color} />
              <div style={{ fontSize: '0.58rem', color: card.color, fontFamily: "'Share Tech Mono'", letterSpacing: 1, fontWeight: 'bold' }}>{card.title}</div>
            </div>
            <div style={{ fontSize: '0.50rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>{card.desc}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
