import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, PieChart, TrendingUp, Activity, Shield, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';

const SECTOR_DATA = [
    { name: 'SEC-7A', threats: 12, color: 'var(--danger)' },
    { name: 'SEC-7B', threats: 8, color: 'var(--warning)' },
    { name: 'SEC-7C', threats: 5, color: 'var(--accent)' },
    { name: 'SEC-7D', threats: 15, color: 'var(--danger)' },
    { name: 'SEC-8A', threats: 3, color: 'var(--safe)' },
    { name: 'SEC-8B', threats: 7, color: 'var(--warning)' },
];

const THREAT_TYPES = [
    { type: 'Human Intruder', count: 23, color: '#dc2626' },
    { type: 'Vehicle', count: 11, color: '#f59e0b' },
    { type: 'Wildlife', count: 18, color: '#22c55e' },
    { type: 'UAV/Drone', count: 6, color: '#3b82f6' },
    { type: 'Mining Activity', count: 9, color: '#a855f7' },
];

const RESPONSE_TREND = [
    { time: '00:00', avg: 4.2 },
    { time: '04:00', avg: 3.8 },
    { time: '08:00', avg: 5.1 },
    { time: '12:00', avg: 6.3 },
    { time: '16:00', avg: 4.5 },
    { time: '20:00', avg: 3.9 },
    { time: 'NOW', avg: 4.1 },
];

const KPICard = ({ icon: Icon, label, value, unit, color, trend }) => (
    <div className="kpi-card">
        <div className="kpi-icon" style={{ color }}>
            <Icon size={20} />
        </div>
        <div className="kpi-data">
            <div className="kpi-value" style={{ color }}>{value}<span className="kpi-unit">{unit}</span></div>
            <div className="kpi-label">{label}</div>
        </div>
        {trend && (
            <div className="kpi-trend" style={{ color: trend > 0 ? 'var(--danger)' : 'var(--safe)' }}>
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </div>
        )}
    </div>
);

export default function AnalyticsDashboard() {
    const [sectorData, setSectorData] = useState(SECTOR_DATA);
    const [animKey, setAnimKey] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setSectorData(prev => prev.map(s => ({
                ...s,
                threats: Math.max(0, s.threats + Math.floor((Math.random() - 0.45) * 3))
            })));
            setAnimKey(k => k + 1);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const totalAlerts = sectorData.reduce((a, b) => a + b.threats, 0);

    return (
        <motion.div
            key="analytics"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="glass-panel"
            style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
            <div className="corner-brackets" />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--accent)', letterSpacing: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BarChart3 size={16} /> OPERATIONAL ANALYTICS — LAST 24H
                </div>
                <div style={{ fontSize: '0.7rem', color: 'gray' }}>AUTO-REFRESH: 5s</div>
            </div>

            {/* KPI Row */}
            <div className="analytics-kpi-row">
                <KPICard icon={AlertTriangle} label="TOTAL ALERTS" value={totalAlerts} unit="" color="var(--warning)" trend={12} />
                <KPICard icon={Clock} label="AVG RESPONSE" value="4.1" unit="min" color="var(--accent)" trend={-8} />
                <KPICard icon={CheckCircle} label="RESOLVED" value="94" unit="%" color="var(--safe)" />
                <KPICard icon={Shield} label="THREAT LEVEL" value="ELEVATED" unit="" color="var(--warning)" />
            </div>

            {/* Charts Grid */}
            <div className="analytics-charts">
                {/* Bar chart: Threats per sector */}
                <div className="analytics-chart-box">
                    <h4 style={{ color: 'var(--accent)', fontSize: '0.8rem', letterSpacing: '1px', marginBottom: '0.5rem' }}>
                        <Activity size={14} style={{ verticalAlign: 'middle' }} /> THREATS BY SECTOR
                    </h4>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={sectorData} key={animKey}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,197,94,0.1)" />
                            <XAxis dataKey="name" stroke="var(--accent)" fontSize={10} />
                            <YAxis stroke="var(--accent)" fontSize={10} />
                            <Tooltip contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--accent)', color: 'var(--accent)', fontFamily: "'Share Tech Mono'" }} />
                            <Bar dataKey="threats" radius={[4, 4, 0, 0]}>
                                {sectorData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.threats > 10 ? '#dc2626' : entry.threats > 6 ? '#f59e0b' : '#22c55e'} fillOpacity={0.8} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Right side: Threat types + Response trend */}
                <div className="analytics-right-col">
                    {/* Threat type breakdown */}
                    <div className="analytics-chart-box">
                        <h4 style={{ color: 'var(--accent)', fontSize: '0.8rem', letterSpacing: '1px', marginBottom: '0.5rem' }}>
                            <PieChart size={14} style={{ verticalAlign: 'middle' }} /> THREAT CLASSIFICATION
                        </h4>
                        <div className="threat-type-list">
                            {THREAT_TYPES.map((t, i) => {
                                const maxCount = Math.max(...THREAT_TYPES.map(x => x.count));
                                return (
                                    <div key={i} className="threat-type-item">
                                        <div className="threat-type-label">{t.type}</div>
                                        <div className="threat-type-bar-bg">
                                            <motion.div
                                                className="threat-type-bar"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(t.count / maxCount) * 100}%` }}
                                                transition={{ duration: 1, delay: i * 0.1 }}
                                                style={{ backgroundColor: t.color }}
                                            />
                                        </div>
                                        <div className="threat-type-count" style={{ color: t.color }}>{t.count}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Response time trend */}
                    <div className="analytics-chart-box">
                        <h4 style={{ color: 'var(--accent)', fontSize: '0.8rem', letterSpacing: '1px', marginBottom: '0.5rem' }}>
                            <TrendingUp size={14} style={{ verticalAlign: 'middle' }} /> RESPONSE TIME TREND (min)
                        </h4>
                        <ResponsiveContainer width="100%" height={100}>
                            <LineChart data={RESPONSE_TREND}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,197,94,0.1)" />
                                <XAxis dataKey="time" stroke="var(--accent)" fontSize={9} />
                                <YAxis domain={[0, 10]} stroke="var(--accent)" fontSize={9} />
                                <Line type="monotone" dataKey="avg" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)', r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
