/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Activity, AlertTriangle, Fingerprint, Lock,
  Map as MapIcon, Video, Target, Radio, Scan, Train, Download, Terminal
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';
import axios from 'axios';
import * as cocossd from '@tensorflow-models/coco-ssd';

// --- Subcomponents ---
const TypewriterText = ({ text, speed = 10, className = '' }) => {
  const [displayedText, setDisplayedText] = useState('');
  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return (
    <span className={className}>
      {displayedText}
      {displayedText.length < text.length && <span className="typewriter-cursor" />}
    </span>
  );
};

const LoginOverlay = ({ onLogin }) => {
  const [authStatus, setAuthStatus] = useState('AWAITING_BIOMETRIC');

  const handleWebCryptoAuth = async () => {
    try {
      setAuthStatus('GENERATING_KEY');

      // Simulate Public-Key Handshake using Web Crypto API
      await window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
      );

      setAuthStatus('HANDSHAKE_VERIFIED');

      setTimeout(() => {
        setAuthStatus('SUCCESS');
        setTimeout(() => {
          onLogin();
        }, 800);
      }, 1000);

    } catch (e) {
      console.error(e);
      setAuthStatus('DENIED');
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(circle at center, rgba(0,20,0,0.95) 0%, rgba(5,8,5,1) 100%)',
      backdropFilter: 'blur(10px)'
    }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-panel"
        style={{
          width: '500px', display: 'flex', flexDirection: 'column',
          alignItems: 'center', padding: '3rem',
          border: `1px solid ${authStatus === 'SUCCESS' ? 'var(--safe)' : 'var(--accent)'}`,
          boxShadow: `0 0 40px ${authStatus === 'SUCCESS' ? 'rgba(34,197,94,0.3)' : 'rgba(34, 197, 94, 0.15)'}, inset 0 0 20px rgba(0,0,0,0.8)`,
          transition: 'all 0.5s ease'
        }}
      >
        <div className="corner-brackets" />

        <motion.div
          animate={authStatus === 'GENERATING_KEY' || authStatus === 'HANDSHAKE_VERIFIED' ? {
            scale: [1, 1.1, 1],
            opacity: [0.5, 1, 0.5]
          } : {}}
          transition={{ repeat: Infinity, duration: 1 }}
          style={{ marginBottom: '1.5rem', color: authStatus === 'SUCCESS' ? 'var(--safe)' : 'var(--accent)', filter: `drop-shadow(0 0 10px ${authStatus === 'SUCCESS' ? 'var(--safe)' : 'var(--accent-glow)'})` }}
        >
          {authStatus === 'SUCCESS' ? <Lock size={64} /> : <Fingerprint size={64} />}
        </motion.div>

        <h2 style={{ fontSize: '1.5rem', color: authStatus === 'SUCCESS' ? 'var(--safe)' : 'var(--accent)', letterSpacing: '4px', margin: '0 0 0.5rem 0', textShadow: `0 0 10px ${authStatus === 'SUCCESS' ? 'var(--safe)' : 'var(--accent-glow)'}` }}>
          TRINETRA COMMAND
        </h2>

        <div style={{ fontSize: '0.8rem', color: 'var(--accent)', opacity: 0.7, letterSpacing: '3px', marginBottom: '2.5rem', height: '1rem' }}>
          {authStatus === 'AWAITING_BIOMETRIC' && 'BIOMETRIC GATEWAY LOCKED'}
          {authStatus === 'GENERATING_KEY' && 'GENERATING RSA-OAEP 2048-BIT KEY...'}
          {authStatus === 'HANDSHAKE_VERIFIED' && 'PUBLIC-KEY HANDSHAKE VERIFIED'}
          {authStatus === 'SUCCESS' && <span style={{ color: 'var(--safe)' }}>OFFICER DRISHTI MISHRA - SECTOR 7 AUTHENTICATED</span>}
        </div>

        {authStatus === 'AWAITING_BIOMETRIC' && (
          <button
            onClick={handleWebCryptoAuth}
            className="nav-btn"
            style={{
              width: '100%', padding: '1rem',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.8rem',
              fontSize: '1rem', fontWeight: 'bold'
            }}
          >
            <Scan size={20} /> [ INITIATE BIOMETRIC SCAN ]
          </button>
        )}

      </motion.div>
    </div>
  );
};


const playTacticalPing = () => {
  try {
    const actx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, actx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, actx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.2, actx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(actx.destination);
    osc.start();
    osc.stop(actx.currentTime + 0.5);
  } catch (err) {
    console.log("Audio play failed", err);
  }
};

const translateToHindi = (text) => {
  if (!text) return "";
  let translated = text;
  translated = translated.replace("CRITICAL", "गंभीर");
  translated = translated.replace("WARNING", "चेतावनी");
  translated = translated.replace("SAFE", "सुरक्षित");
  translated = translated.replace("High-speed entity", "तेज गति वाली वस्तु");
  translated = translated.replace("critical proximity to Danger Zone", "खतरे के क्षेत्र के बेहद करीब");
  translated = translated.replace("approaching perimeter", "सीमा के पास आ रहा है");
  translated = translated.replace("low-visibility/stealth conditions", "कम दृश्यता/चुपके से");
  translated = translated.replace("Calculated Risk:", "अनुमानित जोखिम:");
  return translated;
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [logs, setLogs] = useState([{ id: 1, text: "[SYS] Backend API Initialized. All subsystems green.", type: "normal" }]);
  const logsEndRef = useRef(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // TF.js State
  const [model, setModel] = useState(null);
  const requestRef = useRef(null);

  // States
  const [isHindi, setIsHindi] = useState(false);
  const [simActive, setSimActive] = useState(false);
  const [simTick, setSimTick] = useState(0);

  // ROI State
  const [roiBox, setRoiBox] = useState(null);
  const [isDrawingROI, setIsDrawingROI] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });

  // Sensors
  const [borderData, setBorderData] = useState({ distance: 100, speed: 0, riskScore: 0, level: 'LOW', xai: '', threat: 'Unknown' });
  const [trackData, setTrackData] = useState({ detected: false, object: 'None', trainSpeed: 80, distance: 1000, timeToImpact: 99 });
  const [geoData, setGeoData] = useState({ changes: [], scanning: false });
  const [threatHistory, setThreatHistory] = useState([{ time: '0s', val: 0 }]);

  // Global Alert
  const isAlert = borderData.level === 'CRITICAL';

  useEffect(() => {
    cocossd.load().then(loadedModel => {
      setModel(loadedModel);
      addLog("[SYS] TFJS Object Detection Model Loaded Successfully.", "safe");
    }).catch(err => {
      console.error(err);
      addLog("[ERR] Failed to load local TF.js model.", "critical");
    });
  }, []);

  const detectFrame = async () => {
    if (videoRef.current && canvasRef.current && model && videoRef.current.readyState === 4) {
      const video = videoRef.current;
      const predictions = await model.detect(video);

      const ctx = canvasRef.current.getContext('2d');
      // Match canvas size to video size
      canvasRef.current.width = video.videoWidth;
      canvasRef.current.height = video.videoHeight;

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      let maxRisk = 0;
      let primaryThreat = 'None';

      predictions.forEach(prediction => {
        // TF.js bounding box: [x, y, width, height]
        const [x, y, width, height] = prediction.bbox;
        const text = `${prediction.class} | ${Math.round(prediction.score * 100)}%`;

        // Higher risk for lower confidence or 'person'
        const baseRisk = prediction.class === 'person' ? 60 : 20;
        const currentRisk = Math.min(99, baseRisk + (100 - Math.round(prediction.score * 100)));

        if (currentRisk > maxRisk) {
          maxRisk = currentRisk;
          primaryThreat = prediction.class.toUpperCase();
        }

        const color = currentRisk > 75 ? '#dc2626' : currentRisk > 40 ? '#f59e0b' : '#22c55e';

        // Draw bounding box
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;

        // Adjust X coordinate because we flip the video via CSS
        const flippedX = ctx.canvas.width - x - width;
        ctx.strokeRect(flippedX, y, width, height);

        // Draw background block for text
        ctx.fillStyle = color;
        ctx.fillRect(flippedX, y - 25, ctx.measureText(text).width + 10, 25);

        // Draw text
        ctx.fillStyle = '#000000';
        ctx.font = '16px "Share Tech Mono"';
        ctx.fillText(text, flippedX + 5, y - 8);
      });

      if (predictions.length > 0 && Math.random() > 0.9) {
        // Update fuzzy state dynamically without overwhelming the React render cycle
        setBorderData(prev => ({
          ...prev,
          level: maxRisk > 75 ? 'CRITICAL' : maxRisk > 40 ? 'WARNING' : 'LOW',
          threat: primaryThreat,
          riskScore: maxRisk
        }));
      }

      requestRef.current = requestAnimationFrame(detectFrame);
    }
  };

  useEffect(() => {
    if (activeTab === 'BORDER-SENTRY' && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            // Need to wait until video is playing before running detection
            videoRef.current.onloadeddata = () => {
              if (model) {
                detectFrame();
              }
            };
          }
        })
        .catch(err => {
          console.error("Webcam access denied or unavailable.", err);
          addLog("[ERR] Failed to access localized optical sensor (Webcam).", "warning");
        });
    } else {
      // Cleanup webcam and RAF loop
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [activeTab, model]);

  useEffect(() => {
    if (isAlert) document.body.classList.add('alert-mode');
    else document.body.classList.remove('alert-mode');
    return () => document.body.classList.remove('alert-mode');
  }, [isAlert]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const addLog = (text, type = 'normal') => {
    setLogs(prev => [...prev.slice(-49), { id: Date.now() + Math.random(), text, type }]);
  };

  const handleGenerateReport = async () => {
    try {
      addLog("[SYS] Generating Official Incident Report...", "normal");
      const res = await axios.post('http://localhost:5000/api/generate_report', {
        threat_info: borderData.threat,
        sector: "SEC-7 (Border-Sentry)",
        risk_score: borderData.riskScore,
        gps: "Lat: 28.6139, Lon: 77.2090"
      }, { responseType: 'blob' });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `incident_report_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      addLog("[SYS] Report Downloaded Successfully.", "safe");
    } catch (err) {
      addLog(`[ERR] Failed to generate report: ${err.message}`, "critical");
    }
  };

  // --- Main Simulation Loop ---
  useEffect(() => {
    let interval;
    if (simActive) {
      interval = setInterval(() => {
        setSimTick(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [simActive]);

  useEffect(() => {
    if (!simActive) return;

    // Simulate approaching threat in Border-Sentry over 20 ticks
    if (simTick >= 2 && simTick <= 20) {
      const newSpeed = Math.min(85, borderData.speed + 4 + Math.random() * 5); // Accelerates
      const newDistance = Math.max(10, borderData.distance - (newSpeed / 5)); // Distance drops

      // Call Backend API
      axios.post('http://localhost:5000/api/evaluate_threat', {
        velocity: newSpeed,
        proximity: newDistance,
        visibility: 30, // Low visibility for higher risk
        sensor: "Border-Sentry"
      }).then(res => {
        const { risk_score, xai_reasoning, threat_class } = res.data;
        const level = risk_score >= 70 ? 'CRITICAL' : risk_score >= 40 ? 'WARNING' : 'LOW';

        setBorderData(prev => ({
          ...prev,
          distance: newDistance.toFixed(1),
          speed: newSpeed.toFixed(1),
          riskScore: risk_score,
          level: level,
          xai: xai_reasoning,
          threat: threat_class
        }));

        setThreatHistory(prev => {
          const h = [...prev, { time: `${simTick}s`, val: risk_score }];
          return h.length > 10 ? h.slice(1) : h;
        });

        // Logs based on level triggers
        if (level === 'CRITICAL' && borderData.level !== 'CRITICAL') {
          playTacticalPing();
          addLog(`[SEC-7] CRITICAL THREAT: ${threat_class} | Risk: ${risk_score}%`, 'critical');
        } else if (level === 'WARNING' && borderData.level === 'LOW') {
          addLog(`[SEC-7] UNKNOWN THREAT | Conf: 92% | Risk: ${risk_score}% | Spd: ${newSpeed.toFixed(0)}km/h`, 'warning');
        } else if (simTick % 5 === 0 && level === 'LOW') {
          addLog(`[SEC-7] Auto-Scan | Conf: 88% | Risk: ${risk_score}% (LOW)`, 'normal');
        }
      }).catch(err => {
        console.error("API Error", err);
      });
    }

    // Simulate Track Guard Obstruction at tick 5
    if (simTick === 5) {
      // Train is at 1000m, speed 80km/h = ~22 m/s. ETI = Distance / Speed
      const speedMs = 80 * (5 / 18);
      const eti = Math.round(1000 / speedMs);

      setTrackData({ detected: true, object: 'Wild Elephant', trainSpeed: 80, distance: 1000, timeToImpact: eti });
      addLog(`[TRK-2] WILDLIFE DETECTED | Class: Elephant | Distance: 1000m`, 'warning');
    }

    // Track Guard ETI updates
    if (simTick > 5 && trackData.detected) {
      setTrackData(prev => {
        const speedMs = prev.trainSpeed * (5 / 18);
        const newDist = Math.max(0, prev.distance - speedMs);
        const currentEti = Math.round(newDist / speedMs);

        if (simTick === 12) addLog(`[TRK-2] Auto-Brake Signal Sent to Train #12042`, 'normal');
        if (simTick === 15) {
          // Train slowing down
          return { ...prev, trainSpeed: 30, distance: newDist, timeToImpact: Math.round(newDist / (30 * (5 / 18))) };
        }
        return { ...prev, distance: newDist, timeToImpact: currentEti };
      });
    }

    // End simulation
    if (simTick > 25) {
      setSimActive(false);
      addLog("[SYS] Simulation complete. Resetting sensors.", "normal");
      setTimeout(() => {
        setSimTick(0);
        setBorderData({ distance: 100, speed: 0, riskScore: 0, level: 'LOW', xai: '', threat: 'Unknown' });
        setTrackData({ detected: false, object: 'None', trainSpeed: 80, distance: 1000, timeToImpact: 99 });
        setGeoData({ changes: [], scanning: false });
        setThreatHistory([{ time: '0s', val: 0 }]);
        setRoiBox(null);
      }, 3000);
    }
  }, [simTick, simActive, trackData.detected, borderData.level, borderData.speed, borderData.distance]);

  // --- Handlers for ROI Drawing ---
  const startDrawROI = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDrawStart({ x, y });
    setIsDrawingROI(true);
    setRoiBox({ x, y, w: 0, h: 0 });
  };

  const drawROI = (e) => {
    if (!isDrawingROI) return;
    const rect = e.target.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    setRoiBox({
      x: Math.min(drawStart.x, currentX),
      y: Math.min(drawStart.y, currentY),
      w: Math.abs(currentX - drawStart.x),
      h: Math.abs(currentY - drawStart.y)
    });
  };

  const endDrawROI = () => {
    setIsDrawingROI(false);
    if (roiBox && roiBox.w > 20) {
      addLog(`[SEC-7] Virtual ROI Zone Established at [${roiBox.x.toFixed(0)}, ${roiBox.y.toFixed(0)}]`, "safe");
    } else {
      setRoiBox(null); // Too small
    }
  };

  // Handlers for Geo-Eye Scan
  const triggerGeoScan = () => {
    setGeoData({ changes: [], scanning: true });
    addLog('[GEO-EYE] Image Subtraction algorithm started on coordinates [23.6102, 85.2799]...', 'normal');

    // Mocking terrain changes detection over 2 seconds
    setTimeout(() => {
      const changes = [
        { lat: 23.6152, lng: 85.2859, radius: 400, risk: 85 }, // Illegal Mining pit A
        { lat: 23.6052, lng: 85.2719, radius: 250, risk: 60 }  // Illegal Mining pit B
      ];
      setGeoData({ changes, scanning: false });
      addLog(`[GEO-EYE] Scan Complete. Detected ${changes.length} irregular terrain variances (Suspected Mining / Forest Encroachment).`, 'warning');
    }, 2000);
  };


  if (!isAuthenticated) {
    return (
      <LoginOverlay onLogin={() => {
        setIsAuthenticated(true);
        addLog("[SYS] Authentication Successful: Officer Drishti Mishra - Sector 7 Access Granted", "safe");
      }} />
    );
  }

  return (
    <div className={`hud-container ${isAlert ? 'alert-mode' : ''}`} style={{ display: 'grid', gridTemplateColumns: '260px 1fr 350px', gap: '1.5rem', height: '100vh', padding: '1.5rem', overflow: 'hidden' }}>

      {/* Column 1 (Left): Navigation & System Health */}
      <motion.div
        className="glass-panel"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}
      >
        <div className="corner-brackets" />
        <div className="hud-title" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.2rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(34, 197, 94, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Shield className="icon" size={24} /> TRINETRA</div>
          <div style={{ fontSize: '0.65rem', color: 'gray', letterSpacing: '2px' }}>MINISTRY OF DEFENCE<br />[ BHARAT / INDIA ]</div>
        </div>

        <div className="nav-links" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {['DASHBOARD', 'BORDER-SENTRY', 'GEO-EYE', 'TRACK-GUARD'].map(tab => (
            <button
              key={tab}
              className={`nav-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
              style={{ width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'flex-start' }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button
            className={`nav-btn btn-safe`}
            style={{ width: '100%', borderColor: isHindi ? 'var(--accent)' : 'gray', color: isHindi ? 'var(--accent)' : 'gray' }}
            onClick={() => setIsHindi(!isHindi)}
          >
            {isHindi ? 'भाषा: हिंदी' : 'LANG: ENG'}
          </button>

          <button
            className={`nav-btn btn-danger`}
            style={{ width: '100%', borderColor: 'var(--danger)', color: 'var(--danger)' }}
            onClick={() => {
              setBorderData({ distance: 12, speed: 105, riskScore: 98, level: 'CRITICAL', xai: 'MANUAL OVERRIDE: FORCED BREACH DETECTED.', threat: 'TEST_HOSTILE' });
              addLog("[SYS] MANUAL PROTOCOL 'TEST BREACH' INITIATED. GLOBAL ALERT STATE ACTIVE.", "critical");
              playTacticalPing();
            }}
          >
            <AlertTriangle size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
            [ TEST BREACH ]
          </button>

          <button
            className={`nav-btn ${simActive ? 'btn-danger' : 'btn-safe'}`}
            style={{ width: '100%', borderColor: simActive ? 'var(--warning)' : 'var(--safe)', color: simActive ? 'var(--warning)' : 'var(--safe)' }}
            onClick={() => !simActive && setSimActive(true)}
          >
            {simActive ? `[ SIM RUNNING: ${simTick}s ]` : '[ START SIMULATION ]'}
          </button>

          <div className="status-indicator" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px', padding: '1rem', background: 'rgba(0,0,0,0.5)', borderLeft: `2px solid ${isAlert ? 'var(--danger)' : 'var(--safe)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="status-dot" style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: isAlert ? 'var(--danger)' : 'var(--safe)', boxShadow: `0 0 10px ${isAlert ? 'var(--danger)' : 'var(--safe)'}` }}></div>
              <span style={{ fontSize: '0.8rem', color: isAlert ? 'var(--danger)' : 'var(--safe)', fontWeight: 'bold' }}>
                {isAlert ? 'DEFCON 1 (CRITICAL)' : 'DEFENSE GRID ONLINE'}
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'gray' }}>SYSTEM HEALTH: {100 - (simTick / 2)}%</div>
          </div>
        </div>
      </motion.div>

      {/* Column 2 (Center): The Main 'Eye' Feed (16:9) */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', height: '100%' }}>
        <div style={{ width: '100%', aspectRatio: '16/9', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <AnimatePresence mode='wait'>

            {activeTab === 'DASHBOARD' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', height: '100%' }}
              >
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="corner-brackets" />
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)' }}><Activity size={20} /> LOGIC ENGINE METRICS</h3>

                  <div className="stat-box" style={{ borderColor: isAlert ? 'var(--danger)' : 'rgba(34,197,94,0.15)' }}>
                    <div><div className="label">FUZZY RISK SCORE</div><div className="value" style={{ color: isAlert ? 'var(--danger)' : (borderData.level === 'WARNING' ? 'var(--warning)' : 'var(--accent)') }}>{borderData.riskScore}%</div></div>
                    <Activity size={32} color={isAlert ? 'var(--danger)' : 'var(--accent)'} />
                  </div>

                  <div className="stat-box">
                    <div><div className="label">TARGET SPEED</div><div className="value">{borderData.speed} KM/H</div></div>
                    <Target size={32} color="var(--accent)" />
                  </div>

                  <div className="stat-box">
                    <div><div className="label">TARGET DISTANCE</div><div className="value">{borderData.distance} M</div></div>
                    <Radio size={32} color="var(--accent)" />
                  </div>

                  {borderData.xai && (
                    <div style={{ marginTop: 'auto', padding: '1rem', background: 'rgba(0,0,0,0.5)', borderLeft: `3px solid ${isAlert ? 'var(--danger)' : 'var(--warning)'}` }}>
                      <div className="label" style={{ fontSize: '0.7rem', color: 'gray', marginBottom: '0.5rem' }}>EXPLAINABLE AI REASONING (XAI):</div>
                      <div style={{ fontStyle: 'italic', fontSize: '1rem', color: 'var(--text-main)' }}>
                        {isHindi ? translateToHindi(borderData.xai) : borderData.xai}
                      </div>
                    </div>
                  )}
                </div>

                <div className="glass-panel">
                  <div className="corner-brackets" />
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', marginBottom: '1rem' }}><MapIcon size={20} /> THREAT RISK GRAPH (0-100)</h3>
                  <div style={{ height: 'calc(100% - 3rem)' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={threatHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 197, 94, 0.1)" />
                        <XAxis dataKey="time" stroke="var(--accent)" fontSize={11} />
                        <YAxis domain={[0, 100]} stroke="var(--accent)" fontSize={11} />
                        <Tooltip contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--accent)', color: 'var(--accent)' }} />
                        <Line type="monotone" dataKey="val" stroke={isAlert ? "var(--danger)" : "var(--accent)"} strokeWidth={2} isAnimationActive={!!simActive} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'BORDER-SENTRY' && (
              <motion.div
                key="bordersentry"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
                className="glass-panel"
                style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
              >
                <div className="corner-brackets" />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--accent)', letterSpacing: '2px', zIndex: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Video size={16} /> LIVE INFERENCE: SEC-7</div>
                  <div style={{ fontSize: '0.8rem', color: 'gray' }}>[ DRAG MOUSE ON VIDEO TO DRAW VIRTUAL R.O.I ]</div>
                  {isAlert && <div className="blink-text" style={{ color: 'var(--danger)' }}>CRITICAL THREAT: {borderData.threat}</div>}
                </div>

                <div
                  style={{ flex: 1, position: 'relative', border: '1px solid rgba(80,80,80,0.5)', backgroundColor: '#000', overflow: 'hidden', cursor: 'crosshair' }}
                  onMouseDown={startDrawROI}
                  onMouseMove={drawROI}
                  onMouseUp={endDrawROI}
                  onMouseLeave={endDrawROI}
                >
                  <video
                    ref={videoRef}
                    autoPlay playsInline muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                  />
                  <canvas
                    ref={canvasRef}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                  />

                  {/* Manual ROI Rendering */}
                  {roiBox && (
                    <div style={{
                      position: 'absolute',
                      top: roiBox.y, left: roiBox.x,
                      width: roiBox.w, height: roiBox.h,
                      border: '2px dashed var(--safe)',
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      pointerEvents: 'none'
                    }}>
                      <span style={{ position: 'absolute', top: '-20px', left: 0, color: 'var(--safe)', fontSize: '0.7rem', fontWeight: 'bold' }}>NO-GO ZONE</span>
                    </div>
                  )}

                  {/* Inference Target Overlay */}
                  {simActive && simTick > 2 && (
                    <motion.div
                      className="bounding-box"
                      animate={{
                        width: 50 + (100 - borderData.distance) * 2,
                        height: 50 + (100 - borderData.distance) * 2,
                        x: 100 + (simTick * 15),
                        y: 100 + (simTick * 6)
                      }}
                      transition={{ type: 'tween', ease: 'linear', duration: 1 }}
                      style={{
                        position: 'absolute',
                        top: 0, left: 0,
                        border: `2px solid ${isAlert ? 'var(--danger)' : borderData.level === 'WARNING' ? 'var(--warning)' : 'var(--safe)'}`,
                        backgroundColor: isAlert ? 'rgba(220, 38, 38, 0.2)' : 'transparent',
                        display: 'flex', flexDirection: 'column',
                        pointerEvents: 'none'
                      }}
                    >
                      <div style={{ position: 'absolute', top: -25, left: -2, background: isAlert ? 'var(--danger)' : borderData.level === 'WARNING' ? 'var(--warning)' : 'var(--safe)', color: '#000', fontSize: '0.7rem', padding: '2px 6px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                        {borderData.threat} | {borderData.speed}km/h
                      </div>
                      <div className="corner-brackets-inner" style={{ borderColor: isAlert ? 'var(--danger)' : 'var(--safe)' }}></div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'GEO-EYE' && (
              <motion.div
                key="geoeye"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="glass-panel"
                style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                <div className="topo-bg" />
                <div className="corner-brackets" />
                <div style={{ color: 'var(--accent)', letterSpacing: '2px', display: 'flex', justifyContent: 'space-between' }}>
                  <span><Scan size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> GIS: SECTOR-7 COMMAND OVERWATCH [JHARKHAND]</span>
                  <button onClick={triggerGeoScan} disabled={geoData.scanning} style={{ background: geoData.scanning ? 'var(--warning)' : 'transparent', border: '1px solid var(--accent)', color: geoData.scanning ? 'black' : 'var(--accent)', padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {geoData.scanning ? '[ SCANNING... ]' : '[ RUN SUBTRACTION SCAN ]'}
                  </button>
                </div>

                <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden', border: `2px solid ${geoData.scanning ? 'var(--warning)' : 'var(--glass-border)'}`, position: 'relative' }}>
                  <MapContainer center={[23.75, 86.41]} zoom={13} style={{ height: '100%', width: '100%', backgroundColor: '#0a0a0a' }}>
                    <TileLayer
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                      attribution="Tiles &copy; Esri &mdash; Source: Esri."
                    />

                    {geoData.changes.map((change, idx) => (
                      <Circle
                        key={idx}
                        center={[change.lat, change.lng]}
                        radius={change.radius}
                        pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.5 }}
                      >
                        <Popup>
                          <strong>CRITICAL RISK: {change.risk}%</strong><br />
                          Suspected Illegal Mining / Heat Anomaly.
                        </Popup>
                      </Circle>
                    ))}
                  </MapContainer>
                  {geoData.scanning && <div className="radar-overlay"></div>}
                </div>
              </motion.div>
            )}

            {activeTab === 'TRACK-GUARD' && (
              <motion.div
                key="trackguard"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="glass-panel"
                style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
              >
                <div className="corner-brackets" />
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', marginBottom: '1rem' }}><Train size={20} /> TRACK-GUARD RAILWAY OVERWATCH</h3>

                <div style={{ flex: 1, display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 2, background: 'repeating-linear-gradient(90deg, #111, #111 40px, #222 40px, #222 42px)', position: 'relative', border: '1px solid rgba(80,80,80,0.5)', overflow: 'hidden' }}>

                    <div style={{ position: 'absolute', top: '50%', width: '100%', height: '4px', background: '#444' }}></div>
                    <div style={{ position: 'absolute', top: '55%', width: '100%', height: '4px', background: '#444' }}></div>

                    {trackData.detected && (
                      <div style={{ position: 'absolute', left: '70%', top: '48%', background: 'var(--warning)', padding: '2px 8px', borderRadius: '4px', color: 'black', fontWeight: 'bold', zIndex: 10, animation: 'pulse 1s infinite' }}>
                        OBSTRUCTION ({trackData.object})
                      </div>
                    )}

                    {/* Train approaching */}
                    <motion.div
                      animate={{ left: trackData.detected ? '50%' : '110%' }}
                      transition={{ duration: 15, ease: 'linear' }}
                      style={{ position: 'absolute', top: '45%', width: '60px', height: '30px', background: 'var(--accent)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', fontWeight: 'bold', fontSize: '10px' }}
                    >
                      TRN-12042
                    </motion.div>

                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="stat-box" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <div className="label">OBSTRUCTION CLASS</div>
                      <div className="value" style={{ color: trackData.detected ? 'var(--warning)' : 'var(--safe)', fontSize: '1.2rem' }}>{trackData.object}</div>
                    </div>
                    <div className="stat-box" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <div className="label">TRAIN DISTANCE / SPEED</div>
                      <div className="value" style={{ color: 'var(--warning)', fontSize: '1.2rem' }}>{Math.round(trackData.distance)}m / {trackData.trainSpeed}km/h</div>
                    </div>
                    <div className="stat-box" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <div className="label">EST. TIME TO IMPACT (ETI)</div>
                      <div className="value" style={{ color: trackData.timeToImpact < 20 ? 'var(--danger)' : 'var(--safe)' }}>{trackData.timeToImpact}s</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* Column 3 (Right): Real-time Logs & Incident Report controls */}
      <motion.div
        className="glass-panel alert-sidebar"
        initial={{ x: 50, opacity: 0 }}
        animate={{
          x: 0, opacity: 1,
          borderColor: isAlert ? 'var(--danger)' : 'var(--glass-border)',
          boxShadow: isAlert ? '0 0 20px rgba(220, 38, 38, 0.2), inset 0 0 15px rgba(220, 38, 38, 0.1)' : '0 0 15px rgba(34, 197, 94, 0.1), inset 0 0 20px rgba(0,0,0,0.8)'
        }}
        style={{ width: '100%', display: 'flex', flexDirection: 'column' }}
      >
        <div className="corner-brackets" />
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem', color: isAlert ? 'var(--danger)' : 'var(--accent)', textShadow: isAlert ? '0 0 5px rgba(220, 38, 38, 0.5)' : '0 0 5px var(--accent-glow)', marginBottom: '1rem' }}>
          <Terminal size={18} /> INCIDENT & LOGS
        </h3>

        {isAlert && (
          <button
            onClick={handleGenerateReport}
            className="nav-btn btn-danger"
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', padding: '1rem', marginBottom: '1.5rem', animation: 'pulse 1.5s infinite' }}
          >
            <Download size={18} /> DISPATCH INCIDENT PDF
          </button>
        )}

        <div className="console-font" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
          <AnimatePresence initial={false}>
            {logs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20, height: 0 }} animate={{ opacity: 1, x: 0, height: 'auto' }}
                className={`log-entry ${log.type === 'critical' ? 'critical' : log.type === 'warning' ? 'warning' : ''}`}
                style={{ fontSize: '0.75rem', wordBreak: 'break-word' }}
              >
                <TypewriterText text={log.text} speed={10} />
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={logsEndRef} />
        </div>
      </motion.div>
    </div>
  );
}
