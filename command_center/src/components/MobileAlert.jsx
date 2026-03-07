import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCheck, X, Phone, MapPin, Clock, Send } from 'lucide-react';

const AI_MESSAGES = [
    { type: 'sms', from: 'TRINETRA AI', body: (cls, risk, sector) => `⚠ CRITICAL ALERT\n${cls} detected at ${sector}.\nRisk Score: ${risk}%\nQRF Alpha dispatched — ETA 4 min.\nRespond ASAP.` },
    { type: 'sms', from: 'SEC-7 OPS', body: (cls, risk, sector) => `Intel update: ${cls} confirmed at ${sector} via multi-sensor fusion.\nThreat level ELEVATED.\nAll units maintain heightened readiness.` },
    { type: 'whatsapp', from: 'Cmd. Sharma', body: (cls, risk) => `Threat ${cls} flagged by AI — risk ${risk}%. I am monitoring from HQ. Keep me updated on ground situation. 🔴` },
];

export default function MobileAlert({ threatLevel, riskScore, threatClass, sector = 'SEC-7A' }) {
    const [alerts, setAlerts] = useState([]);
    const [lastTrigger, setLastTrigger] = useState(0);
    const [msgIndex, setMsgIndex] = useState(0);

    useEffect(() => {
        if (threatLevel === 'CRITICAL' && Date.now() - lastTrigger > 6000) {
            setLastTrigger(Date.now());
            const template = AI_MESSAGES[msgIndex % AI_MESSAGES.length];
            setMsgIndex(prev => prev + 1);

            const newAlert = {
                id: Date.now(),
                time: new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }),
                message: template.body(threatClass || 'Hostile', riskScore, sector),
                status: 'sent',
                from: template.from,
                type: template.type
            };
            setAlerts(prev => [...prev.slice(-2), newAlert]);

            // Delivery simulation
            setTimeout(() => setAlerts(prev => prev.map(a => a.id === newAlert.id ? { ...a, status: 'delivered' } : a)), 1200);
            setTimeout(() => setAlerts(prev => prev.map(a => a.id === newAlert.id ? { ...a, status: 'read' } : a)), 3500);
            // Auto dismiss
            setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== newAlert.id)), 12000);
        }
    }, [threatLevel, riskScore, threatClass, sector, lastTrigger, msgIndex]);

    const dismiss = (id) => setAlerts(prev => prev.filter(a => a.id !== id));

    if (alerts.length === 0) return null;

    return (
        <div className="mobile-alert-container">
            <AnimatePresence>
                {alerts.map(alert => (
                    <motion.div
                        key={alert.id}
                        className="mobile-phone"
                        initial={{ opacity: 0, y: 60, scale: 0.8, rotate: -2 }}
                        animate={{
                            opacity: 1, y: 0, scale: 1, rotate: 0,
                            x: [0, -4, 4, -3, 3, -1, 1, 0],
                        }}
                        exit={{ opacity: 0, y: 40, scale: 0.8 }}
                        transition={{
                            type: 'spring', stiffness: 300, damping: 20,
                            x: { duration: 0.6, ease: 'easeInOut' }
                        }}
                    >
                        <div className="phone-notch" />

                        <div className="phone-statusbar">
                            <span>{alert.time} IST</span>
                            <div className="phone-icons"><span>📶</span><span>🔋 92%</span></div>
                        </div>

                        <div className="phone-notification">
                            <div className="phone-notif-header">
                                <div className="phone-notif-icon" style={alert.type === 'whatsapp' ? { background: 'rgba(37,211,102,0.2)' } : {}}>
                                    {alert.type === 'whatsapp' ? <Send size={14} style={{ color: '#25D366' }} /> : <Shield size={14} />}
                                </div>
                                <div>
                                    <div className="phone-notif-from">{alert.from}</div>
                                    <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                        {alert.type === 'whatsapp' ? 'WhatsApp' : 'SMS'} • <MapPin size={8} /> {sector}
                                    </div>
                                </div>
                                <button className="phone-close" onClick={() => dismiss(alert.id)}><X size={12} /></button>
                            </div>

                            <div className="phone-notif-body" style={{ whiteSpace: 'pre-line' }}>
                                {alert.message}
                            </div>

                            <div className="phone-notif-footer">
                                <div className="phone-receipt">
                                    <CheckCheck size={12} style={{ color: alert.status === 'read' ? '#53bdeb' : alert.status === 'delivered' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)' }} />
                                    <span style={{ color: alert.status === 'read' ? '#53bdeb' : 'rgba(255,255,255,0.4)' }}>
                                        {alert.status === 'read' ? 'Read' : alert.status === 'delivered' ? 'Delivered' : 'Sent'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Clock size={9} style={{ color: 'rgba(255,255,255,0.3)' }} />
                                    <span className="phone-notif-time">{alert.time}</span>
                                </div>
                            </div>
                        </div>

                        <div className="phone-reply">
                            <div className="phone-reply-input">
                                <Phone size={10} style={{ opacity: 0.4 }} /> Tap to call command...
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
