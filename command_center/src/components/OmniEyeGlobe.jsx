/**
 * OmniEye — OSIRIS-Inspired Layered Intelligence Map
 * Trinetra Rakshak OSIRIS Module
 *
 * Features:
 * - OSIRIS-style left layer-toggle dock (8 defense layers)
 * - Right utility tool panel
 * - Real ADS-B flights (OpenSky Network)
 * - Real USGS earthquakes
 * - Day/night terminator (SunCalc)
 * - CCTV node pings
 * - Border posts status
 * - Maritime simulation
 * - Subsea cables (Indian Ocean region)
 * - Bottom status bar with live coordinates + entities count
 * - OSIRIS aesthetic: dark tactical gold/cyan theme
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapContainer, TileLayer, CircleMarker, Polyline,
  Popup, useMapEvents, useMap, LayerGroup
} from 'react-leaflet';
import {
  Shield, Plane, Ship, Satellite, Camera, CloudLightning,
  AlertTriangle, Cable, Globe, Layers, Eye, ChevronRight,
  ChevronLeft, Wifi, Activity, Radio, LayoutGrid, Map as MapIcon,
  ZoomIn, ZoomOut, Crosshair, Info, Maximize2
} from 'lucide-react';
import { useADSB } from '../lib/useADSB';
import { useSeismic } from '../lib/useSeismic';

// ── Day/Night Terminator (SunCalc-based polygon) ─────────────────────────────
function computeDayNightOverlay() {
  // Returns a set of lat/lng points forming the solar terminator
  const now = new Date();
  const jd = now / 86400000 + 2440587.5;
  const n = jd - 2451545.0;
  const L = (280.46 + 0.9856474 * n) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360) * Math.PI / 180;
  const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * Math.PI / 180;
  const epsilon = 23.439 * Math.PI / 180;
  const delta = Math.asin(Math.sin(epsilon) * Math.sin(lambda));

  // Hour angle of terminator
  const gmst = (18.697374558 + 24.06570982441908 * n) % 24;
  const sunLon = -(gmst / 24) * 360 - 180;

  // Generate terminator arc
  const points = [];
  for (let lat = -90; lat <= 90; lat += 2) {
    const latRad = lat * Math.PI / 180;
    let lon;
    const cosH = -Math.tan(latRad) * Math.tan(delta);
    if (cosH < -1) { lon = 180; }
    else if (cosH > 1) { lon = -180; }
    else { lon = Math.acos(cosH) * 180 / Math.PI; }
    points.push([lat, sunLon - lon]);
    points.push([lat, sunLon + lon]);
  }

  // Night-side polygon (simplified: cover western hemisphere from terminator)
  const terminatorLine = [];
  for (let lat = -90; lat <= 90; lat += 3) {
    const latRad = lat * Math.PI / 180;
    const cosH = -Math.tan(latRad) * Math.tan(delta);
    let lon;
    if (cosH < -1) lon = 0;
    else if (cosH > 1) lon = 0;
    else lon = sunLon + Math.acos(cosH) * 180 / Math.PI;
    terminatorLine.push([lat, lon > 180 ? lon - 360 : lon]);
  }
  // Close polygon
  terminatorLine.push([90, 180], [90, -180], [-90, -180]);

  return terminatorLine;
}

// ── Subsea Cable Routes (Indian Ocean / South Asia region) ────────────────────
const CABLE_ROUTES = [
  { name: 'SEA-ME-WE 4', color: '#00bcd4', path: [[22, 69], [12, 53], [8, 77], [1, 104]] },
  { name: 'SEA-ME-WE 5', color: '#0097a7', path: [[22, 68], [11, 45], [6, 80], [-1, 104]] },
  { name: 'Bay of Bengal Gateway', color: '#26c6da', path: [[22, 88], [12, 80], [8, 77], [5, 80], [1, 104]] },
  { name: 'FALCON Cable', color: '#00acc1', path: [[25, 57], [22, 65], [19, 73], [7, 77]] },
  { name: 'INDIA-ME-WE', color: '#006064', path: [[21, 72], [12, 44], [15, 42], [22, 39]] },
  { name: 'TATA TGN-IND', color: '#004d40', path: [[22, 72], [14, 76], [9, 80], [6, 80]] },
];

// ── CCTV Node Locations (our project sites) ───────────────────────────────────
const CCTV_NODES = [
  { id: 'CAM-01', name: 'MAIN GATE SEC-7A', lat: 28.636, lon: 77.217, status: 'CLEAR', sector: 'SEC-7A' },
  { id: 'CAM-02', name: 'PERIMETER NORTH', lat: 28.638, lon: 77.219, status: 'ALERT', sector: 'SEC-7A' },
  { id: 'CAM-03', name: 'EAST WATCHTOWER', lat: 28.6375, lon: 77.2208, status: 'CLEAR', sector: 'SEC-7B' },
  { id: 'CAM-04', name: 'COMMAND BUNKER', lat: 28.635, lon: 77.216, status: 'SECURE', sector: 'SEC-7A' },
  { id: 'CAM-05', name: 'SOUTH FENCE LINE', lat: 28.634, lon: 77.218, status: 'CLEAR', sector: 'SEC-7B' },
  { id: 'CAM-06', name: 'RAILWAY-KM-142', lat: 23.8, lon: 86.4, status: 'CLEAR', sector: 'TRACK' },
  { id: 'CAM-07', name: 'MINING-ZONE-JH', lat: 23.71, lon: 86.41, status: 'ALERT', sector: 'GEO-EYE' },
];

// ── Border Post Locations ─────────────────────────────────────────────────────
const BORDER_POSTS = [
  { id: 'POST-ALPHA', name: 'POST-ALPHA (SEC-7)', lat: 31.634, lon: 74.872, status: 'SECURE', color: '#22c55e' },
  { id: 'POST-BRAVO', name: 'POST-BRAVO (SEC-12)', lat: 31.64, lon: 74.877, status: 'SECURE', color: '#22c55e' },
  { id: 'POST-CHARLIE', name: 'POST-CHARLIE (SEC-18)', lat: 31.648, lon: 74.882, status: 'SECURE', color: '#22c55e' },
  { id: 'POST-DELTA', name: 'POST-DELTA (SEC-22)', lat: 31.654, lon: 74.888, status: 'CAUTION', color: '#f59e0b' },
  { id: 'POST-ECHO', name: 'POST-ECHO (SEC-28)', lat: 31.66, lon: 74.893, status: 'SECURE', color: '#22c55e' },
];

// ── Maritime Simulation (Indian Ocean vessels) ────────────────────────────────
const MARITIME_VESSELS = [
  { id: 'V001', name: 'INS VIKRANT', type: 'NAVAL', lat: 9.2, lon: 76.4, heading: 45, speed: 28, flag: '🇮🇳', color: '#22c55e' },
  { id: 'V002', name: 'INS KOLKATA', type: 'DESTROYER', lat: 15.5, lon: 70.3, heading: 120, speed: 32, flag: '🇮🇳', color: '#22c55e' },
  { id: 'V003', name: 'MV MUMBAI STAR', type: 'CARGO', lat: 12.8, lon: 74.8, heading: 200, speed: 18, flag: '🇮🇳', color: '#60a5fa' },
  { id: 'V004', name: 'MT GULF TRADER', type: 'TANKER', lat: 20.1, lon: 66.2, heading: 80, speed: 15, flag: '🇦🇪', color: '#f59e0b' },
  { id: 'V005', name: 'COSCO SHANGHAI', type: 'CONTAINER', lat: 7.5, lon: 79.8, heading: 350, speed: 22, flag: '🇨🇳', color: '#f87171' },
  { id: 'V006', name: 'INS SINDHURATNA', type: 'SUBMARINE', lat: 14.2, lon: 72.9, heading: 270, speed: 18, flag: '🇮🇳', color: '#22c55e' },
  { id: 'V007', name: 'MV ANDAMAN SPIRIT', type: 'FERRY', lat: 11.7, lon: 92.7, heading: 90, speed: 12, flag: '🇮🇳', color: '#60a5fa' },
  { id: 'V008', name: 'UNKNOWN VESSEL', type: 'UNKNOWN', lat: 22.5, lon: 65.8, heading: 145, speed: 8, flag: '❓', color: '#ef4444' },
];

// ── Global Incidents (simulated GDELT-style) ──────────────────────────────────
const GLOBAL_INCIDENTS = [
  { id: 'INC-01', type: 'BORDER', title: 'Ceasefire Violation — LOC', lat: 33.5, lon: 74.6, severity: 'CRITICAL', color: '#ef4444' },
  { id: 'INC-02', type: 'SMUGGLING', title: 'Drug Seizure — Gujarat Coast', lat: 21.5, lon: 69.4, severity: 'HIGH', color: '#f59e0b' },
  { id: 'INC-03', type: 'CYBER', title: 'Intrusion Attempt — Gov Network', lat: 28.6, lon: 77.2, severity: 'HIGH', color: '#f59e0b' },
  { id: 'INC-04', type: 'PROTEST', title: 'Civil Unrest — Manipur', lat: 24.8, lon: 93.9, severity: 'MODERATE', color: '#fbbf24' },
  { id: 'INC-05', type: 'FLOOD', title: 'Flood Alert — Assam', lat: 26.2, lon: 91.7, severity: 'HIGH', color: '#f59e0b' },
  { id: 'INC-06', type: 'MARITIME', title: 'Unidentified Vessel — Arabian Sea', lat: 22.5, lon: 65.8, severity: 'CRITICAL', color: '#ef4444' },
];

// ── Map coordinate tracker ────────────────────────────────────────────────────
function MapEventTracker({ onMove }) {
  useMapEvents({
    mousemove(e) { onMove(e.latlng.lat, e.latlng.lng); },
    zoom(e) { onMove(null, null, e.target.getZoom()); },
  });
  return null;
}

// ── Map ref controller ────────────────────────────────────────────────────────
function MapController({ mapRef }) {
  const map = useMap();
  useEffect(() => { mapRef.current = map; }, [map, mapRef]);
  return null;
}

// ── Layer definition ──────────────────────────────────────────────────────────
const LAYER_DEFS = [
  { id: 'border_posts', icon: Shield, label: 'BORDER POSTS', color: '#22c55e', count: BORDER_POSTS.length },
  { id: 'airspace', icon: Plane, label: 'AIRSPACE', color: '#60a5fa', count: null },
  { id: 'maritime', icon: Ship, label: 'MARITIME', color: '#06b6d4', count: MARITIME_VESSELS.length },
  { id: 'incidents', icon: AlertTriangle, label: 'INCIDENTS', color: '#ef4444', count: GLOBAL_INCIDENTS.length },
  { id: 'earthquakes', icon: Activity, label: 'SEISMIC', color: '#f59e0b', count: null },
  { id: 'day_night', icon: Globe, label: 'DAY/NIGHT', color: '#7c3aed', count: null },
  { id: 'cables', icon: Cable, label: 'FIBER CABLES', color: '#00bcd4', count: CABLE_ROUTES.length },
  { id: 'cctv_nodes', icon: Camera, label: 'CCTV NODES', color: '#ec4899', count: CCTV_NODES.length },
];

// ── Right Tool Defs ───────────────────────────────────────────────────────────
const RIGHT_TOOLS = [
  { id: 'intel', icon: Eye, label: 'THREAT INTEL' },
  { id: 'signals', icon: Wifi, label: 'SIGNAL INTEL' },
  { id: 'stats', icon: Activity, label: 'STATISTICS' },
  { id: 'alerts', icon: AlertTriangle, label: 'LIVE ALERTS' },
  { id: 'scan', icon: Crosshair, label: 'AREA SCAN' },
  { id: 'satellite', icon: Satellite, label: 'SAT IMAGERY' },
  { id: 'comms', icon: Radio, label: 'COMMS NET' },
  { id: 'grid', icon: LayoutGrid, label: 'GRID OVERLAY' },
];

export default function OmniEyeGlobe({ detectionData, postNetwork }) {
  const [activeLayers, setActiveLayers] = useState({
    border_posts: true,
    airspace: true,
    maritime: true,
    incidents: true,
    earthquakes: true,
    day_night: true,
    cables: true,
    cctv_nodes: true,
  });
  const [layerPanelOpen, setLayerPanelOpen] = useState(true);
  const [mapStyle, setMapStyle] = useState('MAP'); // MAP | SAT
  const [cursor, setCursor] = useState({ lat: 20.5937, lon: 78.9629, zoom: 5 });
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [tickerItems, setTickerItems] = useState([]);
  const [pulseVessels, setPulseVessels] = useState(false);
  const mapRef = useRef(null);
  const dayNightRef = useRef(null);

  // Real data hooks
  const { flights, source: flightSource } = useADSB(activeLayers.airspace, 60000);
  const { quakes, source: quakeSource } = useSeismic(activeLayers.earthquakes, 120000);

  // Day/Night terminator
  const [dayNightPoints, setDayNightPoints] = useState([]);
  useEffect(() => {
    if (!activeLayers.day_night) return;
    const update = () => setDayNightPoints(computeDayNightOverlay());
    update();
    dayNightRef.current = setInterval(update, 60000);
    return () => clearInterval(dayNightRef.current);
  }, [activeLayers.day_night]);

  // Pulse vessels
  useEffect(() => {
    const t = setInterval(() => setPulseVessels(p => !p), 1500);
    return () => clearInterval(t);
  }, []);

  // Build ticker from live data
  useEffect(() => {
    const items = [
      ...quakes.slice(0, 5).map(q => ({
        id: q.id, color: q.color,
        text: `🔴 M${q.mag?.toFixed(1)} ${q.place}`,
      })),
      ...GLOBAL_INCIDENTS.map(i => ({
        id: i.id, color: i.color,
        text: `⚡ ${i.type}: ${i.title}`,
      })),
      { id: 'sys1', color: '#22c55e', text: `✅ ${flights.length} aircraft tracked — ${flightSource === 'LIVE' ? 'OpenSky LIVE' : 'Simulated'}` },
      { id: 'sys2', color: '#06b6d4', text: `🚢 ${MARITIME_VESSELS.length} vessels in Indian Ocean` },
      { id: 'sys3', color: '#ec4899', text: `📡 ${CCTV_NODES.length} CCTV nodes online — Trinetra Grid` },
      { id: 'sys4', color: '#7c3aed', text: `🌍 Day/Night Terminator — Solar position LIVE` },
    ];
    setTickerItems(items);
  }, [quakes, flights, flightSource]);

  const toggleLayer = useCallback((id) => {
    setActiveLayers(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const activeCount = Object.values(activeLayers).filter(Boolean).length;
  const totalEntities = (activeLayers.airspace ? flights.length : 0) +
    (activeLayers.maritime ? MARITIME_VESSELS.length : 0) +
    (activeLayers.border_posts ? BORDER_POSTS.length : 0) +
    (activeLayers.cctv_nodes ? CCTV_NODES.length : 0) +
    (activeLayers.earthquakes ? quakes.length : 0) +
    (activeLayers.incidents ? GLOBAL_INCIDENTS.length : 0);

  const tileUrl = mapStyle === 'SAT'
    ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      background: '#050811', display: 'flex', flexDirection: 'column',
      fontFamily: "'Share Tech Mono', monospace",
    }}>

      {/* ── OSIRIS-Style Header Bar ──────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px',
        background: 'rgba(5, 8, 20, 0.95)',
        borderBottom: '1px solid rgba(255, 215, 0, 0.15)',
        zIndex: 10, flexShrink: 0,
      }}>
        {/* Left: Trinetra Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: '1.3rem', filter: 'drop-shadow(0 0 8px #ffd700)' }}>🛡️</div>
          <div>
            <div style={{ color: '#ffd700', fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: 3 }}>
              TRINETRA — OMNI EYE
            </div>
            <div style={{ color: 'rgba(255,215,0,0.4)', fontSize: '0.5rem', letterSpacing: 2 }}>
              REAL-TIME DEFENSE INTELLIGENCE · BORDER · AIRSPACE · MARITIME · CCTV · SEISMIC
            </div>
          </div>
        </div>

        {/* Center: Status */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <OsirisStat label="IST" value={new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' })} color="#00e5ff" />
          <OsirisStat label="STATUS" value="LIVE" color="#14f195" pulse />
          <OsirisStat label="LAYERS" value={activeCount} color="#00e5ff" />
          <OsirisStat label="ENTITIES" value={totalEntities.toLocaleString()} color="#00e5ff" />
          <OsirisStat label="VER" value="5.1" color="rgba(255,255,255,0.3)" />
        </div>

        {/* Right: Action buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          {['MAP', 'SAT'].map(s => (
            <button key={s} onClick={() => setMapStyle(s)} style={{
              padding: '3px 12px', borderRadius: 20, cursor: 'pointer', fontSize: '0.6rem',
              border: `1px solid ${mapStyle === s ? '#ffd700' : 'rgba(255,215,0,0.2)'}`,
              background: mapStyle === s ? 'rgba(255,215,0,0.15)' : 'transparent',
              color: mapStyle === s ? '#ffd700' : 'rgba(255,215,0,0.4)',
              letterSpacing: 2, fontFamily: "'Share Tech Mono'",
            }}>{s}</button>
          ))}
        </div>
      </div>

      {/* ── Map Area ────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        {/* Left Layer Dock */}
        <div style={{
          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
          zIndex: 500, display: 'flex', flexDirection: 'column', gap: 4,
          background: 'rgba(5, 8, 20, 0.9)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,215,0,0.1)',
          borderLeft: 'none', borderRadius: '0 12px 12px 0',
          padding: '12px 8px',
        }}>
          {LAYER_DEFS.map(layer => {
            const Icon = layer.icon;
            const isActive = activeLayers[layer.id];
            const cnt = layer.id === 'airspace' ? flights.length :
                        layer.id === 'earthquakes' ? quakes.length : layer.count;
            return (
              <div key={layer.id} style={{ position: 'relative' }}>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggleLayer(layer.id)}
                  title={layer.label}
                  style={{
                    width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
                    background: isActive ? `rgba(${hexToRgb(layer.color)}, 0.15)` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isActive ? layer.color : 'rgba(255,255,255,0.1)'}`,
                    color: isActive ? layer.color : 'rgba(255,255,255,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? `0 0 12px rgba(${hexToRgb(layer.color)}, 0.3)` : 'none',
                  }}
                >
                  <Icon size={16} />
                </motion.button>
                {isActive && cnt != null && cnt > 0 && (
                  <div style={{
                    position: 'absolute', top: -4, right: -4,
                    background: '#00e5ff', color: '#000',
                    fontSize: '0.5rem', fontWeight: 'bold',
                    borderRadius: '50%', width: 16, height: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Share Tech Mono'",
                  }}>
                    {cnt > 99 ? '99+' : cnt}
                  </div>
                )}
              </div>
            );
          })}

          {/* Layer panel toggle */}
          <div style={{ width: '100%', height: 1, background: 'rgba(255,215,0,0.1)', margin: '4px 0' }} />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setLayerPanelOpen(p => !p)}
            style={{
              width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
              background: 'rgba(255,215,0,0.08)',
              border: '1px solid rgba(255,215,0,0.2)',
              color: '#ffd700',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Layers size={16} />
          </motion.button>
        </div>

        {/* Layer Info Panel */}
        <AnimatePresence>
          {layerPanelOpen && (
            <motion.div
              initial={{ x: -280, opacity: 0 }} animate={{ x: 44, opacity: 1 }} exit={{ x: -280, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              style={{
                position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                zIndex: 499, width: 220,
                background: 'rgba(5, 8, 20, 0.95)', backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,215,0,0.1)', borderLeft: 'none',
                borderRadius: '0 12px 12px 0', padding: '16px 12px',
              }}
            >
              <div style={{ color: '#ffd700', fontSize: '0.6rem', letterSpacing: 3, marginBottom: 12 }}>
                ◈ LAYER CONTROL
              </div>
              {LAYER_DEFS.map(layer => {
                const isActive = activeLayers[layer.id];
                const cnt = layer.id === 'airspace' ? flights.length :
                            layer.id === 'earthquakes' ? quakes.length : layer.count;
                return (
                  <div key={layer.id}
                    onClick={() => toggleLayer(layer.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '6px 8px', borderRadius: 6, cursor: 'pointer', marginBottom: 2,
                      background: isActive ? `rgba(${hexToRgb(layer.color)}, 0.08)` : 'transparent',
                      border: `1px solid ${isActive ? `rgba(${hexToRgb(layer.color)}, 0.2)` : 'transparent'}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    {/* Toggle */}
                    <div style={{
                      width: 28, height: 14, borderRadius: 7,
                      background: isActive ? layer.color : 'rgba(255,255,255,0.1)',
                      position: 'relative', transition: 'all 0.2s', flexShrink: 0,
                    }}>
                      <div style={{
                        position: 'absolute', top: 2,
                        left: isActive ? 16 : 2,
                        width: 10, height: 10, borderRadius: '50%',
                        background: '#fff', transition: 'left 0.2s',
                      }} />
                    </div>
                    <div>
                      <div style={{ color: isActive ? layer.color : 'rgba(255,255,255,0.4)', fontSize: '0.6rem', letterSpacing: 1 }}>
                        {layer.label}
                      </div>
                      {cnt != null && (
                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.5rem' }}>
                          {isActive ? `${cnt} entities` : 'HIDDEN'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Tool Dock */}
        <div style={{
          position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
          zIndex: 500, display: 'flex', flexDirection: 'column', gap: 4,
          background: 'rgba(5, 8, 20, 0.9)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,215,0,0.1)',
          borderRight: 'none', borderRadius: '12px 0 0 12px',
          padding: '12px 8px',
        }}>
          {RIGHT_TOOLS.map(tool => {
            const Icon = tool.icon;
            return (
              <motion.button key={tool.id}
                whileHover={{ scale: 1.1, color: '#00e5ff' }}
                whileTap={{ scale: 0.9 }}
                title={tool.label}
                style={{
                  width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon size={16} />
              </motion.button>
            );
          })}
        </div>

        {/* Map Controls */}
        <div style={{
          position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
          zIndex: 500, display: 'flex', gap: 8, alignItems: 'center',
        }}>
          {/* 3D/2D pill */}
          <div style={{
            background: 'rgba(5,8,20,0.9)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,215,0,0.15)',
            borderRadius: 24, padding: '4px 6px',
            display: 'flex', gap: 4,
          }}>
            {['2D'].map(mode => (
              <div key={mode} style={{
                padding: '4px 14px', borderRadius: 20, fontSize: '0.6rem', cursor: 'pointer',
                background: 'rgba(255,215,0,0.15)', color: '#ffd700',
                border: '1px solid rgba(255,215,0,0.3)', letterSpacing: 2,
                fontFamily: "'Share Tech Mono'",
              }}>{mode}</div>
            ))}
          </div>
        </div>

        {/* Selected entity panel */}
        <AnimatePresence>
          {selectedEntity && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              style={{
                position: 'absolute', top: 12, right: 60, zIndex: 600,
                background: 'rgba(5,8,20,0.95)', backdropFilter: 'blur(16px)',
                border: '1px solid rgba(0,229,255,0.2)', borderRadius: 10,
                padding: '12px 16px', minWidth: 200, maxWidth: 280,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ color: '#00e5ff', fontSize: '0.65rem', letterSpacing: 2 }}>◈ ENTITY DETAIL</div>
                <button onClick={() => setSelectedEntity(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1rem' }}>×</button>
              </div>
              {Object.entries(selectedEntity).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.55rem', letterSpacing: 1 }}>{k.toUpperCase()}</span>
                  <span style={{ color: '#fff', fontSize: '0.6rem' }}>{String(v)}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Leaflet Map */}
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <MapController mapRef={mapRef} />
          <MapEventTracker onMove={(lat, lon, zoom) => {
            setCursor(prev => ({
              lat: lat ?? prev.lat,
              lon: lon ?? prev.lon,
              zoom: zoom ?? prev.zoom,
            }));
          }} />

          <TileLayer url={tileUrl} />

          {/* Day/Night overlay */}
          {activeLayers.day_night && dayNightPoints.length > 0 && (
            <Polyline
              positions={dayNightPoints}
              pathOptions={{ color: '#7c3aed', weight: 2, opacity: 0.6, dashArray: '6 4' }}
            />
          )}

          {/* Subsea Cables */}
          {activeLayers.cables && CABLE_ROUTES.map(cable => (
            <Polyline key={cable.name} positions={cable.path}
              pathOptions={{ color: cable.color, weight: 1.5, opacity: 0.7, dashArray: '8 4' }}
            >
              <Popup>
                <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
                  <b>{cable.name}</b><br />Type: Subsea Fiber Optic
                </div>
              </Popup>
            </Polyline>
          ))}

          {/* Border Posts */}
          {activeLayers.border_posts && BORDER_POSTS.map(post => {
            const netPost = postNetwork?.find(p => p.id === post.id);
            const color = netPost?.color || post.color;
            return (
              <CircleMarker key={post.id} center={[post.lat, post.lon]}
                radius={8} pathOptions={{ color, fillColor: color, fillOpacity: 0.8, weight: 2 }}
                eventHandlers={{ click: () => setSelectedEntity({ id: post.id, name: post.name, status: netPost?.status || post.status, lat: post.lat.toFixed(4), lon: post.lon.toFixed(4) }) }}
              >
                <Popup><b>{post.name}</b><br />Status: {netPost?.status || post.status}</Popup>
              </CircleMarker>
            );
          })}

          {/* CCTV Nodes */}
          {activeLayers.cctv_nodes && CCTV_NODES.map(cam => {
            const color = cam.status === 'ALERT' ? '#ef4444' : cam.status === 'SECURE' ? '#22c55e' : '#ec4899';
            return (
              <CircleMarker key={cam.id} center={[cam.lat, cam.lon]}
                radius={pulseVessels ? 6 : 5}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.9, weight: 1 }}
                eventHandlers={{ click: () => setSelectedEntity({ id: cam.id, name: cam.name, status: cam.status, sector: cam.sector }) }}
              >
                <Popup><b>{cam.id}</b>: {cam.name}<br />Status: {cam.status}</Popup>
              </CircleMarker>
            );
          })}

          {/* Flights */}
          {activeLayers.airspace && flights.map(f => (
            <CircleMarker key={f.icao} center={[f.lat, f.lon]}
              radius={3}
              pathOptions={{ color: '#60a5fa', fillColor: '#60a5fa', fillOpacity: 0.8, weight: 1 }}
              eventHandlers={{ click: () => setSelectedEntity({ callsign: f.callsign, alt: `${f.altitude}m`, speed: `${f.velocity}km/h`, hdg: `${f.heading}°`, country: f.origin_country }) }}
            >
              <Popup><b>{f.callsign}</b><br />Alt: {f.altitude}m | Speed: {f.velocity}km/h</Popup>
            </CircleMarker>
          ))}

          {/* Maritime */}
          {activeLayers.maritime && MARITIME_VESSELS.map(v => (
            <CircleMarker key={v.id} center={[v.lat, v.lon]}
              radius={v.type === 'NAVAL' || v.type === 'DESTROYER' ? 7 : 5}
              pathOptions={{ color: v.color, fillColor: v.color, fillOpacity: 0.85, weight: 2 }}
              eventHandlers={{ click: () => setSelectedEntity({ name: v.name, type: v.type, speed: `${v.speed}kt`, heading: `${v.heading}°`, flag: v.flag }) }}
            >
              <Popup><b>{v.name}</b><br />{v.type} | {v.flag} | {v.speed}kt</Popup>
            </CircleMarker>
          ))}

          {/* Earthquakes */}
          {activeLayers.earthquakes && quakes.map(q => (
            <CircleMarker key={q.id} center={[q.lat, q.lon]}
              radius={Math.max(4, (q.mag || 0) * 2.5)}
              pathOptions={{ color: q.color, fillColor: q.color, fillOpacity: 0.5, weight: 1 }}
              eventHandlers={{ click: () => setSelectedEntity({ mag: q.mag?.toFixed(1), place: q.place, depth: `${q.depth}km`, time: new Date(q.time).toLocaleTimeString() }) }}
            >
              <Popup><b>M{q.mag?.toFixed(1)}</b><br />{q.place}<br />Depth: {q.depth}km</Popup>
            </CircleMarker>
          ))}

          {/* Global Incidents */}
          {activeLayers.incidents && GLOBAL_INCIDENTS.map(inc => (
            <CircleMarker key={inc.id} center={[inc.lat, inc.lon]}
              radius={8}
              pathOptions={{ color: inc.color, fillColor: inc.color, fillOpacity: 0.3, weight: 2, dashArray: '4 2' }}
              eventHandlers={{ click: () => setSelectedEntity({ id: inc.id, type: inc.type, title: inc.title, severity: inc.severity }) }}
            >
              <Popup><b>{inc.type}</b><br />{inc.title}<br />Severity: {inc.severity}</Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Data Source Badge */}
        <div style={{
          position: 'absolute', top: 12, left: 60, zIndex: 600,
          display: 'flex', gap: 6,
        }}>
          <DataBadge label="FLIGHTS" value={flightSource} color={flightSource === 'LIVE' ? '#14f195' : '#f59e0b'} />
          <DataBadge label="SEISMIC" value={quakeSource} color={quakeSource === 'LIVE' ? '#14f195' : '#f59e0b'} />
        </div>
      </div>

      {/* ── OSIRIS-Style Bottom Status Bar ─────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '6px 16px', flexShrink: 0,
        background: 'rgba(5, 8, 20, 0.98)',
        borderTop: '1px solid rgba(255, 215, 0, 0.08)',
        gap: 24, overflow: 'hidden',
      }}>
        {/* Coordinates */}
        <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
          <StatusBarItem label="CURSOR" value={`${cursor.lat.toFixed(4)}°, ${cursor.lon.toFixed(4)}°`} color="#00e5ff" />
          <StatusBarItem label="ZOOM" value={cursor.zoom?.toFixed(1)} color="#00e5ff" />
          <StatusBarItem label="ENTITIES" value={totalEntities} color="#00e5ff" />
        </div>

        {/* Scrolling Ticker */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <div style={{
            display: 'flex', gap: 40, alignItems: 'center',
            animation: 'tickerScroll 30s linear infinite',
            whiteSpace: 'nowrap',
          }}>
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <span key={i} style={{
                color: item.color, fontSize: '0.6rem', letterSpacing: 1,
                fontFamily: "'Share Tech Mono'",
              }}>
                {item.text}
              </span>
            ))}
          </div>
        </div>

        {/* Online status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%', background: '#14f195',
            boxShadow: '0 0 6px #14f195',
            animation: 'breathe 2s ease-in-out infinite',
          }} />
          <span style={{ color: '#14f195', fontSize: '0.6rem', letterSpacing: 2 }}>ONLINE</span>
        </div>
      </div>

      <style>{`
        @keyframes tickerScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function OsirisStat({ label, value, color, pulse }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.45rem', letterSpacing: 2 }}>{label}</div>
      <div style={{
        color, fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: 1,
        animation: pulse ? 'breathe 2s ease-in-out infinite' : 'none',
      }}>{value}</div>
    </div>
  );
}

function StatusBarItem({ label, value, color }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.55rem', letterSpacing: 1 }}>{label}</span>
      <span style={{ color, fontSize: '0.6rem', letterSpacing: 1, fontFamily: "'Share Tech Mono'" }}>{value}</span>
    </div>
  );
}

function DataBadge({ label, value, color }) {
  return (
    <div style={{
      background: 'rgba(5,8,20,0.9)', backdropFilter: 'blur(8px)',
      border: `1px solid ${color}33`,
      borderRadius: 6, padding: '3px 8px',
      display: 'flex', gap: 6, alignItems: 'center',
    }}>
      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.5rem' }}>{label}</span>
      <span style={{ color, fontSize: '0.5rem', fontWeight: 'bold' }}>{value}</span>
    </div>
  );
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '255, 255, 255';
}
