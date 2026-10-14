/**
 * OmniEye — OSIRIS-Inspired Layered Intelligence Map
 * Trinetra Rakshak OSIRIS Module
 *
 * Automated Features:
 * - "Auto Threat Vector Patrol": Automated smooth flyTo cycling across critical defense vectors
 * - Active radar pulse rings around ALERT & CAUTION defense nodes
 * - Interactive Right Utility Panels: Threat Intel, Signal Intel (RF Spectrum), Live Alerts, Statistics
 * - Automated Subcontinent Area Radar Sweep
 * - Real-time Airspace (ADS-B OpenSky) & Seismic (USGS) telemetry sync
 * - Zero-lag, memory-safe throttled timers with full unmount cleanup
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
  ZoomIn, ZoomOut, Crosshair, Info, Maximize2, Play, Pause,
  Target, RefreshCw, X, ArrowUpRight
} from 'lucide-react';
import { useADSB } from '../lib/useADSB';
import { useSeismic } from '../lib/useSeismic';

// ── Day/Night Solar Terminator ───────────────────────────────────────────────
function computeDayNightOverlay() {
  const now = new Date();
  const jd = now / 86400000 + 2440587.5;
  const n = jd - 2451545.0;
  const L = (280.46 + 0.9856474 * n) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360) * Math.PI / 180;
  const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * Math.PI / 180;
  const epsilon = 23.439 * Math.PI / 180;
  const delta = Math.asin(Math.sin(epsilon) * Math.sin(lambda));

  const gmst = (18.697374558 + 24.06570982441908 * n) % 24;
  const sunLon = -(gmst / 24) * 360 - 180;

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
  return points;
}

// ── Subsea Cable Routes ───────────────────────────────────────────────────────
const CABLE_ROUTES = [
  { name: 'SEA-ME-WE 4', color: '#00bcd4', path: [[22, 69], [12, 53], [8, 77], [1, 104]] },
  { name: 'SEA-ME-WE 5', color: '#0097a7', path: [[22, 68], [11, 45], [6, 80], [-1, 104]] },
  { name: 'Bay of Bengal Gateway', color: '#26c6da', path: [[22, 88], [12, 80], [8, 77], [5, 80], [1, 104]] },
  { name: 'FALCON Cable', color: '#00acc1', path: [[25, 57], [22, 65], [19, 73], [7, 77]] },
  { name: 'INDIA-ME-WE', color: '#006064', path: [[21, 72], [12, 44], [15, 42], [22, 39]] },
  { name: 'TATA TGN-IND', color: '#004d40', path: [[22, 72], [14, 76], [9, 80], [6, 80]] },
];

// ── CCTV Nodes ───────────────────────────────────────────────────────────────
const CCTV_NODES = [
  { id: 'CAM-01', name: 'MAIN GATE SEC-7A', lat: 28.636, lon: 77.217, status: 'CLEAR', sector: 'SEC-7A' },
  { id: 'CAM-02', name: 'PERIMETER NORTH', lat: 28.638, lon: 77.219, status: 'ALERT', sector: 'SEC-7A' },
  { id: 'CAM-03', name: 'EAST WATCHTOWER', lat: 28.6375, lon: 77.2208, status: 'CLEAR', sector: 'SEC-7B' },
  { id: 'CAM-04', name: 'COMMAND BUNKER', lat: 28.635, lon: 77.216, status: 'SECURE', sector: 'SEC-7A' },
  { id: 'CAM-05', name: 'SOUTH FENCE LINE', lat: 28.634, lon: 77.218, status: 'CLEAR', sector: 'SEC-7B' },
  { id: 'CAM-06', name: 'RAILWAY-KM-142', lat: 23.8, lon: 86.4, status: 'CLEAR', sector: 'TRACK' },
  { id: 'CAM-07', name: 'MINING-ZONE-JH', lat: 23.71, lon: 86.41, status: 'ALERT', sector: 'GEO-EYE' },
];

// ── Border Posts ─────────────────────────────────────────────────────────────
const BORDER_POSTS = [
  { id: 'POST-ALPHA', name: 'POST-ALPHA (SEC-7)', lat: 31.634, lon: 74.872, status: 'SECURE', color: '#22c55e' },
  { id: 'POST-BRAVO', name: 'POST-BRAVO (SEC-12)', lat: 31.64, lon: 74.877, status: 'SECURE', color: '#22c55e' },
  { id: 'POST-CHARLIE', name: 'POST-CHARLIE (SEC-18)', lat: 31.648, lon: 74.882, status: 'SECURE', color: '#22c55e' },
  { id: 'POST-DELTA', name: 'POST-DELTA (SEC-22)', lat: 31.654, lon: 74.888, status: 'CAUTION', color: '#f59e0b' },
  { id: 'POST-ECHO', name: 'POST-ECHO (SEC-28)', lat: 31.66, lon: 74.893, status: 'SECURE', color: '#22c55e' },
];

// ── Maritime Vessels ─────────────────────────────────────────────────────────
const MARITIME_VESSELS = [
  { id: 'V001', name: 'INS VIKRANT', type: 'NAVAL', lat: 9.2, lon: 76.4, heading: 45, speed: 28, flag: '🇮🇳', color: '#22c55e' },
  { id: 'V002', name: 'INS KOLKATA', type: 'DESTROYER', lat: 15.5, lon: 70.3, heading: 120, speed: 32, flag: '🇮🇳', color: '#22c55e' },
  { id: 'V003', name: 'MV MUMBAI STAR', type: 'CARGO', lat: 12.8, lon: 74.8, heading: 200, speed: 18, flag: '🇮🇳', color: '#60a5fa' },
  { id: 'V004', name: 'MT GULF TRADER', type: 'TANKER', lat: 20.1, lon: 66.2, heading: 80, speed: 15, flag: '🇦🇪', color: '#f59e0b' },
  { id: 'V005', name: 'COSCO SHANGHAI', type: 'CONTAINER', lat: 7.5, lon: 79.8, heading: 350, speed: 22, flag: '🇨🇳', color: '#f87171' },
  { id: 'V006', name: 'INS SINDHURATNA', type: 'SUBMARINE', lat: 14.2, lon: 72.9, heading: 270, speed: 18, flag: '🇮🇳', color: '#22c55e' },
  { id: 'V007', name: 'MV ANDAMAN SPIRIT', type: 'FERRY', lat: 11.7, lon: 92.7, heading: 90, speed: 12, flag: '🇮🇳', color: '#60a5fa' },
  { id: 'V008', name: 'UNKNOWN VESSEL', type: 'HOSTILE', lat: 22.5, lon: 65.8, heading: 145, speed: 8, flag: '❓', color: '#ef4444' },
];

// ── Global Incidents ─────────────────────────────────────────────────────────
const GLOBAL_INCIDENTS = [
  { id: 'INC-01', type: 'BORDER', title: 'Ceasefire Anomaly — LOC Corridor', lat: 33.5, lon: 74.6, severity: 'CRITICAL', color: '#ef4444' },
  { id: 'INC-02', type: 'SMUGGLING', title: 'Maritime Intercept — Gujarat Coast', lat: 21.5, lon: 69.4, severity: 'HIGH', color: '#f59e0b' },
  { id: 'INC-03', type: 'CYBER', title: 'Command Network Intrusion Filtered', lat: 28.6, lon: 77.2, severity: 'HIGH', color: '#f59e0b' },
  { id: 'INC-04', type: 'PROTEST', title: 'Civil Border Alert — Eastern Sector', lat: 24.8, lon: 93.9, severity: 'MODERATE', color: '#fbbf24' },
  { id: 'INC-05', type: 'GEO', title: 'Flooding & Landslide Sensor Alert', lat: 26.2, lon: 91.7, severity: 'HIGH', color: '#f59e0b' },
  { id: 'INC-06', type: 'MARITIME', title: 'Unidentified Vessel V008 Incursion', lat: 22.5, lon: 65.8, severity: 'CRITICAL', color: '#ef4444' },
];

// ── Automated Patrol Waypoints ────────────────────────────────────────────────
const PATROL_WAYPOINTS = [
  { name: 'BORDER POST ALPHA (LOC)', lat: 31.634, lon: 74.872, zoom: 11, desc: 'Primary Demarcation Checkpost · Guard Active' },
  { name: 'PERIMETER NORTH GATE (CAM-02)', lat: 28.638, lon: 77.219, zoom: 14, desc: 'Command Headquarters Sector 7A · Alert Status' },
  { name: 'HOSTILE NAVAL CONTACT (V008)', lat: 22.5, lon: 65.8, zoom: 8, desc: 'Arabian Sea Incursion Zone · Interceptor Staged' },
  { name: 'MINING ZONE KM-142 (JHARKHAND)', lat: 23.71, lon: 86.41, zoom: 11, desc: 'Geo-Eye Ground Vibration Sensor Array' },
  { name: 'FALCON SUBSEA CABLE INTERFACE', lat: 19.0, lon: 72.8, zoom: 8, desc: 'Strategic High-Bandwidth Undersea Defense Fiber' },
];

// ── Map Coordinate Tracker ───────────────────────────────────────────────────
function MapEventTracker({ onMove }) {
  useMapEvents({
    mousemove(e) { onMove(e.latlng.lat, e.latlng.lng); },
    zoom(e) { onMove(null, null, e.target.getZoom()); },
  });
  return null;
}

function MapController({ mapRef }) {
  const map = useMap();
  useEffect(() => { mapRef.current = map; }, [map, mapRef]);
  return null;
}

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

const RIGHT_TOOLS = [
  { id: 'intel', icon: Eye, label: 'THREAT INTEL' },
  { id: 'signals', icon: Wifi, label: 'SIGNAL INTEL' },
  { id: 'stats', icon: Activity, label: 'STATISTICS' },
  { id: 'alerts', icon: AlertTriangle, label: 'LIVE ALERTS' },
  { id: 'scan', icon: Crosshair, label: 'AREA SCAN' },
  { id: 'satellite', icon: Satellite, label: 'TOGGLE SAT' },
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
  const [layerPanelOpen, setLayerPanelOpen] = useState(false);
  const [mapStyle, setMapStyle] = useState('MAP'); // MAP | SAT
  const [cursor, setCursor] = useState({ lat: 20.5937, lon: 78.9629, zoom: 5 });
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [tickerItems, setTickerItems] = useState([]);
  const [activeToolDrawer, setActiveToolDrawer] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  // Automated Patrol States
  const [isAutoPatrol, setIsAutoPatrol] = useState(false);
  const [patrolIndex, setPatrolIndex] = useState(0);
  const [patrolCountdown, setPatrolCountdown] = useState(7);

  const mapRef = useRef(null);
  const patrolTimerRef = useRef(null);
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

  // Automated Threat Vector Patrol (Cycles every 7 seconds)
  useEffect(() => {
    if (!isAutoPatrol) {
      if (patrolTimerRef.current) clearInterval(patrolTimerRef.current);
      return;
    }

    setPatrolCountdown(7);

    patrolTimerRef.current = setInterval(() => {
      setPatrolCountdown(prev => {
        if (prev <= 1) {
          // Advance to next waypoint
          setPatrolIndex(curr => {
            const nextIdx = (curr + 1) % PATROL_WAYPOINTS.length;
            const target = PATROL_WAYPOINTS[nextIdx];
            if (mapRef.current) {
              try {
                mapRef.current.flyTo([target.lat, target.lon], target.zoom, {
                  animate: true,
                  duration: 1.8,
                });
              } catch (e) {
                // Leaflet container detached safeguard
              }
            }
            return nextIdx;
          });
          return 7;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (patrolTimerRef.current) clearInterval(patrolTimerRef.current);
    };
  }, [isAutoPatrol]);

  // Handle fly to arbitrary position
  const handleFlyTo = useCallback((lat, lon, zoom = 10) => {
    if (mapRef.current) {
      try {
        mapRef.current.flyTo([lat, lon], zoom, { animate: true, duration: 1.5 });
      } catch (e) {}
    }
  }, []);

  // Build real-time telemetry ticker
  useEffect(() => {
    const items = [
      ...quakes.slice(0, 4).map(q => ({
        id: q.id, color: q.color,
        text: `🔴 SEISMIC M${q.mag?.toFixed(1)} ${q.place}`,
      })),
      ...GLOBAL_INCIDENTS.map(i => ({
        id: i.id, color: i.color,
        text: `⚡ ${i.type}: ${i.title}`,
      })),
      { id: 'sys1', color: '#22c55e', text: `✅ ${flights.length} aircraft tracked — ${flightSource === 'LIVE' ? 'OpenSky LIVE' : 'Simulated Radar'}` },
      { id: 'sys2', color: '#06b6d4', text: `🚢 ${MARITIME_VESSELS.length} naval units monitoring Indian Ocean` },
      { id: 'sys3', color: '#ec4899', text: `📡 7 CCTV Sentries online — Trinetra Sector 7 Grid` },
    ];
    setTickerItems(items);
  }, [quakes, flights, flightSource]);

  const toggleLayer = useCallback((id) => {
    setActiveLayers(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const totalEntities = (activeLayers.airspace ? flights.length : 0) +
    (activeLayers.maritime ? MARITIME_VESSELS.length : 0) +
    (activeLayers.border_posts ? BORDER_POSTS.length : 0) +
    (activeLayers.cctv_nodes ? CCTV_NODES.length : 0) +
    (activeLayers.earthquakes ? quakes.length : 0) +
    (activeLayers.incidents ? GLOBAL_INCIDENTS.length : 0);

  const tileUrl = mapStyle === 'SAT'
    ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';

  const currentWaypoint = PATROL_WAYPOINTS[patrolIndex];

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      background: '#040711', display: 'flex', flexDirection: 'column',
      fontFamily: "'Share Tech Mono', monospace", color: '#e2e8f0',
    }}>

      {/* ── Top OSIRIS Header Bar ────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', background: 'rgba(4, 7, 18, 0.96)',
        borderBottom: '1px solid rgba(255, 215, 0, 0.18)',
        zIndex: 10, flexShrink: 0,
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: '1.2rem', filter: 'drop-shadow(0 0 6px #ffd700)' }}>🛡️</div>
          <div>
            <div style={{ color: '#ffd700', fontSize: '0.82rem', fontWeight: 'bold', letterSpacing: 2.5 }}>
              OMNIEYE DEFENSE INTELLIGENCE
            </div>
            <div style={{ color: 'rgba(255,215,0,0.45)', fontSize: '0.48rem', letterSpacing: 1.5 }}>
              AIRSPACE · MARITIME · BORDER TRIPWIRES · CCTV · TECTONIC SENSORS
            </div>
          </div>
        </div>

        {/* Center: Status & Automated Patrol Toggle */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          {/* Automated Patrol Toggle */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsAutoPatrol(p => {
                const next = !p;
                if (next && mapRef.current) {
                  const target = PATROL_WAYPOINTS[patrolIndex];
                  mapRef.current.flyTo([target.lat, target.lon], target.zoom, { animate: true, duration: 1.5 });
                }
                return next;
              });
            }}
            style={{
              padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
              background: isAutoPatrol ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isAutoPatrol ? '#22c55e' : 'rgba(255,255,255,0.15)'}`,
              color: isAutoPatrol ? '#22c55e' : 'rgba(255,255,255,0.5)',
              fontSize: '0.6rem', letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: isAutoPatrol ? '0 0 12px rgba(34,197,94,0.3)' : 'none',
              fontFamily: "'Share Tech Mono'",
            }}
          >
            {isAutoPatrol ? <Pause size={11} /> : <Play size={11} />}
            AUTO THREAT PATROL: {isAutoPatrol ? 'ACTIVE' : 'STANDBY'}
          </motion.button>

          <OsirisStat label="ENTITIES" value={totalEntities.toLocaleString()} color="#00e5ff" />
          <OsirisStat label="RADAR" value={flightSource} color={flightSource === 'LIVE' ? '#22c55e' : '#f59e0b'} />
          <OsirisStat label="SECTORS" value="7 MONITORED" color="#ffd700" />
        </div>

        {/* Right Map Theme Buttons */}
        <div style={{ display: 'flex', gap: 6 }}>
          {['MAP', 'SAT'].map(s => (
            <button
              key={s} onClick={() => setMapStyle(s)}
              style={{
                padding: '3px 10px', borderRadius: 16, cursor: 'pointer', fontSize: '0.58rem',
                border: `1px solid ${mapStyle === s ? '#ffd700' : 'rgba(255,215,0,0.2)'}`,
                background: mapStyle === s ? 'rgba(255,215,0,0.15)' : 'transparent',
                color: mapStyle === s ? '#ffd700' : 'rgba(255,215,0,0.4)',
                letterSpacing: 1.5, fontFamily: "'Share Tech Mono'",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Map Workspace ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        {/* Left Layer Control Dock */}
        <div style={{
          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
          zIndex: 500, display: 'flex', flexDirection: 'column', gap: 4,
          background: 'rgba(4, 7, 18, 0.92)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,215,0,0.15)', borderLeft: 'none',
          borderRadius: '0 10px 10px 0', padding: '10px 6px',
        }}>
          {LAYER_DEFS.map(layer => {
            const Icon = layer.icon;
            const isActive = activeLayers[layer.id];
            const cnt = layer.id === 'airspace' ? flights.length :
                        layer.id === 'earthquakes' ? quakes.length : layer.count;

            return (
              <div key={layer.id} style={{ position: 'relative' }}>
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => toggleLayer(layer.id)}
                  title={layer.label}
                  style={{
                    width: 34, height: 34, borderRadius: 7, cursor: 'pointer',
                    background: isActive ? `rgba(${hexToRgb(layer.color)}, 0.15)` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isActive ? layer.color : 'rgba(255,255,255,0.1)'}`,
                    color: isActive ? layer.color : 'rgba(255,255,255,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isActive ? `0 0 10px rgba(${hexToRgb(layer.color)}, 0.25)` : 'none',
                  }}
                >
                  <Icon size={15} />
                </motion.button>
                {isActive && cnt != null && cnt > 0 && (
                  <div style={{
                    position: 'absolute', top: -3, right: -3,
                    background: '#00e5ff', color: '#000', fontSize: '0.45rem',
                    fontWeight: 'bold', borderRadius: '50%', width: 14, height: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {cnt > 99 ? '99+' : cnt}
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ width: '100%', height: 1, background: 'rgba(255,215,0,0.12)', margin: '3px 0' }} />
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setLayerPanelOpen(p => !p)}
            style={{
              width: 34, height: 34, borderRadius: 7, cursor: 'pointer',
              background: layerPanelOpen ? 'rgba(255,215,0,0.2)' : 'rgba(255,215,0,0.06)',
              border: '1px solid rgba(255,215,0,0.25)', color: '#ffd700',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Layers size={15} />
          </motion.button>
        </div>

        {/* Detailed Layer Control Drawer */}
        <AnimatePresence>
          {layerPanelOpen && (
            <motion.div
              initial={{ x: -260, opacity: 0 }} animate={{ x: 44, opacity: 1 }} exit={{ x: -260, opacity: 0 }}
              style={{
                position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                zIndex: 499, width: 210, background: 'rgba(4, 7, 18, 0.96)',
                backdropFilter: 'blur(16px)', border: '1px solid rgba(255,215,0,0.15)',
                borderLeft: 'none', borderRadius: '0 10px 10px 0', padding: '12px 10px',
              }}
            >
              <div style={{ color: '#ffd700', fontSize: '0.62rem', letterSpacing: 2, marginBottom: 8 }}>
                ◈ DEFENSE LAYERS
              </div>
              {LAYER_DEFS.map(layer => {
                const isActive = activeLayers[layer.id];
                return (
                  <div
                    key={layer.id}
                    onClick={() => toggleLayer(layer.id)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '5px 7px', borderRadius: 5, cursor: 'pointer', marginBottom: 3,
                      background: isActive ? `rgba(${hexToRgb(layer.color)}, 0.08)` : 'transparent',
                      border: `1px solid ${isActive ? `rgba(${hexToRgb(layer.color)}, 0.25)` : 'transparent'}`,
                    }}
                  >
                    <span style={{ color: isActive ? layer.color : 'rgba(255,255,255,0.4)', fontSize: '0.56rem' }}>
                      {layer.label}
                    </span>
                    <span style={{ fontSize: '0.5rem', color: isActive ? '#22c55e' : 'rgba(255,255,255,0.2)' }}>
                      {isActive ? 'ON' : 'OFF'}
                    </span>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Tactical Tool Dock */}
        <div style={{
          position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
          zIndex: 500, display: 'flex', flexDirection: 'column', gap: 4,
          background: 'rgba(4, 7, 18, 0.92)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,215,0,0.15)', borderRight: 'none',
          borderRadius: '10px 0 0 10px', padding: '10px 6px',
        }}>
          {RIGHT_TOOLS.map(tool => {
            const Icon = tool.icon;
            const isToolActive = activeToolDrawer === tool.id;
            return (
              <motion.button
                key={tool.id}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  if (tool.id === 'satellite') {
                    setMapStyle(s => s === 'SAT' ? 'MAP' : 'SAT');
                    return;
                  }
                  if (tool.id === 'scan') {
                    setIsScanning(true);
                    setTimeout(() => setIsScanning(false), 3000);
                    return;
                  }
                  setActiveToolDrawer(curr => curr === tool.id ? null : tool.id);
                }}
                title={tool.label}
                style={{
                  width: 34, height: 34, borderRadius: 7, cursor: 'pointer',
                  background: isToolActive ? 'rgba(0,229,255,0.18)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isToolActive ? '#00e5ff' : 'rgba(255,255,255,0.1)'}`,
                  color: isToolActive ? '#00e5ff' : 'rgba(255,255,255,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon size={15} />
              </motion.button>
            );
          })}
        </div>

        {/* Right Active Tool Drawer */}
        <AnimatePresence>
          {activeToolDrawer && (
            <motion.div
              initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }}
              style={{
                position: 'absolute', right: 46, top: 20, bottom: 20, zIndex: 550,
                width: 280, background: 'rgba(4, 7, 18, 0.97)', backdropFilter: 'blur(18px)',
                border: '1px solid rgba(0,229,255,0.25)', borderRadius: 10,
                padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10,
                boxShadow: '0 0 30px rgba(0,0,0,0.5)', overflowY: 'auto',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,229,255,0.15)', paddingBottom: 6 }}>
                <div style={{ color: '#00e5ff', fontSize: '0.68rem', letterSpacing: 2, fontWeight: 'bold' }}>
                  ◈ {RIGHT_TOOLS.find(t => t.id === activeToolDrawer)?.label}
                </div>
                <button
                  onClick={() => setActiveToolDrawer(null)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1rem' }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Drawer Content by Tool Type */}
              {activeToolDrawer === 'intel' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.52rem' }}>ACTIVE THREAT MATRIX:</div>
                  {GLOBAL_INCIDENTS.map(inc => (
                    <div
                      key={inc.id}
                      style={{
                        padding: '6px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.25)', display: 'flex', flexDirection: 'column', gap: 3,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: inc.color, fontSize: '0.58rem', fontWeight: 'bold' }}>{inc.type}</span>
                        <span style={{ color: '#ef4444', fontSize: '0.5rem' }}>{inc.severity}</span>
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.52rem' }}>{inc.title}</div>
                      <button
                        onClick={() => handleFlyTo(inc.lat, inc.lon, 9)}
                        style={{
                          alignSelf: 'flex-end', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                          borderRadius: 4, color: '#ef4444', fontSize: '0.48rem', cursor: 'pointer', padding: '2px 6px',
                          display: 'flex', alignItems: 'center', gap: 3, fontFamily: "'Share Tech Mono'",
                        }}
                      >
                        <ArrowUpRight size={10} /> INTERCEPT
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {activeToolDrawer === 'signals' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.52rem' }}>RF SPECTRUM TELEMETRY:</div>
                  {[
                    { freq: '121.500 MHz', name: 'VHF Emergency Guard', pwr: '-82 dBm', status: 'MONITORED' },
                    { freq: '156.800 MHz', name: 'Marine VHF Ch 16', pwr: '-67 dBm', status: 'ACTIVE TRAFFIC' },
                    { freq: '1090.00 MHz', name: 'ADS-B Mode-S Transponder', pwr: '-45 dBm', status: 'LOCKED' },
                    { freq: '2.485 GHz', name: 'Drone RF Command Link', pwr: '-91 dBm', status: 'ENCRYPTED' },
                  ].map((sig, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '6px 8px', borderRadius: 6, background: 'rgba(0,229,255,0.06)',
                        border: '1px solid rgba(0,229,255,0.18)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#00e5ff', fontSize: '0.58rem' }}>
                        <span>{sig.freq}</span>
                        <span>{sig.pwr}</span>
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.5rem', marginTop: 2 }}>{sig.name}</div>
                      <div style={{ color: '#22c55e', fontSize: '0.48rem', marginTop: 2 }}>STATUS: {sig.status}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeToolDrawer === 'alerts' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.52rem' }}>LIVE DEFENSE INCIDENT FEED:</div>
                  {CCTV_NODES.filter(c => c.status === 'ALERT').map(cam => (
                    <div
                      key={cam.id}
                      style={{
                        padding: '6px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.35)',
                      }}
                    >
                      <div style={{ color: '#ef4444', fontSize: '0.6rem', fontWeight: 'bold' }}>⚠️ {cam.id}: {cam.name}</div>
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.5rem', marginTop: 2 }}>Sector: {cam.sector} · Sensor Tripwire Active</div>
                      <button
                        onClick={() => handleFlyTo(cam.lat, cam.lon, 14)}
                        style={{
                          marginTop: 4, background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444',
                          borderRadius: 4, color: '#ef4444', fontSize: '0.5rem', cursor: 'pointer', padding: '3px 6px',
                          display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Share Tech Mono'",
                        }}
                      >
                        <ArrowUpRight size={10} /> ZOOM TO CAMERA
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {activeToolDrawer === 'stats' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.52rem' }}>SUB-SYSTEM CENSUS:</div>
                  {[
                    ['Total Monitored Entities', totalEntities],
                    ['ADS-B Air Transponders', flights.length],
                    ['Naval & Maritime Vessels', MARITIME_VESSELS.length],
                    ['Ground CCTV Sentries', CCTV_NODES.length],
                    ['LOC Border Checkposts', BORDER_POSTS.length],
                    ['Seismic Sensors Online', quakes.length],
                    ['Subsea Optic Cables', CABLE_ROUTES.length],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', background: 'rgba(255,255,255,0.02)', borderRadius: 4 }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.52rem' }}>{k}</span>
                      <span style={{ color: '#00e5ff', fontSize: '0.55rem', fontWeight: 'bold' }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Automated Patrol HUD Banner */}
        {isAutoPatrol && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            style={{
              position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
              zIndex: 600, background: 'rgba(4, 8, 20, 0.94)', backdropFilter: 'blur(16px)',
              border: '1px solid rgba(34,197,94,0.4)', borderRadius: 8,
              padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 16,
              boxShadow: '0 0 24px rgba(34,197,94,0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', background: '#22c55e',
                boxShadow: '0 0 8px #22c55e', animation: 'breathe 1.5s infinite',
              }} />
              <div>
                <div style={{ color: '#22c55e', fontSize: '0.65rem', fontWeight: 'bold', letterSpacing: 1.5 }}>
                  PATROL TARGET: {currentWaypoint.name}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.5rem' }}>
                  {currentWaypoint.desc}
                </div>
              </div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 12 }}>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.45rem', letterSpacing: 1 }}>NEXT VECTOR</div>
              <div style={{ color: '#00e5ff', fontSize: '0.68rem', fontWeight: 'bold' }}>00:0{patrolCountdown}</div>
            </div>
          </motion.div>
        )}

        {/* Automated Radar Sweep Visual Wave (Area Scan) */}
        {isScanning && (
          <motion.div
            initial={{ scale: 0.1, opacity: 0.8 }}
            animate={{ scale: 3.5, opacity: 0 }}
            transition={{ duration: 2.8, ease: 'easeOut' }}
            style={{
              position: 'absolute', top: '50%', left: '50%',
              width: 300, height: 300, marginLeft: -150, marginTop: -150,
              borderRadius: '50%', border: '2px solid #00e5ff',
              background: 'radial-gradient(circle, rgba(0,229,255,0.2) 0%, transparent 70%)',
              pointerEvents: 'none', zIndex: 650,
            }}
          />
        )}

        {/* Selected Entity Card */}
        <AnimatePresence>
          {selectedEntity && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              style={{
                position: 'absolute', top: 12, right: 60, zIndex: 600,
                background: 'rgba(4,8,20,0.96)', backdropFilter: 'blur(16px)',
                border: '1px solid rgba(0,229,255,0.25)', borderRadius: 10,
                padding: '12px 16px', minWidth: 210, maxWidth: 290,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ color: '#00e5ff', fontSize: '0.65rem', letterSpacing: 2 }}>◈ ENTITY DETAIL</div>
                <button
                  onClick={() => setSelectedEntity(null)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1rem' }}
                >
                  ×
                </button>
              </div>
              {Object.entries(selectedEntity).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.52rem', letterSpacing: 1 }}>{k.toUpperCase()}</span>
                  <span style={{ color: '#fff', fontSize: '0.58rem' }}>{String(v)}</span>
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

          {/* Solar Terminator */}
          {activeLayers.day_night && dayNightPoints.length > 0 && (
            <Polyline
              positions={dayNightPoints}
              pathOptions={{ color: '#7c3aed', weight: 2, opacity: 0.6, dashArray: '6 4' }}
            />
          )}

          {/* Subsea Fiber Cables */}
          {activeLayers.cables && CABLE_ROUTES.map(cable => (
            <Polyline
              key={cable.name} positions={cable.path}
              pathOptions={{ color: cable.color, weight: 1.5, opacity: 0.75, dashArray: '8 4' }}
            >
              <Popup>
                <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
                  <b>{cable.name}</b><br />Strategic Subsea Fiber Route
                </div>
              </Popup>
            </Polyline>
          ))}

          {/* Border Posts */}
          {activeLayers.border_posts && BORDER_POSTS.map(post => {
            const netPost = postNetwork?.find(p => p.id === post.id);
            const color = netPost?.color || post.color;
            return (
              <CircleMarker
                key={post.id} center={[post.lat, post.lon]}
                radius={8} pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 2 }}
                eventHandlers={{ click: () => setSelectedEntity({ id: post.id, name: post.name, status: netPost?.status || post.status, lat: post.lat.toFixed(4), lon: post.lon.toFixed(4) }) }}
              >
                <Popup><b>{post.name}</b><br />Status: {netPost?.status || post.status}</Popup>
              </CircleMarker>
            );
          })}

          {/* CCTV Nodes (with pulsing alert rings) */}
          {activeLayers.cctv_nodes && CCTV_NODES.map(cam => {
            const isAlert = cam.status === 'ALERT';
            const color = isAlert ? '#ef4444' : cam.status === 'SECURE' ? '#22c55e' : '#ec4899';
            return (
              <LayerGroup key={cam.id}>
                {isAlert && (
                  <CircleMarker
                    center={[cam.lat, cam.lon]}
                    radius={14}
                    pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.2, weight: 1.5, dashArray: '3 3' }}
                  />
                )}
                <CircleMarker
                  center={[cam.lat, cam.lon]}
                  radius={isAlert ? 7 : 5.5}
                  pathOptions={{ color, fillColor: color, fillOpacity: 0.9, weight: 1.5 }}
                  eventHandlers={{ click: () => setSelectedEntity({ id: cam.id, name: cam.name, status: cam.status, sector: cam.sector }) }}
                >
                  <Popup><b>{cam.id}</b>: {cam.name}<br />Status: {cam.status}</Popup>
                </CircleMarker>
              </LayerGroup>
            );
          })}

          {/* Flights */}
          {activeLayers.airspace && flights.map(f => (
            <CircleMarker
              key={f.icao} center={[f.lat, f.lon]}
              radius={3}
              pathOptions={{ color: '#60a5fa', fillColor: '#60a5fa', fillOpacity: 0.85, weight: 1 }}
              eventHandlers={{ click: () => setSelectedEntity({ callsign: f.callsign, alt: `${f.altitude}m`, speed: `${f.velocity}km/h`, hdg: `${f.heading}°`, country: f.origin_country }) }}
            >
              <Popup><b>{f.callsign}</b><br />Alt: {f.altitude}m | Speed: {f.velocity}km/h</Popup>
            </CircleMarker>
          ))}

          {/* Maritime Vessels */}
          {activeLayers.maritime && MARITIME_VESSELS.map(v => (
            <CircleMarker
              key={v.id} center={[v.lat, v.lon]}
              radius={v.type === 'HOSTILE' ? 8 : 6}
              pathOptions={{ color: v.color, fillColor: v.color, fillOpacity: 0.85, weight: 2 }}
              eventHandlers={{ click: () => setSelectedEntity({ name: v.name, type: v.type, speed: `${v.speed}kt`, heading: `${v.heading}°`, flag: v.flag }) }}
            >
              <Popup><b>{v.name}</b><br />{v.type} | {v.flag} | {v.speed}kt</Popup>
            </CircleMarker>
          ))}

          {/* Seismic Earthquakes */}
          {activeLayers.earthquakes && quakes.map(q => (
            <CircleMarker
              key={q.id} center={[q.lat, q.lon]}
              radius={Math.max(4, (q.mag || 0) * 2.5)}
              pathOptions={{ color: q.color, fillColor: q.color, fillOpacity: 0.5, weight: 1 }}
              eventHandlers={{ click: () => setSelectedEntity({ mag: q.mag?.toFixed(1), place: q.place, depth: `${q.depth}km`, time: new Date(q.time).toLocaleTimeString() }) }}
            >
              <Popup><b>M{q.mag?.toFixed(1)}</b><br />{q.place}<br />Depth: {q.depth}km</Popup>
            </CircleMarker>
          ))}

          {/* Global Incidents */}
          {activeLayers.incidents && GLOBAL_INCIDENTS.map(inc => (
            <CircleMarker
              key={inc.id} center={[inc.lat, inc.lon]}
              radius={8}
              pathOptions={{ color: inc.color, fillColor: inc.color, fillOpacity: 0.35, weight: 2, dashArray: '4 2' }}
              eventHandlers={{ click: () => setSelectedEntity({ id: inc.id, type: inc.type, title: inc.title, severity: inc.severity }) }}
            >
              <Popup><b>{inc.type}</b><br />{inc.title}<br />Severity: {inc.severity}</Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* ── Bottom OSIRIS Telemetry Bar ────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '6px 16px', flexShrink: 0,
        background: 'rgba(4, 7, 18, 0.98)', borderTop: '1px solid rgba(255, 215, 0, 0.1)',
        gap: 20, overflow: 'hidden',
      }}>
        {/* Coordinates */}
        <div style={{ display: 'flex', gap: 14, flexShrink: 0 }}>
          <StatusBarItem label="CURSOR" value={`${cursor.lat.toFixed(4)}°, ${cursor.lon.toFixed(4)}°`} color="#00e5ff" />
          <StatusBarItem label="ZOOM" value={cursor.zoom?.toFixed(1)} color="#00e5ff" />
          <StatusBarItem label="ENTITIES" value={totalEntities} color="#00e5ff" />
        </div>

        {/* Scrolling Intelligence Ticker */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <div style={{
            display: 'flex', gap: 36, alignItems: 'center',
            animation: 'tickerScroll 32s linear infinite', whiteSpace: 'nowrap',
          }}>
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <span key={i} style={{
                color: item.color, fontSize: '0.58rem', letterSpacing: 1,
                fontFamily: "'Share Tech Mono'",
              }}>
                {item.text}
              </span>
            ))}
          </div>
        </div>

        {/* Pulse Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%', background: '#22c55e',
            boxShadow: '0 0 6px #22c55e', animation: 'breathe 2s ease-in-out infinite',
          }} />
          <span style={{ color: '#22c55e', fontSize: '0.58rem', letterSpacing: 1.5 }}>ONLINE</span>
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

// ── Helper Sub-Components ─────────────────────────────────────────────────────
function OsirisStat({ label, value, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.45rem', letterSpacing: 1.5 }}>{label}</div>
      <div style={{ color, fontSize: '0.72rem', fontWeight: 'bold', letterSpacing: 1 }}>{value}</div>
    </div>
  );
}

function StatusBarItem({ label, value, color }) {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
      <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.52rem', letterSpacing: 1 }}>{label}</span>
      <span style={{ color, fontSize: '0.58rem', letterSpacing: 1, fontFamily: "'Share Tech Mono'" }}>{value}</span>
    </div>
  );
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '255, 255, 255';
}
