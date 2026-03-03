import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Activity, Crosshair, AlertTriangle, Eye, Server, Cpu } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const dummyData = [
  { time: '00:00', threats: 2 },
  { time: '04:00', threats: 1 },
  { time: '08:00', threats: 5 },
  { time: '12:00', threats: 3 },
  { time: '16:00', threats: 8 },
  { time: '20:00', threats: 4 },
];

export default function App() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0, filter: 'blur(5px)' },
    visible: { 
      y: 0, 
      opacity: 1, 
      filter: 'blur(0px)',
      transition: { type: 'spring', stiffness: 100, damping: 12 } 
    }
  };

  if (!mounted) return null;

  return (
    <motion.div 
      className="hud-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.header className="glass-panel hud-header" variants={itemVariants}>
        <div className="hud-title">
          <Shield className="icon" size={28} />
          Trinetra Rakshak :: Command Center
        </div>
        <div className="status-indicator">
          <div className="status-dot"></div>
          System Online - Shield Active
        </div>
      </motion.header>

      {/* Left Sidebar */}
      <motion.div className="sidebar" variants={itemVariants}>
        <div className="glass-panel stat-card">
          <div>
            <div className="stat-label">Active Sensors</div>
            <div className="stat-value">24/24</div>
          </div>
          <Activity size={32} color="var(--accent)" />
        </div>
        
        <div className="glass-panel stat-card">
          <div>
            <div className="stat-label">Threat Level</div>
            <div className="stat-value" style={{ color: 'var(--safe)' }}>LOW</div>
          </div>
          <AlertTriangle size={32} color="var(--safe)" />
        </div>
        
        <div className="glass-panel" style={{ flex: 1 }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
            <Server size={18}/> Node Status
          </h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {['Alpha-1', 'Beta-2', 'Gamma-3', 'Delta-4'].map((node, i) => (
              <li key={node} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span>{node}</span>
                <span style={{ color: 'var(--safe)' }}>✓ Online</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* Main View */}
      <motion.div className="main-view" variants={itemVariants}>
        <div className="glass-panel" style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {/* Radar / Grid representation */}
          <div style={{ position: 'absolute', top: 10, left: 10, color: 'var(--accent)', opacity: 0.5, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Eye size={14} /> LIVE FEED: CAM-01
          </div>
          <div style={{ width: '100%', height: '100%', border: '1px solid rgba(0, 240, 255, 0.1)', background: 'repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(0, 240, 255, 0.05) 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(0, 240, 255, 0.05) 20px)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div 
               animate={{ rotate: 360 }} 
               transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            >
              <Crosshair size={64} color="var(--accent)" strokeWidth={1} style={{ opacity: 0.5 }} />
            </motion.div>
          </div>
        </div>
        
        <div className="glass-panel" style={{ flex: 1 }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Anomaly Detection History</h3>
          <div style={{ height: '150px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dummyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <Tooltip contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--accent)' }} />
                <Line type="monotone" dataKey="threats" stroke="var(--accent)" strokeWidth={2} dot={{ r: 4, fill: 'var(--bg-color)', stroke: 'var(--accent)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Right Sidebar */}
      <motion.div className="sidebar" variants={itemVariants}>
        <div className="glass-panel" style={{ flex: 1 }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
            <Cpu size={18}/> AI Engine Logs
          </h3>
          <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p><span style={{color: 'var(--accent)'}}>[{new Date().toLocaleTimeString()}]</span> SYS: Fuzzy Logic Engine Initialized.</p>
            <p><span style={{color: 'var(--accent)'}}>[{new Date().toLocaleTimeString()}]</span> SYS: Object velocity tracking optimal.</p>
            <p><span style={{color: 'var(--accent)'}}>[{new Date().toLocaleTimeString()}]</span> SCAN: Area 51 clear.</p>
            <p><span style={{color: 'var(--safe)'}}>[{new Date().toLocaleTimeString()}]</span> IDLE: Waiting for trigger...</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
