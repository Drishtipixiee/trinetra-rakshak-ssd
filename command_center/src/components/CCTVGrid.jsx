import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Maximize2, X, AlertTriangle } from 'lucide-react';

const CAMERAS = [
    { id: 'CAM-01', name: 'GATE ALPHA', sector: 'SEC-7A', status: 'ONLINE', lat: '28.6139°N', lng: '77.2090°E' },
    { id: 'CAM-02', name: 'PERIMETER NORTH', sector: 'SEC-7B', status: 'ONLINE', lat: '28.6145°N', lng: '77.2078°E' },
    { id: 'CAM-03', name: 'CORRIDOR-7', sector: 'SEC-7C', status: 'DEGRADED', lat: '28.6128°N', lng: '77.2095°E' },
    { id: 'CAM-04', name: 'WATCHTOWER-3', sector: 'SEC-7D', status: 'ONLINE', lat: '28.6152°N', lng: '77.2102°E' },
];

const StaticNoise = ({ width = 320, height = 180 }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;

        let animId;
        const drawNoise = () => {
            const imageData = ctx.createImageData(width, height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const val = Math.random() * 40;
                data[i] = val;
                data[i + 1] = val + Math.random() * 15;
                data[i + 2] = val;
                data[i + 3] = 255;
            }
            ctx.putImageData(imageData, 0, 0);

            // Scan line
            const scanY = (Date.now() / 20) % height;
            ctx.fillStyle = 'rgba(34, 197, 94, 0.08)';
            ctx.fillRect(0, scanY, width, 3);

            animId = requestAnimationFrame(drawNoise);
        };
        drawNoise();
        return () => cancelAnimationFrame(animId);
    }, [width, height]);

    return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
};

const CameraFeed = ({ camera, onExpand }) => {
    const [ts, setTs] = useState(Date.now());

    useEffect(() => {
        const t = setInterval(() => setTs(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);

    const timeStr = new Date(ts).toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' });

    return (
        <div className={`cctv-feed ${camera.status === 'DEGRADED' ? 'degraded' : ''}`}>
            <div className="cctv-noise">
                <StaticNoise />
            </div>

            {/* HUD Overlay */}
            <div className="cctv-overlay">
                <div className="cctv-top-bar">
                    <div className="cctv-id">
                        <div className={`cctv-rec-dot ${camera.status === 'ONLINE' ? 'recording' : 'degraded'}`} />
                        {camera.id}
                    </div>
                    <span className="cctv-status">{camera.status}</span>
                </div>

                <div className="cctv-bottom-bar">
                    <div>
                        <div className="cctv-name">{camera.name}</div>
                        <div className="cctv-coords">{camera.lat} | {camera.lng}</div>
                    </div>
                    <div className="cctv-time">{timeStr}</div>
                </div>

                {/* Crosshair */}
                <div className="cctv-crosshair">
                    <div className="ch-h" />
                    <div className="ch-v" />
                </div>

                {camera.status === 'DEGRADED' && (
                    <div className="cctv-alert-badge">
                        <AlertTriangle size={14} /> SIGNAL DEGRADED
                    </div>
                )}
            </div>

            <button className="cctv-expand-btn" onClick={() => onExpand(camera)}>
                <Maximize2 size={14} />
            </button>

            {/* Scan lines */}
            <div className="cctv-scanlines" />
        </div>
    );
};

export default function CCTVGrid() {
    const [expanded, setExpanded] = useState(null);

    return (
        <motion.div
            key="cctv"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="glass-panel"
            style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
            <div className="corner-brackets" />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', color: 'var(--accent)', letterSpacing: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Video size={16} /> CCTV SURVEILLANCE GRID — {CAMERAS.filter(c => c.status === 'ONLINE').length}/{CAMERAS.length} ACTIVE
                </div>
                <div style={{ fontSize: '0.75rem', color: 'gray' }}>[ CLICK TO EXPAND ]</div>
            </div>

            <div className="cctv-grid">
                {CAMERAS.map(cam => (
                    <CameraFeed key={cam.id} camera={cam} onExpand={setExpanded} />
                ))}
            </div>

            {/* Expanded View Modal */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        className="cctv-modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="cctv-modal-content">
                            <div className="cctv-modal-header">
                                <span>{expanded.id} — {expanded.name} [{expanded.sector}]</span>
                                <button onClick={() => setExpanded(null)} className="cctv-close-btn"><X size={18} /></button>
                            </div>
                            <div className="cctv-modal-feed">
                                <StaticNoise width={960} height={540} />
                                <div className="cctv-scanlines" />
                                <div className="cctv-modal-rec">
                                    <div className="cctv-rec-dot recording" /> REC — {expanded.sector}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
