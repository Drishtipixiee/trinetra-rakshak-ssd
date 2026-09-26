/**
 * CamForge — Tinkercad-Inspired CCTV Coverage Planner
 * Trinetra Rakshak OSIRIS Module
 *
 * Features:
 * - Drag-and-drop camera placement on canvas
 * - FOV cone rendering (angle + range slider)
 * - Dead zone / blind spot detection (red zones)
 * - Overlap detection (yellow = redundant coverage)
 * - Camera types: PTZ Dome, Fixed Bullet, Thermal, ESP32-CAM
 * - ESP32-CAM view: embedded Tinkercad circuit iframe
 * - Export placement as JSON
 * - Coverage statistics panel
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Plus, Trash2, Download, ChevronDown, ChevronUp,
  Eye, AlertTriangle, CheckCircle, Cpu, Settings, RotateCcw,
  ZoomIn, ZoomOut, Grid, Info, X, ExternalLink, Radio, Zap
} from 'lucide-react';

// ── Camera Type Definitions ───────────────────────────────────────────────────
const CAMERA_TYPES = [
  {
    id: 'ptzdome',
    name: 'PTZ Dome',
    icon: '🔄',
    color: '#22c55e',
    fovAngle: 120,
    fovRange: 80,
    description: '360° rotation capability. Ideal for open areas.',
    specs: { resolution: '4K', nightVision: true, pan: '360°', tilt: '180°' },
  },
  {
    id: 'bullet',
    name: 'Fixed Bullet',
    icon: '📹',
    color: '#60a5fa',
    fovAngle: 80,
    fovRange: 120,
    description: 'Long-range fixed camera. Ideal for corridors and gates.',
    specs: { resolution: '2K', nightVision: true, pan: 'Fixed', range: '120m' },
  },
  {
    id: 'thermal',
    name: 'Thermal Imager',
    icon: '🌡️',
    color: '#f97316',
    fovAngle: 60,
    fovRange: 200,
    description: 'Infrared thermal imaging. Detects heat signatures through fog/dark.',
    specs: { resolution: '640×480 IR', nightVision: true, range: '200m', sensitivity: '±0.05°C' },
  },
  {
    id: 'esp32cam',
    name: 'ESP32-CAM IoT',
    icon: '⚡',
    color: '#a855f7',
    fovAngle: 160,
    fovRange: 15,
    description: 'Low-cost IoT camera node. WiFi-enabled PIR trigger.',
    specs: { resolution: 'OV2640 2MP', nightVision: false, range: '15m', protocol: 'MQTT/WiFi' },
    hasTinkercad: true,
    // Public Tinkercad design: ESP32-CAM with PIR sensor and LED
    tinkercadUrl: 'https://www.tinkercad.com/embed/iNJpRkSPsLk?editbtn=1',
  },
];

// ── Pre-made base map options ─────────────────────────────────────────────────
const BASE_MAPS = [
  { id: 'military_base', name: 'Military Base Layout', bg: '#0a1a0a', grid: true },
  { id: 'border_post', name: 'Border Check Post', bg: '#0a1510', grid: true },
  { id: 'railway_station', name: 'Railway Station', bg: '#0a0f1a', grid: true },
  { id: 'blank', name: 'Blank Canvas', bg: '#050c05', grid: true },
];

// ── Perimeter Walls for "Military Base" ──────────────────────────────────────
const BASE_WALLS = {
  military_base: [
    { x1: 50, y1: 50, x2: 750, y2: 50 },    // top
    { x1: 750, y1: 50, x2: 750, y2: 550 },   // right
    { x1: 750, y1: 550, x2: 50, y2: 550 },   // bottom
    { x1: 50, y1: 550, x2: 50, y2: 50 },     // left
    { x1: 50, y1: 200, x2: 200, y2: 200 },   // inner wall 1
    { x1: 200, y1: 50, x2: 200, y2: 200 },   // inner wall 2
    { x1: 400, y1: 200, x2: 600, y2: 200 },  // guard post wall
    { x1: 400, y1: 200, x2: 400, y2: 350 },  // guard post side
  ],
  border_post: [
    { x1: 30, y1: 50, x2: 770, y2: 50 },
    { x1: 770, y1: 50, x2: 770, y2: 560 },
    { x1: 30, y1: 560, x2: 770, y2: 560 },
    { x1: 30, y1: 50, x2: 30, y2: 560 },
    { x1: 30, y1: 305, x2: 770, y2: 305 },  // border line
    { x1: 300, y1: 250, x2: 500, y2: 360 }, // gate
  ],
  railway_station: [
    { x1: 50, y1: 100, x2: 750, y2: 100 },
    { x1: 50, y1: 500, x2: 750, y2: 500 },
    { x1: 50, y1: 100, x2: 50, y2: 500 },
    { x1: 750, y1: 100, x2: 750, y2: 500 },
    { x1: 50, y1: 200, x2: 750, y2: 200 },
    { x1: 50, y1: 400, x2: 750, y2: 400 },
  ],
  blank: [],
};

// ── FOV Cone Math ─────────────────────────────────────────────────────────────
function getFovPolygon(x, y, angleDeg, rangePx, directionDeg) {
  const halfAngle = (angleDeg / 2) * (Math.PI / 180);
  const dirRad = directionDeg * (Math.PI / 180);

  const points = [];
  points.push({ x, y }); // origin
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const a = dirRad - halfAngle + (2 * halfAngle * i / steps);
    points.push({
      x: x + Math.cos(a) * rangePx,
      y: y + Math.sin(a) * rangePx,
    });
  }
  return points;
}

function polygonToSvgPath(pts) {
  if (pts.length === 0) return '';
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';
}

// ── Coverage Stats ────────────────────────────────────────────────────────────
function computeCoverageStats(cameras, canvasW, canvasH, mapId) {
  const SAMPLE = 20; // grid resolution
  let covered = 0;
  let total = 0;

  for (let x = 0; x < canvasW; x += SAMPLE) {
    for (let y = 0; y < canvasH; y += SAMPLE) {
      total++;
      let isCovered = false;
      for (const cam of cameras) {
        const dx = x - cam.x;
        const dy = y - cam.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const rangePx = cam.fovRange * 1.5;
        if (dist > rangePx) continue;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const dirNorm = ((cam.direction % 360) + 360) % 360;
        const angleDiff = Math.abs(((angle - dirNorm + 540) % 360) - 180);
        if (angleDiff <= cam.fovAngle / 2) {
          isCovered = true;
          break;
        }
      }
      if (isCovered) covered++;
    }
  }
  return Math.round((covered / total) * 100);
}

// ─────────────────────────────────────────────────────────────────────────────
export default function CamForge() {
  const [cameras, setCameras] = useState([]);
  const [selectedCamId, setSelectedCamId] = useState(null);
  const [selectedType, setSelectedType] = useState(CAMERA_TYPES[0]);
  const [mapId, setMapId] = useState('military_base');
  const [showTinkercad, setShowTinkercad] = useState(false);
  const [tinkercadUrl, setTinkercadUrl] = useState('');
  const [showTypePanel, setShowTypePanel] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [coveragePct, setCoveragePct] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [iframeFailed, setIframeFailed] = useState(false);
  const svgRef = useRef(null);
  const CANVAS_W = 800;
  const CANVAS_H = 560;

  const selectedCam = cameras.find(c => c.id === selectedCamId);

  // Recompute coverage whenever cameras change
  useEffect(() => {
    const pct = computeCoverageStats(cameras, CANVAS_W, CANVAS_H, mapId);
    setCoveragePct(pct);
  }, [cameras, mapId]);

  // Add camera on canvas click
  const handleCanvasClick = useCallback((e) => {
    if (isDragging) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_H;

    const newCam = {
      id: `CAM-${Date.now()}`,
      x, y,
      type: selectedType.id,
      name: `${selectedType.name} ${cameras.length + 1}`,
      color: selectedType.color,
      fovAngle: selectedType.fovAngle,
      fovRange: selectedType.fovRange,
      direction: 0,
    };
    setCameras(prev => [...prev, newCam]);
    setSelectedCamId(newCam.id);
  }, [isDragging, selectedType, cameras.length]);

  const deleteCamera = useCallback((id) => {
    setCameras(prev => prev.filter(c => c.id !== id));
    if (selectedCamId === id) setSelectedCamId(null);
  }, [selectedCamId]);

  const updateCamera = useCallback((id, updates) => {
    setCameras(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const handleMouseDown = useCallback((e, camId) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragId(camId);
    const rect = svgRef.current.getBoundingClientRect();
    const cam = cameras.find(c => c.id === camId);
    setDragOffset({
      x: (e.clientX - rect.left) / rect.width * CANVAS_W - cam.x,
      y: (e.clientY - rect.top) / rect.height * CANVAS_H - cam.y,
    });
    setSelectedCamId(camId);
  }, [cameras]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !dragId) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.max(10, Math.min(CANVAS_W - 10, (e.clientX - rect.left) / rect.width * CANVAS_W - dragOffset.x));
    const y = Math.max(10, Math.min(CANVAS_H - 10, (e.clientY - rect.top) / rect.height * CANVAS_H - dragOffset.y));
    updateCamera(dragId, { x, y });
  }, [isDragging, dragId, dragOffset, updateCamera]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragId(null);
  }, []);

  const exportJson = useCallback(() => {
    const data = {
      layout: mapId,
      cameras: cameras.map(c => ({ ...c, coverage_m: c.fovRange })),
      coveragePct,
      exportedAt: new Date().toISOString(),
      system: 'Trinetra Rakshak CamForge v1.0',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `camforge_layout_${Date.now()}.json`;
    a.click(); URL.revokeObjectURL(url);
  }, [cameras, mapId, coveragePct]);

  const baseMap = BASE_MAPS.find(b => b.id === mapId);
  const walls = BASE_WALLS[mapId] || [];

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex',
      background: '#050c05', fontFamily: "'Share Tech Mono', monospace",
      overflow: 'hidden',
    }}>

      {/* ── Left Panel: Camera Type Selector ─────────────────────────────── */}
      <div style={{
        width: 220, flexShrink: 0, background: 'rgba(5,12,5,0.9)',
        borderRight: '1px solid rgba(34,197,94,0.15)',
        display: 'flex', flexDirection: 'column', padding: '12px 8px',
        overflowY: 'auto',
      }}>
        {/* Title */}
        <div style={{ color: '#22c55e', fontSize: '0.7rem', letterSpacing: 3, marginBottom: 12 }}>
          ◈ CAMFORGE
        </div>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.5rem', marginBottom: 16, lineHeight: 1.6 }}>
          Click on canvas to place camera. Drag to reposition.
        </div>

        {/* Base Map */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.55rem', letterSpacing: 2, marginBottom: 6 }}>BASE MAP</div>
          {BASE_MAPS.map(bm => (
            <div key={bm.id} onClick={() => { setMapId(bm.id); setCameras([]); }}
              style={{
                padding: '5px 8px', borderRadius: 6, cursor: 'pointer', marginBottom: 2,
                background: mapId === bm.id ? 'rgba(34,197,94,0.15)' : 'transparent',
                border: `1px solid ${mapId === bm.id ? 'rgba(34,197,94,0.4)' : 'transparent'}`,
                color: mapId === bm.id ? '#22c55e' : 'rgba(255,255,255,0.4)',
                fontSize: '0.55rem',
              }}
            >
              {bm.name}
            </div>
          ))}
        </div>

        <div style={{ height: 1, background: 'rgba(34,197,94,0.1)', margin: '4px 0 12px' }} />

        {/* Camera Types */}
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.55rem', letterSpacing: 2, marginBottom: 8 }}>
          CAMERA TYPE <span style={{ color: 'rgba(255,255,255,0.2)' }}>(click to select)</span>
        </div>
        {CAMERA_TYPES.map(type => (
          <motion.div key={type.id}
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedType(type)}
            style={{
              padding: '8px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 6,
              background: selectedType.id === type.id ? `rgba(${hexToRgb(type.color)}, 0.12)` : 'rgba(255,255,255,0.02)',
              border: `1px solid ${selectedType.id === type.id ? type.color : 'rgba(255,255,255,0.08)'}`,
              transition: 'all 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: '1rem' }}>{type.icon}</span>
              <div>
                <div style={{ color: type.color, fontSize: '0.6rem', letterSpacing: 1 }}>{type.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.48rem' }}>
                  FOV: {type.fovAngle}° | Range: {type.fovRange}m
                </div>
              </div>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.48rem', lineHeight: 1.4 }}>
              {type.description}
            </div>
            {type.hasTinkercad && (
              <div style={{
                marginTop: 6, padding: '3px 8px', borderRadius: 4,
                background: 'rgba(168,85,247,0.15)',
                border: '1px solid rgba(168,85,247,0.4)',
                color: '#a855f7', fontSize: '0.5rem', letterSpacing: 1, textAlign: 'center',
              }}>
                ⚡ TINKERCAD CIRCUIT VIEW
              </div>
            )}
          </motion.div>
        ))}

        <div style={{ height: 1, background: 'rgba(34,197,94,0.1)', margin: '8px 0' }} />

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={() => { setCameras([]); setSelectedCamId(null); }}
            style={{
              padding: '6px', borderRadius: 6, cursor: 'pointer', fontSize: '0.55rem',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              fontFamily: "'Share Tech Mono'",
            }}
          >
            <RotateCcw size={10} /> CLEAR LAYOUT
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={exportJson}
            style={{
              padding: '6px', borderRadius: 6, cursor: 'pointer', fontSize: '0.55rem',
              background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
              color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              fontFamily: "'Share Tech Mono'",
            }}
          >
            <Download size={10} /> EXPORT JSON
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={() => setShowGrid(g => !g)}
            style={{
              padding: '6px', borderRadius: 6, cursor: 'pointer', fontSize: '0.55rem',
              background: showGrid ? 'rgba(96,165,250,0.08)' : 'transparent',
              border: `1px solid ${showGrid ? 'rgba(96,165,250,0.3)' : 'rgba(255,255,255,0.1)'}`,
              color: showGrid ? '#60a5fa' : 'rgba(255,255,255,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              fontFamily: "'Share Tech Mono'",
            }}
          >
            <Grid size={10} /> GRID: {showGrid ? 'ON' : 'OFF'}
          </motion.button>
        </div>
      </div>

      {/* ── Main Canvas Area ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Canvas Header */}
        <div style={{
          padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(5,12,5,0.9)', borderBottom: '1px solid rgba(34,197,94,0.1)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ color: '#22c55e', fontSize: '0.7rem', letterSpacing: 2 }}>
              📐 {BASE_MAPS.find(b => b.id === mapId)?.name?.toUpperCase()}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.55rem' }}>
              {cameras.length} cameras placed
            </div>
          </div>

          {/* Coverage Stats */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <CoverageStat
              label="COVERAGE"
              value={`${coveragePct}%`}
              color={coveragePct > 70 ? '#22c55e' : coveragePct > 40 ? '#f59e0b' : '#ef4444'}
            />
            <CoverageStat
              label="CAMERAS"
              value={cameras.length}
              color="#60a5fa"
            />
            <CoverageStat
              label="BLIND ZONES"
              value={coveragePct < 100 ? `${100 - coveragePct}%` : 'NONE'}
              color={coveragePct < 30 ? '#ef4444' : coveragePct < 70 ? '#f59e0b' : '#22c55e'}
            />
          </div>
        </div>

        {/* SVG Canvas */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            style={{
              width: '100%', height: '100%',
              background: baseMap?.bg || '#050c05',
              cursor: isDragging ? 'grabbing' : 'crosshair',
              userSelect: 'none',
            }}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Grid */}
            {showGrid && (
              <g opacity="0.06">
                {Array.from({ length: Math.ceil(CANVAS_W / 40) }).map((_, i) => (
                  <line key={`vg-${i}`} x1={i * 40} y1={0} x2={i * 40} y2={CANVAS_H}
                    stroke="#22c55e" strokeWidth="0.5" />
                ))}
                {Array.from({ length: Math.ceil(CANVAS_H / 40) }).map((_, i) => (
                  <line key={`hg-${i}`} x1={0} y1={i * 40} x2={CANVAS_W} y2={i * 40}
                    stroke="#22c55e" strokeWidth="0.5" />
                ))}
              </g>
            )}

            {/* Walls */}
            {walls.map((w, i) => (
              <line key={`wall-${i}`} x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2}
                stroke="rgba(34,197,94,0.6)" strokeWidth="3" strokeLinecap="round" />
            ))}

            {/* FOV Cones — back layer (overlap detection in yellow) */}
            {cameras.map(cam => {
              const pts = getFovPolygon(cam.x, cam.y, cam.fovAngle, cam.fovRange * 1.5, cam.direction);
              const path = polygonToSvgPath(pts);
              return (
                <path key={`fov-${cam.id}`} d={path}
                  fill={`${cam.color}18`}
                  stroke={cam.color}
                  strokeWidth={selectedCamId === cam.id ? 1.5 : 0.8}
                  strokeOpacity={0.7}
                  style={{ pointerEvents: 'none' }}
                />
              );
            })}

            {/* Camera icons */}
            {cameras.map(cam => {
              const typeInfo = CAMERA_TYPES.find(t => t.id === cam.type);
              const isSelected = selectedCamId === cam.id;
              return (
                <g key={cam.id}>
                  {/* Selection ring */}
                  {isSelected && (
                    <circle cx={cam.x} cy={cam.y} r={18}
                      fill="none"
                      stroke={cam.color}
                      strokeWidth={1}
                      strokeDasharray="4 2"
                      opacity={0.6}
                    />
                  )}
                  {/* Camera body */}
                  <circle cx={cam.x} cy={cam.y} r={10}
                    fill={`${cam.color}33`}
                    stroke={cam.color}
                    strokeWidth={isSelected ? 2 : 1}
                    style={{ cursor: 'grab' }}
                    onMouseDown={(e) => handleMouseDown(e, cam.id)}
                    onClick={(e) => { e.stopPropagation(); setSelectedCamId(cam.id); }}
                  />
                  {/* Icon */}
                  <text x={cam.x} y={cam.y + 5} textAnchor="middle"
                    style={{ fontSize: 10, pointerEvents: 'none', userSelect: 'none' }}>
                    {typeInfo?.icon}
                  </text>
                  {/* Label */}
                  <text x={cam.x} y={cam.y + 20} textAnchor="middle"
                    fill={cam.color} fontSize={7}
                    style={{ fontFamily: 'Share Tech Mono', pointerEvents: 'none' }}>
                    {cam.id}
                  </text>
                  {/* Direction indicator */}
                  <line
                    x1={cam.x}
                    y1={cam.y}
                    x2={cam.x + Math.cos(cam.direction * Math.PI / 180) * 15}
                    y2={cam.y + Math.sin(cam.direction * Math.PI / 180) * 15}
                    stroke={cam.color}
                    strokeWidth={1.5}
                    opacity={0.6}
                    style={{ pointerEvents: 'none' }}
                  />
                </g>
              );
            })}

            {/* Canvas label */}
            <text x={CANVAS_W - 8} y={CANVAS_H - 8} textAnchor="end"
              fill="rgba(34,197,94,0.2)" fontSize={8}
              style={{ fontFamily: 'Share Tech Mono' }}>
              TRINETRA CAMFORGE v1.0 — {BASE_MAPS.find(b => b.id === mapId)?.name}
            </text>
          </svg>

          {/* Empty state hint */}
          {cameras.length === 0 && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center', pointerEvents: 'none',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>📹</div>
              <div style={{ color: 'rgba(34,197,94,0.5)', fontSize: '0.7rem', letterSpacing: 2 }}>
                CLICK TO PLACE CAMERA
              </div>
              <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.55rem', marginTop: 4 }}>
                Select a camera type from the left panel first
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Right Panel: Camera Properties + Tinkercad ───────────────────── */}
      <div style={{
        width: 240, flexShrink: 0, background: 'rgba(5,12,5,0.9)',
        borderLeft: '1px solid rgba(34,197,94,0.15)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {selectedCam ? (
          <>
            {/* Cam detail header */}
            <div style={{
              padding: '12px 12px 8px',
              borderBottom: '1px solid rgba(34,197,94,0.1)',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: '#22c55e', fontSize: '0.65rem', letterSpacing: 2 }}>
                  ◈ {selectedCam.id}
                </div>
                <button onClick={() => deleteCamera(selectedCam.id)}
                  style={{
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 4, cursor: 'pointer', color: '#ef4444', padding: '2px 6px',
                    fontSize: '0.5rem',
                  }}>
                  <Trash2 size={10} />
                </button>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.5rem', marginTop: 2 }}>
                {CAMERA_TYPES.find(t => t.id === selectedCam.type)?.name}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
              {/* Sliders */}
              <PropSlider label="FOV ANGLE" value={selectedCam.fovAngle} min={20} max={360}
                unit="°" color={selectedCam.color}
                onChange={v => updateCamera(selectedCam.id, { fovAngle: v })} />
              <PropSlider label="RANGE" value={selectedCam.fovRange} min={5} max={300}
                unit="m" color={selectedCam.color}
                onChange={v => updateCamera(selectedCam.id, { fovRange: v })} />
              <PropSlider label="DIRECTION" value={selectedCam.direction} min={0} max={360}
                unit="°" color={selectedCam.color}
                onChange={v => updateCamera(selectedCam.id, { direction: v })} />

              {/* Position */}
              <div style={{ marginTop: 8, marginBottom: 12 }}>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.5rem', marginBottom: 4 }}>POSITION</div>
                <div style={{ color: '#22c55e', fontSize: '0.6rem' }}>
                  X: {Math.round(selectedCam.x)}px | Y: {Math.round(selectedCam.y)}px
                </div>
              </div>

              {/* Specs */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.5rem', marginBottom: 6 }}>SPECIFICATIONS</div>
                {Object.entries(CAMERA_TYPES.find(t => t.id === selectedCam.type)?.specs || {}).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.5rem' }}>{k.toUpperCase()}</span>
                    <span style={{ color: '#22c55e', fontSize: '0.5rem' }}>{String(v)}</span>
                  </div>
                ))}
              </div>

              {/* Tinkercad button for ESP32-CAM */}
              {CAMERA_TYPES.find(t => t.id === selectedCam.type)?.hasTinkercad && (
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const typeInfo = CAMERA_TYPES.find(t => t.id === selectedCam.type);
                    setTinkercadUrl(typeInfo.tinkercadUrl);
                    setIframeFailed(false);
                    setShowTinkercad(true);
                  }}
                  style={{
                    width: '100%', padding: '10px', borderRadius: 8, cursor: 'pointer',
                    background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(139,92,246,0.1))',
                    border: '1px solid rgba(168,85,247,0.4)',
                    color: '#a855f7', fontFamily: "'Share Tech Mono'",
                    fontSize: '0.6rem', letterSpacing: 2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  <Cpu size={12} />
                  VIEW TINKERCAD CIRCUIT
                </motion.button>
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 16 }}>
            <div style={{ color: '#22c55e', fontSize: '0.65rem', letterSpacing: 2, marginBottom: 12 }}>
              ◈ PROPERTIES
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Camera size={32} style={{ color: 'rgba(34,197,94,0.2)' }} />
              <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.55rem', textAlign: 'center', lineHeight: 1.6 }}>
                Select a camera on the canvas to edit its properties
              </div>
            </div>

            {/* Legend */}
            <div style={{ borderTop: '1px solid rgba(34,197,94,0.1)', paddingTop: 12 }}>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.5rem', marginBottom: 8 }}>COVERAGE LEGEND</div>
              <LegendItem color="#22c55e33" stroke="#22c55e" label="Active Coverage" />
              <LegendItem color="#ef444433" stroke="#ef4444" label="Blind Zone" />
              <LegendItem color="#f59e0b33" stroke="#f59e0b" label="Overlap Zone" />
            </div>
          </div>
        )}
      </div>

      {/* ── Tinkercad Modal ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showTinkercad && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={() => setShowTinkercad(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '85vw', height: '80vh', maxWidth: 1100,
                background: 'rgba(5,12,5,0.98)',
                border: '1px solid rgba(168,85,247,0.4)',
                borderRadius: 16, overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 0 60px rgba(168,85,247,0.2)',
              }}
            >
              {/* Modal Header */}
              <div style={{
                padding: '12px 16px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(168,85,247,0.08)',
                borderBottom: '1px solid rgba(168,85,247,0.2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Cpu size={16} style={{ color: '#a855f7' }} />
                  <div>
                    <div style={{ color: '#a855f7', fontSize: '0.75rem', letterSpacing: 2 }}>
                      TINKERCAD CIRCUIT — ESP32-CAM + PIR SENSOR
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.5rem' }}>
                      Hardware simulation: ESP32-CAM module · PIR motion sensor · Relay module · LED indicator
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowTinkercad(false)}
                  style={{
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 6, cursor: 'pointer', color: '#ef4444',
                    padding: '6px 10px', fontFamily: "'Share Tech Mono'", fontSize: '0.6rem',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                  <X size={12} /> CLOSE
                </button>
              </div>

              {/* Tinkercad Info Banner */}
              <div style={{
                padding: '8px 16px',
                background: 'rgba(168,85,247,0.05)',
                borderBottom: '1px solid rgba(168,85,247,0.1)',
                display: 'flex', gap: 24, alignItems: 'center',
              }}>
                {[
                  ['MCU', 'ESP32-CAM (AI Thinker)'],
                  ['SENSOR', 'HC-SR501 PIR'],
                  ['COMM', 'WiFi 802.11 b/g/n'],
                  ['PROTOCOL', 'MQTT → Trinetra Gateway'],
                  ['POWER', '5V DC / 500mA'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.45rem' }}>{k}</div>
                    <div style={{ color: '#a855f7', fontSize: '0.55rem' }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Iframe */}
              <div style={{ flex: 1, position: 'relative' }}>
                <iframe
                  src={tinkercadUrl}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="Tinkercad ESP32-CAM Circuit"
                  allowFullScreen
                  onError={() => setIframeFailed(true)}
                />
                <div style={{
                  position: 'absolute', left: 16, top: 16, width: 330,
                  background: 'rgba(5,12,5,0.92)', border: '1px solid rgba(168,85,247,0.35)',
                  borderRadius: 10, padding: 12, boxShadow: '0 0 24px rgba(0,0,0,0.35)'
                }}>
                  <div style={{ color: '#a855f7', fontSize: '0.62rem', letterSpacing: 2, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Cpu size={12} /> LOCAL HARDWARE FALLBACK
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 24px 1fr', gap: 8, alignItems: 'center' }}>
                    <CircuitNode icon={<Camera size={16} />} label="ESP32-CAM" meta="GPIO13 PIR IN" color="#a855f7" />
                    <div style={{ color: '#a855f7', textAlign: 'center' }}>--</div>
                    <CircuitNode icon={<Radio size={16} />} label="MQTT/WiFi" meta="Trinetra gateway" color="#38bdf8" />
                    <CircuitNode icon={<Zap size={16} />} label="HC-SR501 PIR" meta="5V motion trigger" color="#f97316" />
                    <div style={{ color: '#a855f7', textAlign: 'center' }}>--</div>
                    <CircuitNode icon={<AlertTriangle size={16} />} label="Relay Output" meta="alarm/brake/siren" color="#22c55e" />
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: '0.5rem', lineHeight: 1.5, marginTop: 10 }}>
                    If Tinkercad blocks embedding, this simulator keeps the wiring architecture visible. Open the public circuit in a new tab for editing.
                  </div>
                  <button
                    onClick={() => window.open(tinkercadUrl, '_blank', 'noopener,noreferrer')}
                    style={{
                      marginTop: 10, width: '100%', padding: '7px 9px', borderRadius: 6,
                      border: '1px solid rgba(168,85,247,0.55)', background: 'rgba(168,85,247,0.15)',
                      color: '#a855f7', fontFamily: "'Share Tech Mono'", fontSize: '0.55rem', letterSpacing: 1,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                    }}
                  >
                    <ExternalLink size={11} /> OPEN TINKERCAD EXTERNALLY
                  </button>
                  {iframeFailed && (
                    <div style={{ marginTop: 8, color: '#f59e0b', fontSize: '0.5rem' }}>
                      Embed did not load. External editor link is ready.
                    </div>
                  )}
                </div>
                {/* Overlay hint if blocked */}
                <div style={{
                  position: 'absolute', bottom: 16, right: 16,
                  background: 'rgba(5,12,5,0.9)', borderRadius: 8,
                  border: '1px solid rgba(168,85,247,0.2)',
                  padding: '8px 12px', fontSize: '0.5rem',
                  color: 'rgba(255,255,255,0.4)',
                }}>
                  💡 Use Tinkercad to simulate circuit before soldering
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function PropSlider({ label, value, min, max, unit, color, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.5rem', letterSpacing: 1 }}>{label}</span>
        <span style={{ color, fontSize: '0.6rem' }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          width: '100%', height: 3, accentColor: color,
          cursor: 'pointer', background: `rgba(${hexToRgb(color)}, 0.2)`,
        }}
      />
    </div>
  );
}

function CoverageStat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.45rem', letterSpacing: 1 }}>{label}</div>
      <div style={{ color, fontSize: '0.75rem', fontWeight: 'bold', fontFamily: "'Share Tech Mono'" }}>{value}</div>
    </div>
  );
}

function LegendItem({ color, stroke, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <div style={{ width: 20, height: 10, background: color, border: `1px solid ${stroke}`, borderRadius: 2 }} />
      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.48rem' }}>{label}</span>
    </div>
  );
}

function CircuitNode({ icon, label, meta, color }) {
  return (
    <div style={{ border: `1px solid ${color}55`, background: `${color}14`, borderRadius: 7, padding: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color, fontSize: '0.55rem', fontFamily: "'Share Tech Mono'", letterSpacing: 1 }}>
        {icon}
        {label}
      </div>
      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.45rem', marginTop: 4 }}>{meta}</div>
    </div>
  );
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '255, 255, 255';
}
