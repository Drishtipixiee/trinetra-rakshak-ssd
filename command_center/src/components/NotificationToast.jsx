import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Shield, Eye, X } from 'lucide-react';

const TOAST_DURATION = 5000;

export default function NotificationToast({ logs = [] }) {
    const [toasts, setToasts] = useState([]);
    const [lastProcessed, setLastProcessed] = useState(0);

    const dismiss = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    useEffect(() => {
        // Only show toasts for new critical/warning logs 
        const newLogs = logs.filter(l =>
            (l.type === 'critical' || l.type === 'warning') && l.id > lastProcessed
        );

        if (newLogs.length > 0) {
            setLastProcessed(Math.max(...newLogs.map(l => l.id)));
            const newToasts = newLogs.slice(-3).map(l => ({
                id: l.id,
                text: l.text,
                type: l.type,
                createdAt: Date.now()
            }));
            setToasts(prev => [...prev, ...newToasts].slice(-5));
        }
    }, [logs, lastProcessed]);

    // Auto-dismiss
    useEffect(() => {
        const timer = setInterval(() => {
            setToasts(prev => prev.filter(t => Date.now() - t.createdAt < TOAST_DURATION));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div className="toast-container">
            <AnimatePresence>
                {toasts.map((toast) => {
                    const isCritical = toast.type === 'critical';
                    const Icon = isCritical ? AlertTriangle : Eye;
                    return (
                        <motion.div
                            key={toast.id}
                            className={`toast-item ${toast.type}`}
                            initial={{ opacity: 0, x: 100, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 100, scale: 0.8 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        >
                            <div className="toast-icon" style={{ color: isCritical ? 'var(--danger)' : 'var(--warning)' }}>
                                <Icon size={18} />
                            </div>
                            <div className="toast-body">
                                <div className="toast-title">{isCritical ? 'CRITICAL ALERT' : 'WARNING'}</div>
                                <div className="toast-text">{toast.text}</div>
                            </div>
                            <button className="toast-close" onClick={() => dismiss(toast.id)}>
                                <X size={14} />
                            </button>
                            <div className="toast-progress" style={{
                                backgroundColor: isCritical ? 'var(--danger)' : 'var(--warning)',
                                animationDuration: `${TOAST_DURATION}ms`
                            }} />
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
