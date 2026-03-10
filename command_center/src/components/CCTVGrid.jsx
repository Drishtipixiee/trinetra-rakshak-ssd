import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Maximize2, X, AlertTriangle, Shield } from 'lucide-react';

const CAMERAS = [
    {
        id: 'CAM-01', name: 'MAIN GATE — SEC-7A', coords: 'N28°38\'12" E77°13\'04"',
        scenario: [
            { time: [0, 15], detections: [], status: 'CLEAR' },
            { time: [15, 25], detections: [{ class: 'vehicle', conf: 82, x: 30, y: 40, w: 22, h: 14, risk: 55 }], status: 'VEHICLE APPROACHING' },
            { time: [25, 40], detections: [{ class: 'person', conf: 91, x: 55, y: 30, w: 10, h: 28, risk: 75 }], status: 'PERSONNEL EXITING VEHICLE' },
            { time: [40, 180], detections: [], status: 'ACCESS GRANTED' },
        ]
    },
    {
        id: 'CAM-02', name: 'PERIMETER NORTH', coords: 'N28°38\'18" E77°13\'09"',
        scenario: [
            { time: [0, 75], detections: [], status: 'SCANNING' },
            {
                time: [75, 90], detections: [
                    { class: 'person', conf: 68, x: 65, y: 35, w: 8, h: 22, risk: 62 },
                    { class: 'person', conf: 55, x: 72, y: 38, w: 7, h: 20, risk: 58 },
                ], status: '⚠ 2 UNKNOWNS DETECTED'
            },
            { time: [90, 105], detections: [{ class: 'person', conf: 78, x: 50, y: 30, w: 12, h: 30, risk: 82 }], status: '⚠ BREACH ATTEMPT' },
            { time: [105, 180], detections: [], status: 'THREAT NEUTRALIZED' },
        ]
    },
    {
        id: 'CAM-03', name: 'EAST WATCHTOWER', coords: 'N28°38\'15" E77°13\'15"',
        scenario: [
            { time: [0, 125], detections: [], status: 'CLEAR' },
            { time: [125, 140], detections: [{ class: 'animal', conf: 88, x: 40, y: 50, w: 15, h: 10, risk: 20 }], status: 'WILDLIFE (STRAY DOG)' },
            { time: [140, 155], detections: [], status: 'CLEAR — AUTO-CLASSIFIED' },
            { time: [155, 180], detections: [{ class: 'drone', conf: 73, x: 50, y: 15, w: 8, h: 5, risk: 90 }], status: '⚠ UAV IN AIRSPACE' },
        ]
    },
    {
        id: 'CAM-04', name: 'COMMAND BUNKER', coords: 'N28°38\'10" E77°13\'00"',
        scenario: [
            { time: [0, 180], detections: [], status: 'SECURE — NO MOVEMENT' },
        ]
    },
];

function drawCameraDetections(canvas, detections, tick) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Static noise background
    const imgData = ctx.createImageData(W, H);
    for (let i = 0; i < imgData.data.length; i += 4) {
        const v = Math.random() * 20;
        imgData.data[i] = v; imgData.data[i + 1] = v + 5; imgData.data[i + 2] = v;
        imgData.data[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);

    // Scan line
    const scanY = (tick * 6) % H;
    ctx.fillStyle = 'rgba(34,197,94,0.06)';
    ctx.fillRect(0, scanY, W, 3);

    // Detections
    const jitter = Math.sin(tick * 0.5) * 1.5;
    detections.forEach(det => {
        const x = (det.x / 100) * W + jitter;
        const y = (det.y / 100) * H + jitter;
        const w = (det.w / 100) * W;
        const h = (det.h / 100) * H;
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
        const label = `${det.class} ${conf}%`;
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

export default function CCTVGrid({ active = false, voiceRef, voiceEnabled }) {
    const [expandedCam, setExpandedCam] = useState(null);
    const [tick, setTick] = useState(0);
    const canvasRefs = useRef([]);
    const modalCanvasRef = useRef(null);
    const prevStatusRef = useRef({});

    useEffect(() => {
        const timer = setInterval(() => setTick(t => (t + 1) % 180), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        CAMERAS.forEach((cam, i) => {
            const phase = cam.scenario.find(s => tick >= s.time[0] && tick < s.time[1]);
            if (phase && canvasRefs.current[i]) {
                const canvas = canvasRefs.current[i];
                canvas.width = canvas.parentElement?.clientWidth || 320;
                canvas.height = canvas.parentElement?.clientHeight || 200;
                drawCameraDetections(canvas, phase.detections, tick);

                const status = phase.status;
                if (prevStatusRef.current[cam.id] !== status && status !== 'CLEAR' && status !== 'SCANNING' && status !== 'SECURE — NO MOVEMENT') {
                    if (status.includes('⚠') && voiceRef?.current && voiceEnabled) {
                        const txt = `CCTV Alert. ${cam.name}. ${status.replace('⚠', '')}. Security detail respond.`;
                        voiceRef.current.speak(txt, 'critical');
                    } else if (voiceRef?.current && voiceEnabled && phase.detections.length > 0) {
                        const txt = `CCTV Update. ${cam.name}. ${status}.`;
                        voiceRef.current.speak(txt, 'normal');
                    }
                } else if (prevStatusRef.current[cam.id] !== status && (status === 'CLEAR' || status === 'THREAT NEUTRALIZED')) {
                    if (voiceRef?.current && voiceEnabled) {
                        voiceRef.current.speak(`CCTV All clear. ${cam.name}.`);
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
                modalCanvasRef.current.width = 900;
                modalCanvasRef.current.height = 506;
                drawCameraDetections(modalCanvasRef.current, phase.detections, tick);
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
                        >
                            <canvas ref={el => canvasRefs.current[index] = el} className="cctv-noise" />

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
                            <div className="cctv-modal-feed">
                                <canvas ref={modalCanvasRef} style={{ width: '100%', height: '100%' }} />
                                <div className="cctv-modal-rec"><div className="rec-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'breathe 1.5s infinite' }} /> REC</div>
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
