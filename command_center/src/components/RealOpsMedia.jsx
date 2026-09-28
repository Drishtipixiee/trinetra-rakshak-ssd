import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Camera, Cpu, Mountain, Radio, Satellite, Train, Video } from 'lucide-react';

const OPS_FEEDS = [
  {
    id: 'rail-wildlife',
    title: 'Railway Safari & Track Vehicle AI',
    sector: 'Tamil Nadu / Kerala border elephant corridor',
    icon: Train,
    color: '#22c55e',
    vehicleType: 'RAIL-INSPECTOR-V1',
    sourceLabel: 'AR/VR Spatial Track Inspection & Vehicle Patrol',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-train-moving-through-a-rural-landscape-41576-large.mp4',
    detections: [
      { label: 'AR Patrol Vehicle - Track Inspection', risk: 92, x: 56, y: 61, w: 22, h: 20 },
      { label: 'LiDAR Track Clear Corridor', risk: 24, x: 22, y: 70, w: 28, h: 9 },
    ],
    telemetry: ['Palakkad-Madukkarai', 'ETI 31s', 'AR Guidance active'],
  },
  {
    id: 'border-cctv',
    title: 'Perimeter Tactical ACV & Drone',
    sector: 'Border fence / AR vehicle patrol',
    icon: Radio,
    color: '#ef4444',
    vehicleType: 'TACTICAL-APC-X9',
    sourceLabel: 'AR/VR Combat Vehicle Surveillance Matrix',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-security-camera-recording-a-robbery-41484-large.mp4',
    detections: [
      { label: 'Unidentified Armored Target', risk: 91, x: 64, y: 38, w: 16, h: 28 },
      { label: 'Vector Approach Path', risk: 67, x: 18, y: 50, w: 24, h: 18 },
    ],
    telemetry: ['sector 7A', 'QRF Armored Unit', 'AR Lock Confirmed'],
  },
  {
    id: 'mining-drone',
    title: 'Aerial Recon & Land Rover Drone',
    sector: 'Open-pit AR vehicle scan',
    icon: Mountain,
    color: '#f59e0b',
    vehicleType: 'RECON-DRONE-QUAD',
    sourceLabel: 'AR/VR Autonomous Vehicle Field Mapping',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-construction-site-4481-large.mp4',
    detections: [
      { label: 'Autonomous Rover Extraction', risk: 78, x: 34, y: 45, w: 32, h: 22 },
      { label: 'Haul Road Vehicle Path', risk: 58, x: 61, y: 65, w: 27, h: 10 },
    ],
    telemetry: ['NDVI -0.31', 'Rover Mesh Active', 'LiDAR 3D Mesh'],
  },
];

const HARDWARE_NODES = [
  { id: 'esp32', label: 'ESP32-CAM', detail: 'OV2640 + MQTT uplink', color: '#a855f7' },
  { id: 'pir', label: 'PIR Sensor', detail: 'motion trigger', color: '#38bdf8' },
  { id: 'thermal', label: 'Thermal Node', detail: 'night/fog heat map', color: '#f97316' },
  { id: 'relay', label: 'Relay Output', detail: 'siren / brake / gate', color: '#22c55e' },
];

export default function RealOpsMedia({ onScenario }) {
  const [activeId, setActiveId] = useState(OPS_FEEDS[0].id);
  const [failedVideos, setFailedVideos] = useState({});
  const activeFeed = useMemo(() => OPS_FEEDS.find(feed => feed.id === activeId) || OPS_FEEDS[0], [activeId]);
  const ActiveIcon = activeFeed.icon;
  const hasVideoFailed = failedVideos[activeFeed.id];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: 14, minHeight: 430 }}>
      <div style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid var(--glass-border)', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: activeFeed.color, fontFamily: "'Share Tech Mono'", letterSpacing: 1 }}>
            <ActiveIcon size={16} />
            {activeFeed.title.toUpperCase()}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {OPS_FEEDS.map(feed => (
              <button
                key={feed.id}
                onClick={() => setActiveId(feed.id)}
                title={feed.title}
                style={{
                  width: 28, height: 24, borderRadius: 4, cursor: 'pointer',
                  border: `1px solid ${activeId === feed.id ? feed.color : 'rgba(255,255,255,0.15)'}`,
                  background: activeId === feed.id ? `${feed.color}22` : 'rgba(255,255,255,0.03)',
                  color: activeId === feed.id ? feed.color : 'var(--text-dim)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <feed.icon size={13} />
              </button>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', flex: 1, minHeight: 310, background: '#020502' }}>
          <video
            key={activeFeed.videoUrl}
            src={activeFeed.videoUrl}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            onError={() => setFailedVideos(prev => ({ ...prev, [activeFeed.id]: true }))}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: hasVideoFailed ? 0 : 0.72, filter: activeFeed.id === 'border-cctv' ? 'contrast(1.25) grayscale(0.45)' : 'contrast(1.08) saturate(1.05)' }}
          />
          {hasVideoFailed && (
            <div
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                background: 'radial-gradient(ellipse at center, #091a10 0%, #020704 100%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                backgroundImage: 'linear-gradient(rgba(34,197,94,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.1) 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            >
              {/* AR/VR Tactical Vehicle 3D Wireframe Graphics */}
              <svg width="220" height="140" viewBox="0 0 200 120" style={{ filter: `drop-shadow(0 0 12px ${activeFeed.color})` }}>
                <polygon points="40,90 160,90 140,50 60,50" fill="none" stroke={activeFeed.color} strokeWidth="1.5" strokeDasharray="4 2" />
                <rect x="70" y="30" width="60" height="20" rx="3" fill="none" stroke={activeFeed.color} strokeWidth="1.5" />
                <circle cx="65" cy="90" r="14" fill="none" stroke={activeFeed.color} strokeWidth="2" />
                <circle cx="135" cy="90" r="14" fill="none" stroke={activeFeed.color} strokeWidth="2" />
                <line x1="100" y1="20" x2="100" y2="30" stroke="#00f3ff" strokeWidth="2" />
                <circle cx="100" cy="18" r="4" fill="#00f3ff" />
                <line x1="20" y1="60" x2="180" y2="60" stroke={activeFeed.color} strokeWidth="0.5" strokeDasharray="2 2" />
                <circle cx="100" cy="60" r="40" fill="none" stroke="rgba(0,243,255,0.4)" strokeWidth="1" strokeDasharray="6 3" />
              </svg>
              <div style={{ color: activeFeed.color, fontFamily: "'Share Tech Mono'", fontSize: '0.85rem', letterSpacing: 2, marginTop: 8 }}>
                AR/VR VEHICLE WIREFRAME HUD // {activeFeed.vehicleType}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'Share Tech Mono'", fontSize: '0.62rem', marginTop: 4 }}>
                SPATIAL RADAR MATRIX ACTIVE • LIDAR 3D VEHICLE MESH
              </div>
            </div>
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.65))', pointerEvents: 'none' }} />
          <div className="video-scanlines" />
          {activeFeed.detections.map((det, index) => (
            <motion.div
              key={det.label}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: [1, 1.02, 1] }}
              transition={{ repeat: Infinity, duration: 1.8, delay: index * 0.25 }}
              style={{
                position: 'absolute',
                left: `${det.x}%`, top: `${det.y}%`, width: `${det.w}%`, height: `${det.h}%`,
                border: `2px solid ${det.risk > 75 ? '#ef4444' : '#f59e0b'}`,
                boxShadow: `0 0 18px ${det.risk > 75 ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.35)'}`,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none'
              }}
            >
              <div style={{ position: 'absolute', left: -2, top: -22, background: det.risk > 75 ? '#ef4444' : '#f59e0b', color: '#000', fontSize: '0.52rem', fontWeight: 800, padding: '3px 5px', whiteSpace: 'nowrap', fontFamily: "'Share Tech Mono'" }}>
                {det.label.toUpperCase()} {det.risk}%
              </div>
            </motion.div>
          ))}
          <div style={{ position: 'absolute', left: 12, bottom: 12, right: 12, display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-end' }}>
            <div>
              <div style={{ color: activeFeed.color, fontFamily: "'Share Tech Mono'", fontSize: '0.75rem', letterSpacing: 2 }}>{activeFeed.sector}</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.58rem', marginTop: 3 }}>
                {activeFeed.sourceLabel}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {activeFeed.telemetry.map(item => (
                <span key={item} style={{ border: `1px solid ${activeFeed.color}66`, color: activeFeed.color, background: `${activeFeed.color}18`, borderRadius: 4, padding: '3px 6px', fontSize: '0.55rem', fontFamily: "'Share Tech Mono'" }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: 14 }}>
          <div style={{ color: 'var(--accent)', fontFamily: "'Share Tech Mono'", letterSpacing: 2, fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <Camera size={14} /> REAL-TIME CCTV INPUTS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {['WebRTC local camera', 'RTSP/NVR gateway', 'ESP32-CAM MQTT', 'Satellite/GIS layer'].map((item, index) => (
              <div key={item} style={{ border: '1px solid rgba(34,197,94,0.16)', background: 'rgba(34,197,94,0.05)', borderRadius: 6, padding: 8 }}>
                <div style={{ color: index === 0 ? '#22c55e' : 'rgba(255,255,255,0.75)', fontSize: '0.62rem', fontFamily: "'Share Tech Mono'" }}>{item}</div>
                <div style={{ color: 'rgba(255,255,255,0.32)', fontSize: '0.5rem', marginTop: 4 }}>{index === 0 ? 'Already works in CCTV tab with browser permission' : 'Deployment-ready connector placeholder'}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: 14, flex: 1 }}>
          <div style={{ color: '#a855f7', fontFamily: "'Share Tech Mono'", letterSpacing: 2, fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
            <Cpu size={14} /> HARDWARE CHAIN
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {HARDWARE_NODES.map((node, index) => (
              <div key={node.id} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: node.color, boxShadow: `0 0 12px ${node.color}` }} />
                <div style={{ flex: 1, border: `1px solid ${node.color}44`, background: `${node.color}12`, borderRadius: 6, padding: '7px 9px' }}>
                  <div style={{ color: node.color, fontSize: '0.6rem', fontFamily: "'Share Tech Mono'", letterSpacing: 1 }}>{node.label}</div>
                  <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.5rem', marginTop: 2 }}>{node.detail}</div>
                </div>
                {index < HARDWARE_NODES.length - 1 && <div style={{ color: 'rgba(255,255,255,0.25)' }}>--</div>}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => onScenario?.(activeFeed.id)}
          style={{ border: `1px solid ${activeFeed.color}`, background: `${activeFeed.color}1f`, color: activeFeed.color, borderRadius: 6, padding: '10px 12px', fontFamily: "'Share Tech Mono'", letterSpacing: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <AlertTriangle size={14} /> PUSH THIS SCENARIO TO COMMAND CENTER
        </button>

        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.53rem', lineHeight: 1.5 }}>
          <Video size={11} style={{ verticalAlign: 'middle' }} /> Feeds use public online video assets for demonstration. <Satellite size={11} style={{ verticalAlign: 'middle' }} /> Live sovereign/rail/border CCTV streams require an authorized RTSP/WebRTC gateway.
        </div>
      </div>
    </div>
  );
}
