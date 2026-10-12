/* eslint-disable react/prop-types */
/**
 * ARVRSimulation.jsx
 * Full AR/VR 3D simulation panel using Three.js (canvas-based)
 * - 3D terrain with buildings & perimeter
 * - Animated human/vehicle patrol units
 * - AR target lock overlays
 * - VR-style mission briefing
 */
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Cpu, Target, Radio, Navigation, Play, Square, RotateCcw } from 'lucide-react';
import * as THREE from 'three';

// ── 3D Scene renderer ──
function ThreeScene({ running, selectedView }) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const frameRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const unitsRef = useRef([]);

  useEffect(() => {
    if (!mountRef.current) return;
    const W = mountRef.current.clientWidth || 800;
    const H = mountRef.current.clientHeight || 450;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020804);
    scene.fog = new THREE.FogExp2(0x030a04, 0.018);
    sceneRef.current = scene;

    // Camera based on selected view
    let camera;
    if (selectedView === 'aerial') {
      camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 500);
      camera.position.set(0, 35, 25);
      camera.lookAt(0, 0, 0);
    } else if (selectedView === 'vr') {
      camera = new THREE.PerspectiveCamera(90, W / H, 0.1, 500);
      camera.position.set(-8, 3, 8);
      camera.lookAt(0, 2, 0);
    } else {
      camera = new THREE.PerspectiveCamera(65, W / H, 0.1, 500);
      camera.position.set(12, 8, 18);
      camera.lookAt(0, 0, 0);
    }
    cameraRef.current = camera;

    // ── Lighting ──
    const ambient = new THREE.AmbientLight(0x112211, 0.4);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0x22ff66, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(1024, 1024);
    scene.add(dirLight);
    const pointLight1 = new THREE.PointLight(0x00ff88, 1.5, 30);
    pointLight1.position.set(-5, 5, -5);
    scene.add(pointLight1);
    const dangerLight = new THREE.PointLight(0xff2222, 0.8, 20);
    dangerLight.position.set(5, 3, 5);
    scene.add(dangerLight);

    // ── Ground Grid ──
    const gridHelper = new THREE.GridHelper(60, 30, 0x1a4a1a, 0x0d2a0d);
    scene.add(gridHelper);

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x040d04, transparent: true, opacity: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // ── Perimeter Fence ──
    const fencePoints = [
      new THREE.Vector3(-12, 0, -12), new THREE.Vector3(12, 0, -12),
      new THREE.Vector3(12, 0, 12), new THREE.Vector3(-12, 0, 12),
      new THREE.Vector3(-12, 0, -12)
    ];
    const fenceCurve = new THREE.CatmullRomCurve3(fencePoints);
    const fenceGeo = new THREE.TubeGeometry(fenceCurve, 100, 0.05, 4, false);
    const fenceMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.6 });
    scene.add(new THREE.Mesh(fenceGeo, fenceMat));

    // ── Buildings ──
    const buildingMat = new THREE.MeshLambertMaterial({ color: 0x0a1a0a, transparent: true, opacity: 0.85 });
    const buildingEdgeMat = new THREE.LineBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.5 });
    [
      { pos: [-5, 0, -5], size: [3, 4, 2.5] },
      { pos: [5, 0, -6], size: [2.5, 3, 2] },
      { pos: [-6, 0, 4], size: [2, 5, 2] },
      { pos: [0, 0, -8], size: [4, 2, 1.5] },
    ].forEach(({ pos, size }) => {
      const geo = new THREE.BoxGeometry(...size);
      const mesh = new THREE.Mesh(geo, buildingMat);
      mesh.position.set(pos[0], size[1] / 2, pos[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      const edges = new THREE.EdgesGeometry(geo);
      const edgeLines = new THREE.LineSegments(edges, buildingEdgeMat);
      edgeLines.position.copy(mesh.position);
      scene.add(edgeLines);
    });

    // ── Human patrol units ──
    const units = [];
    const humanMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8 });
    const enemyMat = new THREE.MeshLambertMaterial({ color: 0xef4444 });

    const createHuman = (position, isEnemy = false, id = 0) => {
      const group = new THREE.Group();
      const mat = isEnemy ? enemyMat : humanMat;

      // Head
      const headGeo = new THREE.SphereGeometry(0.18, 8, 6);
      const head = new THREE.Mesh(headGeo, mat);
      head.position.y = 1.55;
      head.castShadow = true;
      group.add(head);

      // Torso
      const torsoGeo = new THREE.CylinderGeometry(0.2, 0.22, 0.7, 8);
      const torso = new THREE.Mesh(torsoGeo, mat);
      torso.position.y = 0.95;
      torso.castShadow = true;
      group.add(torso);

      // Arms
      [-0.28, 0.28].forEach((ox, idx) => {
        const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.55, 6);
        const arm = new THREE.Mesh(armGeo, mat);
        arm.position.set(ox, 0.88, 0);
        arm.rotation.z = idx === 0 ? 0.3 : -0.3;
        arm.castShadow = true;
        group.add(arm);
      });

      // Legs
      [-0.1, 0.1].forEach(ox => {
        const legGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.65, 6);
        const leg = new THREE.Mesh(legGeo, mat);
        leg.position.set(ox, 0.33, 0);
        leg.castShadow = true;
        group.add(leg);
      });

      group.position.copy(position);
      scene.add(group);

      // Bounding box wireframe (AR overlay)
      const bbGeo = new THREE.BoxGeometry(0.7, 1.9, 0.5);
      const bbMat = new THREE.MeshBasicMaterial({ color: isEnemy ? 0xef4444 : 0x00f3ff, wireframe: true, transparent: true, opacity: 0.4 });
      const bb = new THREE.Mesh(bbGeo, bbMat);
      bb.position.y = 0.95;
      group.add(bb);

      // Target ring
      const ringGeo = new THREE.RingGeometry(0.5, 0.55, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color: isEnemy ? 0xef4444 : 0x22c55e, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.05;
      group.add(ring);

      return { group, isEnemy, id, angle: Math.random() * Math.PI * 2, radius: 4 + Math.random() * 4, speed: 0.003 + Math.random() * 0.002 };
    };

    // Add patrol units
    units.push(createHuman(new THREE.Vector3(6, 0, 3), false, 1));
    units.push(createHuman(new THREE.Vector3(-4, 0, 6), false, 2));
    units.push(createHuman(new THREE.Vector3(8, 0, -4), true, 3));  // enemy
    units.push(createHuman(new THREE.Vector3(-7, 0, -3), true, 4)); // enemy
    unitsRef.current = units;

    // ── Vehicle ──
    const vehicleGroup = new THREE.Group();
    const bodyGeo = new THREE.BoxGeometry(2.5, 0.8, 1.3);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x1a3a1a });
    vehicleGroup.add(new THREE.Mesh(bodyGeo, bodyMat));
    const cabGeo = new THREE.BoxGeometry(1.2, 0.6, 1.1);
    const cab = new THREE.Mesh(cabGeo, bodyMat);
    cab.position.set(-0.4, 0.7, 0);
    vehicleGroup.add(cab);
    // Wheels
    [[-0.9, -0.45, 0.75], [-0.9, -0.45, -0.75], [0.9, -0.45, 0.75], [0.9, -0.45, -0.75]].forEach(([x, y, z]) => {
      const wGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 8);
      const wMat = new THREE.MeshLambertMaterial({ color: 0x222 });
      const wheel = new THREE.Mesh(wGeo, wMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, y, z);
      vehicleGroup.add(wheel);
    });
    // Vehicle AR wireframe
    const vbbGeo = new THREE.BoxGeometry(2.8, 1.5, 1.6);
    const vbbMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, wireframe: true, transparent: true, opacity: 0.35 });
    vehicleGroup.add(new THREE.Mesh(vbbGeo, vbbMat));
    vehicleGroup.position.set(3, 0.45, 3);
    scene.add(vehicleGroup);

    // ── Drone ──
    const droneGroup = new THREE.Group();
    const droneBody = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.3), new THREE.MeshLambertMaterial({ color: 0x333 }));
    droneGroup.add(droneBody);
    [[-0.35, 0, -0.35], [0.35, 0, -0.35], [-0.35, 0, 0.35], [0.35, 0, 0.35]].forEach(([x, y, z]) => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 0.04), new THREE.MeshLambertMaterial({ color: 0x222 }));
      arm.position.set(x, 0, z);
      droneGroup.add(arm);
      const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 8), new THREE.MeshLambertMaterial({ color: 0x444, transparent: true, opacity: 0.5 }));
      rotor.position.set(x, 0.05, z);
      droneGroup.add(rotor);
    });
    droneGroup.position.set(-3, 6, -2);
    scene.add(droneGroup);

    // ── Stars ──
    const starsGeo = new THREE.BufferGeometry();
    const starVerts = [];
    for (let i = 0; i < 600; i++) {
      starVerts.push((Math.random() - 0.5) * 300, Math.random() * 100 + 10, (Math.random() - 0.5) * 300);
    }
    starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
    scene.add(new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, transparent: true, opacity: 0.6 })));

    // ── Animation loop ──
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clockRef.current.getElapsedTime();

      if (running) {
        // Patrol units walk in circles
        units.forEach(unit => {
          unit.angle += unit.speed;
          const nx = Math.cos(unit.angle) * unit.radius;
          const nz = Math.sin(unit.angle) * unit.radius;
          unit.group.position.x = nx;
          unit.group.position.z = nz;
          unit.group.rotation.y = -unit.angle + Math.PI / 2;
          // Walk animation — bob up/down
          unit.group.children[1].position.y = 0.95 + Math.sin(elapsed * 8 + unit.id) * 0.04;
        });

        // Camera slow orbit
        const camAngle = elapsed * 0.12;
        if (selectedView === 'tactical') {
          camera.position.x = Math.cos(camAngle) * 22;
          camera.position.z = Math.sin(camAngle) * 22;
          camera.position.y = 10;
          camera.lookAt(0, 2, 0);
        } else if (selectedView === 'aerial') {
          camera.position.x = Math.sin(elapsed * 0.08) * 5;
          camera.position.z = 20;
        }

        // Vehicle patrol path
        vehicleGroup.position.x = Math.cos(elapsed * 0.4) * 6;
        vehicleGroup.position.z = Math.sin(elapsed * 0.4) * 4;
        vehicleGroup.rotation.y = -elapsed * 0.4 + Math.PI / 2;

        // Drone hover
        droneGroup.position.y = 6 + Math.sin(elapsed * 1.5) * 0.5;
        droneGroup.rotation.y = elapsed * 2;

        // Pulse danger light
        dangerLight.intensity = 0.6 + Math.sin(elapsed * 3) * 0.4;
        pointLight1.intensity = 1.2 + Math.sin(elapsed * 1.5) * 0.5;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
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
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [running, selectedView]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%', borderRadius: 8, overflow: 'hidden' }} />;
}

// ── AR Overlay HUD ──
function AROverlay({ running }) {
  const targets = [
    { id: 'TGT-001', type: 'HOSTILE', x: '22%', y: '28%', conf: '96%', risk: 'CRITICAL', color: '#ef4444' },
    { id: 'TGT-002', type: 'FRIENDLY', x: '65%', y: '55%', conf: '99%', risk: 'SECURE', color: '#22c55e' },
    { id: 'TGT-003', type: 'VEHICLE', x: '45%', y: '70%', conf: '87%', risk: 'MEDIUM', color: '#f59e0b' },
    { id: 'TGT-004', type: 'UAV/DRONE', x: '78%', y: '18%', conf: '81%', risk: 'HIGH', color: '#a855f7' },
  ];

  if (!running) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
      {targets.map((t, i) => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.3 }}
          style={{ position: 'absolute', left: t.x, top: t.y }}
        >
          {/* AR bracket */}
          <div style={{ position: 'relative', width: 50, height: 60 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: 12, height: 12, borderTop: `2px solid ${t.color}`, borderLeft: `2px solid ${t.color}` }} />
            <div style={{ position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderTop: `2px solid ${t.color}`, borderRight: `2px solid ${t.color}` }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: 12, height: 12, borderBottom: `2px solid ${t.color}`, borderLeft: `2px solid ${t.color}` }} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderBottom: `2px solid ${t.color}`, borderRight: `2px solid ${t.color}` }} />
            {/* Pulsing center dot */}
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0.3, 0.8] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 6, height: 6, borderRadius: '50%', background: t.color }}
            />
          </div>
          {/* Label */}
          <div style={{ background: `${t.color}18`, border: `1px solid ${t.color}50`, borderRadius: 4, padding: '2px 5px', marginTop: 2, whiteSpace: 'nowrap' }}>
            <div style={{ fontSize: '0.42rem', color: t.color, fontFamily: "'Share Tech Mono'", fontWeight: 'bold' }}>{t.type}</div>
            <div style={{ fontSize: '0.38rem', color: 'rgba(255,255,255,0.6)', fontFamily: "'Share Tech Mono'" }}>{t.id} • {t.conf}</div>
          </div>
        </motion.div>
      ))}

      {/* Corner compass HUD */}
      <div style={{ position: 'absolute', top: 10, left: 10 }}>
        <svg width="50" height="50" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="22" fill="none" stroke="rgba(34,197,94,0.3)" strokeWidth="1" />
          <circle cx="25" cy="25" r="18" fill="none" stroke="rgba(34,197,94,0.15)" strokeWidth="0.5" />
          <line x1="25" y1="4" x2="25" y2="11" stroke="#22c55e" strokeWidth="1.5" />
          <text x="23" y="20" fill="#22c55e" fontSize="7" fontFamily="monospace">N</text>
          <line x1="25" y1="39" x2="25" y2="46" stroke="rgba(34,197,94,0.4)" strokeWidth="0.8" />
          <line x1="4" y1="25" x2="11" y2="25" stroke="rgba(34,197,94,0.4)" strokeWidth="0.8" />
          <line x1="39" y1="25" x2="46" y2="25" stroke="rgba(34,197,94,0.4)" strokeWidth="0.8" />
          <circle cx="25" cy="25" r="2" fill="#22c55e" />
        </svg>
      </div>

      {/* Range rings HUD bottom left */}
      <div style={{ position: 'absolute', bottom: 10, left: 10, fontSize: '0.42rem', color: 'rgba(34,197,94,0.6)', fontFamily: "'Share Tech Mono'" }}>
        N28°38'12" E77°13'04" | ALT:412m | AZ:247°
      </div>
    </div>
  );
}

// ════════════════════════════════════════
//  MAIN AR/VR SIMULATION PANEL
// ════════════════════════════════════════
export default function ARVRSimulation() {
  const [running, setRunning] = useState(false);
  const [selectedView, setSelectedView] = useState('tactical');
  const [stats, setStats] = useState({ fps: 60, targets: 4, coverage: 87 });

  useEffect(() => {
    const t = setInterval(() => {
      setStats(prev => ({
        fps: Math.round(55 + Math.random() * 10),
        targets: running ? Math.floor(2 + Math.random() * 3) : 0,
        coverage: Math.round(85 + Math.random() * 10),
      }));
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  const views = [
    { id: 'tactical', label: 'TACTICAL' },
    { id: 'aerial', label: 'AERIAL' },
    { id: 'vr', label: 'VR/FPV' },
  ];

  return (
    <motion.div
      key="arvr"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 10px', gap: 8, overflowY: 'auto' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Eye size={16} color="#f59e0b" />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#f59e0b', fontFamily: "'Share Tech Mono'", letterSpacing: 2 }}>AR/VR 3D SIMULATION ENGINE</div>
            <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)' }}>THREE.JS · Real-time 3D · Augmented Reality Target Lock</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {views.map(v => (
            <button key={v.id} onClick={() => setSelectedView(v.id)}
              style={{ background: selectedView === v.id ? 'rgba(245,158,11,0.2)' : 'transparent', border: `1px solid ${selectedView === v.id ? '#f59e0b' : 'rgba(255,255,255,0.1)'}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: selectedView === v.id ? '#f59e0b' : 'rgba(255,255,255,0.4)', fontFamily: "'Share Tech Mono'", fontSize: '0.5rem', letterSpacing: 1 }}>
              {v.label}
            </button>
          ))}
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setRunning(r => !r)}
            style={{ background: running ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)', border: `1px solid ${running ? '#ef4444' : '#22c55e'}`, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', color: running ? '#ef4444' : '#22c55e', fontFamily: "'Share Tech Mono'", fontSize: '0.55rem', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            {running ? <><Square size={12} /> STOP</> : <><Play size={12} /> START 3D</>}
          </motion.button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
        {[
          { label: 'ENGINE', value: 'THREE.JS', color: '#f59e0b' },
          { label: 'FPS', value: `${stats.fps}`, color: '#22c55e' },
          { label: 'TARGETS', value: `${stats.targets}`, color: running ? '#ef4444' : 'rgba(255,255,255,0.3)' },
          { label: 'AR COVERAGE', value: `${stats.coverage}%`, color: '#a855f7' },
          { label: 'VIEW MODE', value: selectedView.toUpperCase(), color: '#38bdf8' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '6px 10px' }}>
            <div style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Share Tech Mono'", marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: '0.75rem', color: s.color, fontFamily: "'Share Tech Mono'", fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Main 3D viewport */}
      <div style={{
        flex: 1, minHeight: 350, position: 'relative',
        background: 'rgba(0,0,0,0.8)', borderRadius: 12, overflow: 'hidden',
        border: '1px solid rgba(245,158,11,0.2)',
        boxShadow: running ? '0 0 30px rgba(245,158,11,0.1)' : 'none',
      }}>
        {running ? (
          <>
            <ThreeScene running={running} selectedView={selectedView} />
            <AROverlay running={running} />
            {/* Scanline overlay */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent 3px)', zIndex: 10 }} />
            {/* Mode badge */}
            <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 6, padding: '3px 10px', zIndex: 15, display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#f59e0b', animation: 'breathe 1.5s infinite' }} />
              <span style={{ fontSize: '0.48rem', color: '#f59e0b', fontFamily: "'Share Tech Mono'" }}>AR/VR ACTIVE — {selectedView.toUpperCase()} VIEW</span>
            </div>
          </>
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            {/* 3D SVG preview */}
            <svg width="200" height="150" viewBox="0 0 200 150">
              {/* Isometric grid */}
              {Array.from({ length: 6 }).map((_, i) => (
                <line key={`h${i}`} x1={20 + i * 30} y1="30" x2={5 + i * 23} y2="120" stroke="rgba(245,158,11,0.2)" strokeWidth="0.8" />
              ))}
              {Array.from({ length: 5 }).map((_, i) => (
                <line key={`v${i}`} x1="20" y1={30 + i * 18} x2="175" y2={38 + i * 16} stroke="rgba(245,158,11,0.12)" strokeWidth="0.8" />
              ))}
              {/* Buildings */}
              <rect x="55" y="55" width="25" height="35" fill="rgba(245,158,11,0.06)" stroke="rgba(245,158,11,0.4)" strokeWidth="1" />
              <rect x="58" y="51" width="25" height="35" fill="rgba(245,158,11,0.04)" stroke="rgba(245,158,11,0.2)" strokeWidth="0.5" />
              <line x1="55" y1="55" x2="58" y2="51" stroke="rgba(245,158,11,0.3)" strokeWidth="0.8" />
              {/* Person silhouette */}
              <circle cx="120" cy="65" r="7" fill="none" stroke="rgba(56,189,248,0.7)" strokeWidth="1.5" />
              <line x1="120" y1="72" x2="120" y2="95" stroke="rgba(56,189,248,0.6)" strokeWidth="2" />
              <line x1="120" y1="80" x2="112" y2="88" stroke="rgba(56,189,248,0.6)" strokeWidth="1.5" />
              <line x1="120" y1="80" x2="128" y2="88" stroke="rgba(56,189,248,0.6)" strokeWidth="1.5" />
              <line x1="120" y1="95" x2="114" y2="112" stroke="rgba(56,189,248,0.6)" strokeWidth="1.5" />
              <line x1="120" y1="95" x2="126" y2="112" stroke="rgba(56,189,248,0.6)" strokeWidth="1.5" />
              <rect x="108" y="55" width="25" height="62" fill="none" stroke="rgba(239,68,68,0.4)" strokeWidth="1" strokeDasharray="3 2" />
              {/* Drone */}
              <circle cx="155" cy="40" r="12" fill="none" stroke="rgba(168,85,247,0.4)" strokeWidth="1" strokeDasharray="3 2" />
              <line x1="148" y1="40" x2="162" y2="40" stroke="rgba(168,85,247,0.6)" strokeWidth="1.5" />
              <line x1="155" y1="33" x2="155" y2="47" stroke="rgba(168,85,247,0.6)" strokeWidth="1.5" />
            </svg>
            <div style={{ color: '#f59e0b', fontFamily: "'Share Tech Mono'", fontSize: '0.65rem', letterSpacing: 2 }}>THREE.JS 3D ENGINE READY</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.5rem' }}>Click START 3D to launch AR/VR simulation</div>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setRunning(true)}
              style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid #f59e0b', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', color: '#f59e0b', fontFamily: "'Share Tech Mono'", fontSize: '0.6rem', letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Play size={14} /> LAUNCH 3D SIMULATION
            </motion.button>
          </div>
        )}
      </div>

      {/* Info cards row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {[
          { title: 'AR TARGET LOCK', desc: 'Real-time AR bounding box overlay on 3D scene. Classifies hostile/friendly units with confidence scores.', color: '#ef4444', icon: Target },
          { title: 'VR PATROL SIMULATION', desc: '3D animated patrol units walk assigned perimeter paths. Weather and threat level affect patrol density.', color: '#38bdf8', icon: Navigation },
          { title: '3D MISSION PLANNING', desc: 'Isometric map of sector with building models, fence lines, patrol routes, and UAV flight paths.', color: '#a855f7', icon: Radio },
        ].map((card, i) => (
          <div key={i} style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${card.color}20`, borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <card.icon size={13} color={card.color} />
              <div style={{ fontSize: '0.6rem', color: card.color, fontFamily: "'Share Tech Mono'", letterSpacing: 1 }}>{card.title}</div>
            </div>
            <div style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{card.desc}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
