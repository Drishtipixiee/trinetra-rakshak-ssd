import { useState, useEffect } from 'react';
import { Cpu, HardDrive, Wifi, Database } from 'lucide-react';

const CircularGauge = ({ value, label, icon: Icon, color, maxVal = 100 }) => {
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    const pct = Math.min(value / maxVal, 1);
    const offset = circumference - pct * circumference;

    const getColor = () => {
        if (pct > 0.85) return 'var(--danger)';
        if (pct > 0.65) return 'var(--warning)';
        return color || 'var(--accent)';
    };

    return (
        <div className="vital-gauge">
            <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
                <circle
                    cx="40" cy="40" r={radius} fill="none"
                    stroke={getColor()} strokeWidth="5"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 40 40)"
                    style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s ease' }}
                />
                <text x="40" y="36" textAnchor="middle" fill={getColor()} fontSize="14" fontFamily="'Share Tech Mono'" fontWeight="bold">
                    {Math.round(value)}%
                </text>
                <text x="40" y="52" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="'Share Tech Mono'">
                    {label}
                </text>
            </svg>
            <div className="vital-icon" style={{ color: getColor() }}>
                <Icon size={12} />
            </div>
        </div>
    );
};

export default function SystemVitals() {
    const [vitals, setVitals] = useState({
        cpu: 34, ram: 52, network: 78, storage: 41
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setVitals(prev => ({
                cpu: Math.max(15, Math.min(95, prev.cpu + (Math.random() - 0.45) * 8)),
                ram: Math.max(30, Math.min(88, prev.ram + (Math.random() - 0.5) * 3)),
                network: Math.max(40, Math.min(99, prev.network + (Math.random() - 0.5) * 6)),
                storage: Math.max(35, Math.min(70, prev.storage + (Math.random() - 0.5) * 0.5))
            }));
        }, 2000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="system-vitals">
            <div className="vitals-label">SYSTEM HEALTH</div>
            <div className="vitals-grid">
                <CircularGauge value={vitals.cpu} label="CPU" icon={Cpu} />
                <CircularGauge value={vitals.ram} label="RAM" icon={Database} />
                <CircularGauge value={vitals.network} label="NET" icon={Wifi} />
                <CircularGauge value={vitals.storage} label="DISK" icon={HardDrive} />
            </div>
        </div>
    );
}
