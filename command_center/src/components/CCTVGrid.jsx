import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, Maximize2, X, AlertTriangle, Shield, Camera, CameraOff,
  Eye, ZoomIn, ZoomOut, RefreshCw, Play, Square, Layers, Sparkles
} from 'lucide-react';
import { playDetectionBeep, playKlaxon, playSuccessChime } from './AIVoiceSystem';
import RealFeedVideo from './RealFeedVideo';
import { REAL_MEDIA } from '../lib/realMediaFeeds';

const CAMERAS = [
  {
    id: 'CAM-01',
    name: 'MAIN GATE // SEC-7A',
    coords: 'N28°38\'12" E77°13\'04"',
    type: 'OPTICAL HIGH-RES 1080P',
    videoUrl: REAL_MEDIA.checkpointCctv,
    backupKey: 'checkpointCctv',
    scenario: 'checkpoint',
    target: { label: 'ARMORED SUV (AUTHORIZED)', conf: 94, risk: 25 }
  },
  {
    id: 'CAM-02',
    name: 'PERIMETER FENCE // NORTH',
    coords: 'N28°38\'18" E77°13\'09"',
    type: 'FLIR THERMAL 640',
    videoUrl: REAL_MEDIA.borderCctv,
    backupKey: 'borderCctv',
    scenario: 'border',
    target: { label: 'INTRUDER DETECTED (HOSTILE)', conf: 96, risk: 92 }
  },
  {
    id: 'CAM-03',
    name: 'RAILWAY KM-142 CORRIDOR',
    coords: 'N23°37\'12" E85°16\'47"',
    type: 'OVERWATCH LONG-RANGE',
    videoUrl: REAL_MEDIA.railwayIndia,
    backupKey: 'railwayIndia',
    scenario: 'railway',
    target: { label: 'ASIAN ELEPHANT (WILDLIFE)', conf: 95, risk: 78 }
  },
  {
    id: 'CAM-04',
    name: 'MINING DRONE RECON',
    coords: 'N23°47\'50" E86°25\'10"',
    type: '4K UAV GIMBAL',
    videoUrl: REAL_MEDIA.miningAerial,
    backupKey: 'miningAerial',
    scenario: 'mining',
    target: { label: 'ILLEGAL QUARRY RIG', conf: 91, risk: 74 }
  },
  {
    id: 'CAM-05',
    name: 'LOCAL LIVE WEBCAM',
    coords: 'N28°36\'40" E77°12\'22"',
    type: 'WEBRTC OPTICAL',
    videoUrl: null,
    backupKey: null,
    scenario: 'checkpoint',
    target: { label: 'COMMAND OPERATOR', conf: 98, risk: 10 }
  },
  {
    id: 'CAM-06',
    name: 'ARMORY VAULT // SEC-2',
    coords: 'N28°38\'10" E77°13\'00"',
    type: 'LOW-LIGHT STARCHECK',
    videoUrl: REAL_MEDIA.wildlifeCorridor,
    backupKey: 'wildlifeCorridor',
    scenario: 'wildlife',
    target: { label: 'ARMORY -- ALL CLEAR', conf: 99, risk: 5 }
  }
];

export default function CCTVGrid({
  active,
  voiceRef,
  voiceEnabled,
  setDetectionData,
  setSmsText,
  setSmsVisible,
  playDetectionBeep
}) {
  const [expandedCam, setExpandedCam] = useState(null);
  const [nightVision, setNightVision] = useState(false);
  const [thermalFilter, setThermalFilter] = useState(false);
  const [webcamStream, setWebcamStream] = useState(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const webcamVideoRef = useRef(null);

  // Initialize WebRTC Webcam on CAM-05
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setWebcamStream(stream);
      setWebcamActive(true);
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Webcam permission denied:', err);
    }
  };

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(t => t.stop());
      setWebcamStream(null);
      setWebcamActive(false);
    }
  };

  const camTime = new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' });

  return (
    <motion.div
      key="cctv-grid-deck"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="ops-deck cctv-real-deck"
      style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, padding: 14, overflowY: 'auto' }}
    >
      {/* ── TOP CONTROL BAR ────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15,23,42,0.85)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: '10px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ padding: 6, background: 'rgba(34,197,94,0.15)', border: '1px solid var(--accent)', borderRadius: 6, color: 'var(--accent)' }}>
            <Video size={18} />
          </div>
          <div>
            <div style={{ fontFamily: "'Share Tech Mono'", fontSize: '0.95rem', color: 'var(--accent)', fontWeight: 'bold', letterSpacing: 2 }}>
              INTEGRATED CCTV SURVEILLANCE GRID // 6 ACTIVE FEEDS
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
              Real-time High Definition Optical & Thermal Surveillance • Live WebRTC Integration
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setNightVision(!nightVision)}
            style={{
              background: nightVision ? 'rgba(34,197,94,0.25)' : 'transparent',
              border: `1px solid ${nightVision ? 'var(--accent)' : '#334155'}`,
              color: nightVision ? 'var(--accent)' : '#94a3b8',
              padding: '6px 12px', borderRadius: 6, fontSize: '0.65rem', fontFamily: "'Share Tech Mono'", cursor: 'pointer'
            }}
          >
            {nightVision ? '● NIGHT VISION: ON' : 'NIGHT VISION'}
          </button>
          <button
            onClick={() => setThermalFilter(!thermalFilter)}
            style={{
              background: thermalFilter ? 'rgba(168,85,247,0.25)' : 'transparent',
              border: `1px solid ${thermalFilter ? '#a855f7' : '#334155'}`,
              color: thermalFilter ? '#a855f7' : '#94a3b8',
              padding: '6px 12px', borderRadius: 6, fontSize: '0.65rem', fontFamily: "'Share Tech Mono'", cursor: 'pointer'
            }}
          >
            {thermalFilter ? '● FLIR THERMAL: ON' : 'FLIR THERMAL'}
          </button>
        </div>
      </div>

      {/* ── 6-CAMERA REAL VIDEO GRID ───────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, flex: 1 }}>
        {CAMERAS.map((cam, idx) => {
          const isCrit = cam.target.risk > 70;
          return (
            <div
              key={cam.id}
              onClick={() => setExpandedCam(idx)}
              style={{
                position: 'relative', height: '220px', borderRadius: 10, overflow: 'hidden',
                border: `2px solid ${isCrit ? '#ef4444' : 'rgba(56,189,248,0.25)'}`,
                boxShadow: isCrit ? '0 0 25px rgba(239,68,68,0.35)' : '0 4px 20px rgba(0,0,0,0.6)',
                cursor: 'pointer', background: '#000'
              }}
            >
              {/* Webcam on CAM-05 or Real Video Element */}
              {cam.id === 'CAM-05' ? (
                webcamActive ? (
                  <video
                    ref={webcamVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,15,25,0.95)' }}>
                    <Camera size={32} color="#38bdf8" style={{ marginBottom: 10 }} />
                    <button
                      onClick={(e) => { e.stopPropagation(); startWebcam(); }}
                      style={{ background: 'rgba(56,189,248,0.2)', border: '1px solid #38bdf8', color: '#38bdf8', padding: '6px 14px', borderRadius: 6, fontSize: '0.7rem', fontFamily: "'Share Tech Mono'", cursor: 'pointer' }}
                    >
                      START LIVE WEBCAM
                    </button>
                  </div>
                )
              ) : (
                <RealFeedVideo
                  src={cam.videoUrl}
                  backupKey={cam.backupKey}
                  scenario={cam.scenario}
                  label={`${cam.id} ${cam.name}`}
                  style={{
                    width: '100%', height: '100%',
                    filter: nightVision ? 'brightness(1.2) contrast(1.4) hue-rotate(90deg)' : thermalFilter ? 'invert(1) hue-rotate(180deg)' : 'none'
                  }}
                />
              )}

              {/* Target Bounding Box Overlay on Feed */}
              <div style={{
                position: 'absolute', top: '30%', left: '35%', width: '30%', height: '40%',
                border: `1.5px solid ${isCrit ? '#ef4444' : 'var(--accent)'}`,
                pointerEvents: 'none'
              }}>
                <div style={{
                  position: 'absolute', top: -16, left: 0,
                  background: isCrit ? '#ef4444' : 'var(--accent)', color: '#000',
                  padding: '1px 6px', fontSize: '0.55rem', fontFamily: "'Share Tech Mono'", fontWeight: 'bold'
                }}>
                  {cam.target.label} {cam.target.conf}%
                </div>
              </div>

              {/* Top Header Tag */}
              <div style={{ position: 'absolute', top: 8, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none', zIndex: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.85)', padding: '3px 8px', borderRadius: 4, border: '1px solid var(--glass-border)', fontSize: '0.65rem', fontFamily: "'Share Tech Mono'", color: '#fff' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: isCrit ? '#ef4444' : '#22c55e', animation: 'softPulse 1s infinite' }} />
                  {cam.id}
                </div>
                <div style={{ background: isCrit ? '#ef4444' : 'rgba(0,0,0,0.85)', color: isCrit ? '#fff' : '#38bdf8', fontSize: '0.6rem', fontFamily: "'Share Tech Mono'", padding: '3px 8px', borderRadius: 4 }}>
                  {cam.target.label}
                </div>
              </div>

              {/* Bottom Footer Info */}
              <div style={{ position: 'absolute', bottom: 8, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 5 }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#fff', fontFamily: "'Share Tech Mono'" }}>{cam.name}</div>
                  <div style={{ fontSize: '0.55rem', color: 'var(--text-dim)' }}>{cam.coords} • {cam.type}</div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); setExpandedCam(idx); }}
                  style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '4px', borderRadius: 4, cursor: 'pointer' }}
                  title="Full Screen Inspection"
                >
                  <Maximize2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── EXPANDED TACTICAL MODAL VIEW ───────────────────────── */}
      <AnimatePresence>
        {expandedCam !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(0,0,0,0.94)', backdropFilter: 'blur(10px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
            }}
          >
            <div style={{ width: '90%', maxWidth: '1100px', background: '#0a0f1d', border: '2px solid var(--accent)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 0 50px rgba(34,197,94,0.3)' }}>
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: 'rgba(15,23,42,0.95)', borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ color: 'var(--accent)', fontSize: '1rem', fontWeight: 'bold', fontFamily: "'Share Tech Mono'" }}>
                    TACTICAL SURVEILLANCE INSPECTOR // {CAMERAS[expandedCam].name}
                  </div>
                  <div style={{ fontSize: '0.65rem', background: 'rgba(34,197,94,0.2)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 4 }}>
                    REAL VIDEO FEED 1080P
                  </div>
                </div>

                <button
                  onClick={() => setExpandedCam(null)}
                  style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', color: '#ef4444', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal High-Res Video View */}
              <div style={{ height: '480px', position: 'relative', background: '#000' }}>
                <RealFeedVideo
                  src={CAMERAS[expandedCam].videoUrl || REAL_MEDIA.railwayIndia}
                  label={`${CAMERAS[expandedCam].id} expanded footage`}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>

              {/* Modal Telemetry Footer */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: 14, background: '#0b1120', borderTop: '1px solid var(--glass-border)', gap: 10 }}>
                <div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>GPS POSITION</div>
                  <div style={{ fontSize: '0.8rem', color: '#fff', fontFamily: "'Share Tech Mono'" }}>{CAMERAS[expandedCam].coords}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>SENSOR OPTICS</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontFamily: "'Share Tech Mono'" }}>{CAMERAS[expandedCam].type}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>PRIMARY TARGET</div>
                  <div style={{ fontSize: '0.8rem', color: '#ef4444', fontFamily: "'Share Tech Mono'", fontWeight: 'bold' }}>{CAMERAS[expandedCam].target.label}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>AI CONFIDENCE</div>
                  <div style={{ fontSize: '0.8rem', color: '#22c55e', fontFamily: "'Share Tech Mono'", fontWeight: 'bold' }}>{CAMERAS[expandedCam].target.conf}% CONFIRMED</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
