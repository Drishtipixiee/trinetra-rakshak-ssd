import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Shield, CheckCheck, X } from 'lucide-react';

export default function MobileAlert({ threatLevel, riskScore, threatClass, sector = 'SEC-7A' }) {
    const [alerts, setAlerts] = useState([]);
    const [lastTrigger, setLastTrigger] = useState(0);

    useEffect(() => {
        // Only trigger on CRITICAL and not too frequently (8 second cooldown)
        if (threatLevel === 'CRITICAL' && Date.now() - lastTrigger > 8000) {
            setLastTrigger(Date.now());
            const newAlert = {
                id: Date.now(),
                time: new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }),
                message: `⚠ CRITICAL: ${threatClass || 'Unidentified threat'} detected at ${sector}. Risk: ${riskScore}%. QRF alerted. Respond immediately.`,
                status: 'delivered',
                from: 'TRINETRA COMMAND'
            };
            setAlerts(prev => [...prev.slice(-2), newAlert]);

            // Simulate read receipt
            setTimeout(() => {
                setAlerts(prev => prev.map(a =>
                    a.id === newAlert.id ? { ...a, status: 'read' } : a
                ));
            }, 3000);

            // Auto dismiss
            setTimeout(() => {
                setAlerts(prev => prev.filter(a => a.id !== newAlert.id));
            }, 10000);
        }
    }, [threatLevel, riskScore, threatClass, sector, lastTrigger]);

    const dismiss = (id) => {
        setAlerts(prev => prev.filter(a => a.id !== id));
    };

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
                            x: [0, -3, 3, -2, 2, 0], // vibration
                        }}
                        exit={{ opacity: 0, y: 40, scale: 0.8 }}
                        transition={{
                            type: 'spring', stiffness: 300, damping: 20,
                            x: { duration: 0.5, ease: 'easeInOut' }
                        }}
                    >
                        {/* Phone notch */}
                        <div className="phone-notch" />

                        {/* Status bar */}
                        <div className="phone-statusbar">
                            <span>{alert.time}</span>
                            <div className="phone-icons">
                                <span>📶</span>
                                <span>🔋</span>
                            </div>
                        </div>

                        {/* SMS Notification */}
                        <div className="phone-notification">
                            <div className="phone-notif-header">
                                <div className="phone-notif-icon">
                                    <Shield size={16} />
                                </div>
                                <div className="phone-notif-from">{alert.from}</div>
                                <button className="phone-close" onClick={() => dismiss(alert.id)}>
                                    <X size={12} />
                                </button>
                            </div>
                            <div className="phone-notif-body">
                                {alert.message}
                            </div>
                            <div className="phone-notif-footer">
                                <div className="phone-receipt">
                                    <CheckCheck size={12} />
                                    <span>{alert.status === 'read' ? 'Read' : 'Delivered'}</span>
                                </div>
                                <span className="phone-notif-time">{alert.time} IST</span>
                            </div>
                        </div>

                        {/* Quick reply simulation */}
                        <div className="phone-reply">
                            <div className="phone-reply-input">Slide to respond...</div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
