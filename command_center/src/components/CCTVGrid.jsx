import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Maximize2, X, AlertTriangle, Shield, Camera, CameraOff } from 'lucide-react';

const CAMERAS = [
    {
        id: 'CAM-01', name: 'MAIN GATE — SEC-7A', coords: 'N28°38\'12" E77°13\'04"',
        scenario: [
            { time: [0, 6], detections: [], status: 'CLEAR' },
            { time: [6, 12], detections: [{ class: 'vehicle', conf: 82, x: 20, y: 40, w: 22, h: 14, risk: 55, dx: 4 }], status: 'VEHICLE APPROACHING' },
            { time: [12, 18], detections: [{ class: 'person', conf: 91, x: 45, y: 30, w: 10, h: 28, risk: 75, dx: 1 }], status: 'PERSONNEL EXITING VEHICLE' },
            { time: [18, 180], detections: [], status: 'ACCESS GRANTED' },
        ]
    },
    {
        id: 'CAM-02', name: 'PERIMETER NORTH', coords: 'N28°38\'18" E77°13\'09"',
        scenario: [
            { time: [0, 8], detections: [], status: 'SCANNING' },
            {
                time: [8, 15], detections: [
                    { class: 'person', conf: 68, x: 80, y: 35, w: 9, h: 22, risk: 62, dx: -3 },
                    { class: 'person', conf: 55, x: 90, y: 38, w: 8, h: 20, risk: 58, dx: -3.5 },
                ], status: '⚠ 2 UNKNOWNS DETECTED'
            },
            { time: [15, 25], detections: [{ class: 'person', conf: 92, x: 50, y: 30, w: 18, h: 45, risk: 92, dx: -1 }], status: '⚠ BREACH ATTEMPT - COMBATANT' },
            { time: [25, 180], detections: [], status: 'THREAT NEUTRALIZED' },
        ]
    },
    {
        id: 'CAM-03', name: 'EAST WATCHTOWER', coords: 'N28°38\'15" E77°13\'15"',
        scenario: [
            { time: [0, 20], detections: [], status: 'CLEAR' },
            { time: [20, 30], detections: [{ class: 'animal', conf: 88, x: 10, y: 50, w: 15, h: 10, risk: 20, dx: 3 }], status: 'WILDLIFE (STRAY DOG)' },
            { time: [30, 40], detections: [], status: 'CLEAR — AUTO-CLASSIFIED' },
            { time: [40, 180], detections: [{ class: 'drone', conf: 73, x: 20, y: 15, w: 8, h: 5, risk: 90, dx: 5, dy: 2 }], status: '⚠ UAV IN AIRSPACE' },
        ]
    },
    {
        id: 'CAM-04', name: 'COMMAND BUNKER', coords: 'N28°38\'10" E77°13\'00"',
        scenario: [
            { time: [0, 180], detections: [], status: 'SECURE — NO MOVEMENT' },
        ]
    },
];

function drawCameraDetections(canvas, phase, tick) {
    if (!canvas || !phase) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Dynamic noise background (with low opacity to see the video!)
    const imgData = ctx.createImageData(W, H);
    for (let i = 0; i < imgData.data.length; i += 4) {
        const v = Math.random() * 20;
        imgData.data[i] = v; imgData.data[i + 1] = v + 5; imgData.data[i + 2] = v;
        imgData.data[i + 3] = 40; // Reduced opacity to 15% so video shows perfectly!
    }
    ctx.putImageData(imgData, 0, 0);

    // Scan line
    const scanY = (tick * 60) % H;
    ctx.fillStyle = 'rgba(34,197,94,0.06)';
    ctx.fillRect(0, scanY, W, 3);

    // Detections
    const jitter = Math.sin(tick * 5) * 1.5;
    const phaseStart = phase.time[0];
    const detections = phase.detections;

    detections.forEach(det => {
        const tDiff = tick - phaseStart;
        const xOff = det.dx ? tDiff * det.dx : 0;
        const yOff = det.dy ? tDiff * det.dy : 0;

        const x = ((det.x + xOff) / 100) * W + jitter;
        const y = ((det.y + yOff) / 100) * H + jitter;
        const w = (det.w / 100) * W;
        const h = (det.h / 100) * H;
        
        if (x < -W || x > W*2) return; // simple clamp

        const color = det.risk > 70 ? '#ef4444' : det.risk > 40 ? '#f59e0b' : '#22c55e';
        const conf = Math.min(99, det.conf + Math.floor(Math.random() * 3 - 1));

        // Box
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        // Corner marks
        const cl = Math.min(w, h) * 0.3;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, y + cl); ctx.lineTo(x, y); ctx.lineTo(x + cl, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + w - cl, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + cl); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y + h - cl); ctx.lineTo(x, y + h); ctx.lineTo(x + cl, y + h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + w - cl, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cl); ctx.stroke();

        // Label
        const label = `${det.class} ${conf}% [${det.risk > 70 ? 'CRIT' : 'WARN'}]`;
        ctx.font = '10px "Share Tech Mono"';
        const tw = ctx.measureText(label).width + 6;
        ctx.fillStyle = color;
        ctx.fillRect(x, y - 14, tw, 13);
        ctx.fillStyle = '#000';
        ctx.fillText(label, x + 3, y - 3);
    });

    // Crosshair
    ctx.strokeStyle = 'rgba(34,197,94,0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
    ctx.setLineDash([]);
}

export default function CCTVGrid({ active = false, voiceRef, voiceEnabled, setDetectionData, setSmsText, setSmsVisible, playDetectionBeep }) {
    const [expandedCam, setExpandedCam] = useState(null);
    const [tick, setTick] = useState(0);
    const canvasRefs = useRef([]);
    const modalCanvasRef = useRef(null);
    const prevStatusRef = useRef({});

    // Live webcam state
    const [liveStream, setLiveStream] = useState(null);
    const [liveError, setLiveError] = useState('');
    const liveVideoRef = useRef(null);
    const liveCanvasRef = useRef(null);
    const liveAnimRef = useRef(null);

    const startLiveFeed = async () => {
        setLiveError('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 360 }
            });
            setLiveStream(stream);
            if (liveVideoRef.current) {
                liveVideoRef.current.srcObject = stream;
            }
        } catch (err) {
            if (err.name === 'NotAllowedError') {
                setLiveError('Camera permission denied. Allow access in browser settings.');
            } else if (err.name === 'NotFoundError') {
                setLiveError('No camera device found on this system.');
            } else {
                setLiveError(`Camera error: ${err.message}`);
            }
        }
    };

    const stopLiveFeed = () => {
        if (liveStream) {
            liveStream.getTracks().forEach(t => t.stop());
            setLiveStream(null);
        }
        if (liveAnimRef.current) {
            cancelAnimationFrame(liveAnimRef.current);
            liveAnimRef.current = null;
        }
    };

    // Draw live video frames + AI overlay onto canvas
    useEffect(() => {
        if (!liveStream || !liveVideoRef.current || !liveCanvasRef.current) return;

        const video = liveVideoRef.current;
        const canvas = liveCanvasRef.current;
        const ctx = canvas.getContext('2d');

        const drawFrame = () => {
            if (!liveStream) return;
            canvas.width = canvas.parentElement?.clientWidth || 320;
            canvas.height = canvas.parentElement?.clientHeight || 200;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // AI scan line overlay on live feed
            const scanY = (Date.now() * 0.06) % canvas.height;
            ctx.fillStyle = 'rgba(34,197,94,0.06)';
            ctx.fillRect(0, scanY, canvas.width, 3);

            // Crosshair overlay
            ctx.strokeStyle = 'rgba(34,197,94,0.15)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath(); ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2); ctx.stroke();
            ctx.setLineDash([]);

            liveAnimRef.current = requestAnimationFrame(drawFrame);
        };

        video.onloadedmetadata = () => drawFrame();

        return () => {
            if (liveAnimRef.current) cancelAnimationFrame(liveAnimRef.current);
        };
    }, [liveStream]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (liveStream) liveStream.getTracks().forEach(t => t.stop());
        };
    }, []);

    useEffect(() => {
        // High refresh rate tick (10x faster updates, interpolates 0.1s slices)
        const timer = setInterval(() => setTick(t => Number((t + 0.1).toFixed(1)) % 180), 100);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        CAMERAS.forEach((cam, i) => {
            const phase = cam.scenario.find(s => tick >= s.time[0] && tick < s.time[1]);
            if (phase && canvasRefs.current[i]) {
                const canvas = canvasRefs.current[i];
                canvas.width = canvas.parentElement?.clientWidth || 320;
                canvas.height = canvas.parentElement?.clientHeight || 200;
                drawCameraDetections(canvas, phase, tick);

                const status = phase.status;
                if (prevStatusRef.current[cam.id] !== status && status !== 'CLEAR' && status !== 'SCANNING' && status !== 'SECURE — NO MOVEMENT') {
                    if (status.includes('⚠') && voiceRef?.current && voiceEnabled) {
                        const txt = `CCTV Alert. ${cam.name}. ${status.replace('⚠', '')}. Security detail respond.`;
                        voiceRef.current.speak(txt, 'critical');
                        
                        if (setDetectionData && status.includes('BREACH')) {
                            setDetectionData(prev => ({ ...prev, threatLevel: 'CRITICAL', riskScore: 95, primaryClass: 'ARMED INTRUDER', personCount: 2, label: cam.id }));
                            if (playDetectionBeep) playDetectionBeep();
                            if (setSmsText) {
                                setSmsText(`ALERT: ${status.replace('⚠', '')} at ${cam.name}. Deploy QRF immediately.`);
                                setSmsVisible(true);
                                setTimeout(() => setSmsVisible(false), 6000);
                            }
                        }

                    } else if (voiceRef?.current && voiceEnabled && phase.detections.length > 0) {
                        const txt = `CCTV Update. ${cam.name}. ${status}.`;
                        voiceRef.current.speak(txt, 'normal');
                    }
                } else if (prevStatusRef.current[cam.id] !== status && (status === 'CLEAR' || status === 'THREAT NEUTRALIZED')) {
                    if (voiceRef?.current && voiceEnabled) {
                        voiceRef.current.speak(`CCTV All clear. ${cam.name}.`);
                    }
                    if (setDetectionData && prevStatusRef.current[cam.id]?.includes('BREACH')) {
                        setDetectionData(prev => ({ ...prev, threatLevel: 'LOW', riskScore: 0, primaryClass: 'NONE', personCount: 0, label: 'IDLE' }));
                    }
                }
                prevStatusRef.current[cam.id] = status;
            } else if (!phase) {
                prevStatusRef.current[cam.id] = cam.scenario[0].status;
            }
        });

        // Modal canvas
        if (expandedCam !== null && modalCanvasRef.current) {
            const cam = CAMERAS[expandedCam];
            const phase = cam.scenario.find(s => tick >= s.time[0] && tick < s.time[1]);
            if (phase) {
                modalCanvasRef.current.width = modalCanvasRef.current.parentElement?.clientWidth || 900;
                modalCanvasRef.current.height = modalCanvasRef.current.parentElement?.clientHeight || 506;
                drawCameraDetections(modalCanvasRef.current, phase, tick);
            }
        }
    }, [tick, expandedCam]);

    const getStatus = (cam) => {
        const phase = cam.scenario.find(s => tick >= s.time[0] && tick < s.time[1]);
        return phase || cam.scenario[0];
    };

    const camTime = new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' });

    return (
        <motion.div key="cctv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 4, gap: 4, background: '#000' }}
        >
            <div className="cctv-grid">
                {CAMERAS.map((cam, index) => {
                    const phase = getStatus(cam);
                    const hasDetections = phase.detections.length > 0;
                    const isCritical = phase.detections.some(d => d.risk > 70);

                    return (
                        <div key={cam.id}
                            className={`cctv-feed ${isCritical ? 'critical' : hasDetections ? 'degraded' : ''}`}
                            onClick={() => setExpandedCam(index)}
                            style={{ position: 'relative' }}
                        >
                            <video
                                autoPlay
                                loop
                                muted
                                playsInline
                                style={{
                                    position: 'absolute', inset: 0,
                                    width: '100%', height: '100%',
                                    objectFit: 'cover', zIndex: 0, opacity: 0.6
                                }}
                                src="https://assets.mixkit.co/videos/preview/mixkit-fence-with-barbed-wire-39853-large.mp4"
                            />
                            <canvas ref={el => canvasRefs.current[index] = el} className="cctv-noise" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }} />
                            
                            {/* Real-world analogy: Face Capture Snapshot */}
                            {isCritical && hasDetections && (
                                <div style={{
                                    position: 'absolute', right: 8, top: 40, width: 60, height: 75,
                                    background: 'rgba(0,0,0,0.8)', border: '1px solid #ef4444',
                                    zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <img src="https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=100&h=100&fit=crop" style={{ width: 45, height: 45, filter: 'grayscale(100%) contrast(150%)', border: '1px solid #555' }} alt="suspect" />
                                    <div style={{ fontSize: '7px', color: '#ef4444', marginTop: 4, fontFamily: "'Share Tech Mono'" }}>WANTED</div>
                                </div>
                            )}

                            <div className="cctv-overlay">
                                <div className="cctv-top-bar">
                                    <div className="cctv-id">
                                        <span className={`cctv-rec-dot ${isCritical ? 'degraded' : 'recording'}`} style={isCritical ? { background: '#ef4444', animation: 'blink 0.5s step-end infinite' } : {}} />
                                        {cam.id}
                                    </div>
                                    <div className="cctv-status" style={isCritical ? { color: '#ef4444', background: 'rgba(239,68,68,0.15)' } : hasDetections ? { color: '#f59e0b' } : {}}>
                                        {phase.status}
                                    </div>
                                </div>

                                {hasDetections && (
                                    <div className="cctv-alert-badge" style={isCritical ? { borderColor: '#ef4444', color: '#ef4444', background: 'rgba(239,68,68,0.15)' } : {}}>
                                        {isCritical ? <AlertTriangle size={10} /> : <Shield size={10} />}
                                        {phase.detections.length} TARGET{phase.detections.length > 1 ? 'S' : ''}
                                    </div>
                                )}

                                <div className="cctv-crosshair"><div className="ch-h" /><div className="ch-v" /></div>

                                <div className="cctv-bottom-bar">
                                    <div>
                                        <div className="cctv-name">{cam.name}</div>
                                        <div className="cctv-coords">{cam.coords}</div>
                                    </div>
                                    <div className="cctv-time">{camTime}</div>
                                </div>
                            </div>

                            <button className="cctv-expand-btn" onClick={(e) => { e.stopPropagation(); setExpandedCam(index); }}>
                                <Maximize2 size={12} />
                            </button>
                            <div className="cctv-scanlines" />
                        </div>
                    );
                })}

                {/* CAM-05: LIVE WEBCAM FEED */}
                <div
                    className={`cctv-feed ${liveStream ? 'degraded' : ''}`}
                    style={{ position: 'relative' }}
                >
                    {/* Hidden video element for getUserMedia */}
                    <video
                        ref={liveVideoRef}
                        autoPlay muted playsInline
                        style={{ display: 'none' }}
                    />

                    {liveStream ? (
                        <canvas
                            ref={liveCanvasRef}
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }}
                        />
                    ) : (
                        <div style={{
                            position: 'absolute', inset: 0,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(0,0,0,0.9)', zIndex: 1, gap: 8
                        }}>
                            <Camera size={24} style={{ color: 'var(--accent)', opacity: 0.5 }} />
                            <div style={{ fontSize: '0.55rem', color: 'var(--text-dim)', textAlign: 'center', padding: '0 8px' }}>
                                {liveError || 'Press START to activate live camera feed'}
                            </div>
                            {liveError && (
                                <div style={{ fontSize: '0.5rem', color: 'var(--danger)', textAlign: 'center', padding: '0 8px' }}>
                                    {liveError}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="cctv-overlay">
                        <div className="cctv-top-bar">
                            <div className="cctv-id">
                                <span className={`cctv-rec-dot ${liveStream ? 'recording' : ''}`} style={liveStream ? { background: '#ef4444' } : {}} />
                                CAM-05
                            </div>
                            <div className="cctv-status" style={liveStream ? { color: '#22c55e' } : {}}>
                                {liveStream ? 'LIVE FEED ACTIVE' : 'STANDBY'}
                            </div>
                        </div>

                        <div className="cctv-crosshair"><div className="ch-h" /><div className="ch-v" /></div>

                        <div className="cctv-bottom-bar">
                            <div>
                                <div className="cctv-name">LIVE CAM -- LOCAL DEVICE</div>
                                <div className="cctv-coords">getUserMedia WebRTC</div>
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                                {!liveStream ? (
                                    <button
                                        onClick={startLiveFeed}
                                        style={{
                                            background: 'rgba(34,197,94,0.2)', border: '1px solid var(--accent)',
                                            color: 'var(--accent)', padding: '2px 8px', borderRadius: 4,
                                            cursor: 'pointer', fontFamily: "'Share Tech Mono'", fontSize: '0.5rem'
                                        }}
                                    >
                                        START
                                    </button>
                                ) : (
                                    <button
                                        onClick={stopLiveFeed}
                                        style={{
                                            background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444',
                                            color: '#ef4444', padding: '2px 8px', borderRadius: 4,
                                            cursor: 'pointer', fontFamily: "'Share Tech Mono'", fontSize: '0.5rem'
                                        }}
                                    >
                                        STOP
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="cctv-scanlines" />
                </div>
            </div>

            {/* Expanded Modal */}
            <AnimatePresence>
                {expandedCam !== null && (
                    <motion.div className="cctv-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setExpandedCam(null)}>
                        <motion.div className="cctv-modal-content" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}>
                            <div className="cctv-modal-header">
                                <span>{CAMERAS[expandedCam].id} — {CAMERAS[expandedCam].name}</span>
                                <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>{CAMERAS[expandedCam].coords}</span>
                                <button className="cctv-close-btn" onClick={() => setExpandedCam(null)}><X size={14} /></button>
                            </div>
                            <div className="cctv-modal-feed" style={{ position: 'relative' }}>
                                <video
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    style={{
                                        position: 'absolute', inset: 0,
                                        width: '100%', height: '100%',
                                        objectFit: 'cover', zIndex: 0, opacity: 0.6
                                    }}
                                    src="https://assets.mixkit.co/videos/preview/mixkit-fence-with-barbed-wire-39853-large.mp4"
                                />
                                <canvas ref={modalCanvasRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 1 }} />
                                
                                {getStatus(CAMERAS[expandedCam]).detections.some(d => d.risk > 70) && (
                                    <div style={{
                                        position: 'absolute', right: 16, top: 40, width: 90, height: 110,
                                        background: 'rgba(0,0,0,0.8)', border: '2px solid #ef4444',
                                        zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <img src="https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=100&h=100&fit=crop" style={{ width: 70, height: 70, filter: 'grayscale(100%) contrast(150%)', border: '1px solid #555' }} alt="suspect" />
                                        <div style={{ fontSize: '10px', color: '#ef4444', marginTop: 6, fontFamily: "'Share Tech Mono'" }}>WANTED // HIGH RISK</div>
                                    </div>
                                )}
                                
                                <div className="cctv-modal-rec" style={{ zIndex: 2 }}><div className="rec-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'breathe 1.5s infinite' }} /> REC</div>
                                <div className="video-scanlines" />
                                <div style={{ position: 'absolute', bottom: 10, left: 10, display: 'flex', gap: 6 }}>
                                    <div className="hud-badge info" style={{ fontSize: '0.65rem' }}>{getStatus(CAMERAS[expandedCam]).status}</div>
                                    {getStatus(CAMERAS[expandedCam]).detections.length > 0 && (
                                        <div className="hud-badge warning" style={{ fontSize: '0.65rem' }}>
                                            {getStatus(CAMERAS[expandedCam]).detections.length} DETECTION(S)
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
