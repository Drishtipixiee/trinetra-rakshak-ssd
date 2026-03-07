import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle, Shield, Eye } from 'lucide-react';

const SEVERITY_CONFIG = {
    CRITICAL: { color: 'var(--danger)', icon: AlertTriangle, bg: 'rgba(220,38,38,0.1)' },
    WARNING: { color: 'var(--warning)', icon: Eye, bg: 'rgba(245,158,11,0.1)' },
    NORMAL: { color: 'var(--safe)', icon: Shield, bg: 'rgba(34,197,94,0.05)' },
};

export default function IncidentTimeline({ logs = [] }) {
    const incidents = logs.map((log, idx) => {
        let severity = 'NORMAL';
        if (log.type === 'critical') severity = 'CRITICAL';
        else if (log.type === 'warning') severity = 'WARNING';

        const sectorMatch = log.text.match(/\[([A-Z0-9-]+)\]/);
        const sector = sectorMatch ? sectorMatch[1] : 'SYS';

        return { ...log, severity, sector, idx };
    }).reverse().slice(0, 20);

    return (
        <div className="incident-timeline">
            <div className="timeline-header">
                <Clock size={14} /> INCIDENT TIMELINE
                <span className="timeline-count">{incidents.length}</span>
            </div>

            <div className="timeline-scroll">
                <div className="timeline-line" />
                <AnimatePresence initial={false}>
                    {incidents.map((inc) => {
                        const cfg = SEVERITY_CONFIG[inc.severity];
                        const Icon = cfg.icon;
                        const timeStr = new Date(inc.id).toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' });

                        return (
                            <motion.div
                                key={inc.id}
                                className="timeline-item"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                style={{ borderLeftColor: cfg.color }}
                            >
                                <div className="timeline-dot" style={{ backgroundColor: cfg.color, boxShadow: `0 0 8px ${cfg.color}` }} />
                                <div className="timeline-content" style={{ background: cfg.bg }}>
                                    <div className="timeline-meta">
                                        <span className="timeline-time">{timeStr}</span>
                                        <span className="timeline-sector" style={{ color: cfg.color }}>[{inc.sector}]</span>
                                        <span className="timeline-severity" style={{ color: cfg.color }}>
                                            <Icon size={10} /> {inc.severity}
                                        </span>
                                    </div>
                                    <div className="timeline-text">{inc.text.replace(/\[[A-Z0-9-]+\]\s*/, '')}</div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}
