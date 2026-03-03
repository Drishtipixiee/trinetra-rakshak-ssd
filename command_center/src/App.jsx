import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Activity, Crosshair, AlertTriangle, Eye, Server, Cpu, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const dummyData = [
  { time: '00:00', threats: 2 },
  { time: '04:00', threats: 1 },
  { time: '08:00', threats: 5 },
  { time: '12:00', threats: 2 },
  { time: '16:00', threats: 8 },
  { time: '20:00', threats: 3 },
];

const TypewriterText = ({ text, delay = 0, speed = 30 }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let i = 0;
    let timer;

    const startTyping = () => {
      timer = setInterval(() => {
        if (i < text.length) {
          setDisplayedText((prev) => prev + text.charAt(i));
          i++;
        } else {
          clearInterval(timer);
        }
      }, speed);
    };

    const delayTimer = setTimeout(startTyping, delay);

    return () => {
      clearTimeout(delayTimer);
      clearInterval(timer);
    };
  }, [text, delay, speed]);

  return (
    <span>
      {displayedText}
      {displayedText.length < text.length && <span className="typewriter-cursor" />}
    </span>
  );
};


export default function App() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0, filter: 'blur(10px)' },
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
        <div className="corner-brackets"></div>
        <div className="corner-brackets-inner"></div>
        <div className="hud-title">
          <Shield className="icon" size={32} />
          TRINETRA RAKSHAK :: TACTICAL COMMAND
        </div>
        <div className="status-indicator">
          <div className="status-dot"></div>
          DEFENSE GRID ONLINE
        </div>
      </motion.header>

      {/* Left Sidebar */}
      <motion.div className="sidebar" variants={itemVariants}>
        <div className="glass-panel stat-card">
          <div className="corner-brackets"></div>
          <div className="corner-brackets-inner"></div>
          <div>
            <div className="stat-label">Sensors Deployed</div>
            <div className="stat-value">24/24</div>
          </div>
          <Activity size={36} color="var(--accent)" />
        </div>

        <div className="glass-panel stat-card">
          <div className="corner-brackets"></div>
          <div className="corner-brackets-inner"></div>
          <div>
            <div className="stat-label">DEFCON Level</div>
            <div className="stat-value" style={{ color: 'var(--warning)', textShadow: '0 0 10px rgba(245, 158, 11, 0.6)' }}>3</div>
          </div>
          <AlertTriangle size={36} color="var(--warning)" />
        </div>

        <div className="glass-panel" style={{ flex: 1 }}>
          <div className="corner-brackets"></div>
          <div className="corner-brackets-inner"></div>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.2rem', color: 'var(--accent)', textShadow: '0 0 5px var(--accent-glow)' }}>
            <Server size={20} /> NETWORK NODES
          </h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { id: 'ALPHA-SEC-01', status: 'optimal', color: 'var(--safe)' },
              { id: 'BETA-PER-02', status: 'optimal', color: 'var(--safe)' },
              { id: 'GAMMA-RAD-03', status: 'degraded', color: 'var(--warning)' },
              { id: 'DELTA-UAV-04', status: 'optimal', color: 'var(--safe)' }
            ].map((node, i) => (
              <li key={node.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', borderBottom: '1px solid rgba(74, 222, 128, 0.1)', paddingBottom: '0.5rem' }}>
                <span style={{ letterSpacing: '1px' }}>{node.id}</span>
                <span style={{ color: node.color, textTransform: 'uppercase', textShadow: `0 0 5px ${node.color}` }}>{node.status}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* Main View */}
      <motion.div className="main-view" variants={itemVariants}>
        <div className="glass-panel" style={{ flex: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          <div className="corner-brackets"></div>
          <div className="corner-brackets-inner"></div>

          <div style={{ position: 'absolute', top: 15, left: 15, color: 'var(--accent)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '2px', fontWeight: '600' }}>
            <Target size={16} /> GEO-EYE RADAR SWEEP
          </div>

          <div style={{ position: 'absolute', top: 15, right: 15, color: 'var(--danger)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '2px', fontWeight: '600', animation: 'blink 2s infinite' }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--danger)', boxShadow: '0 0 10px var(--danger)' }}></span>
            REC
          </div>

          {/* Radar Representation */}
          <div style={{ width: '85%', aspectRatio: '1/1', maxHeight: '100%', maxWidth: '350px' }}>
            <div className="radar-container">
              <div className="radar-sweep"></div>
              <Crosshair size={100} color="var(--accent)" strokeWidth={0.5} style={{ opacity: 0.3, position: 'absolute' }} />
              {/* Dummy Targets */}
              <div className="radar-target" style={{ top: '30%', left: '60%', animationDelay: '1.2s' }}></div>
              <div className="radar-target" style={{ top: '70%', left: '40%', animationDelay: '3.5s', backgroundColor: 'var(--warning)', boxShadow: '0 0 10px var(--warning)' }}></div>
              <div style={{ position: 'absolute', width: '2px', height: '100%', background: 'rgba(74, 222, 128, 0.3)' }}></div>
              <div style={{ position: 'absolute', height: '2px', width: '100%', background: 'rgba(74, 222, 128, 0.3)' }}></div>
              {/* Rings */}
              <div style={{ position: 'absolute', width: '33%', height: '33%', borderRadius: '50%', border: '1px solid rgba(74, 222, 128, 0.2)' }}></div>
              <div style={{ position: 'absolute', width: '66%', height: '66%', borderRadius: '50%', border: '1px solid rgba(74, 222, 128, 0.2)' }}></div>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ flex: 1 }}>
          <div className="corner-brackets"></div>
          <div className="corner-brackets-inner"></div>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', letterSpacing: '1px', color: 'var(--accent)', textShadow: '0 0 5px var(--accent-glow)' }}>THREAT VELOCITY ANALYSIS</h3>
          <div style={{ height: 'calc(100% - 2rem)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dummyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(74, 222, 128, 0.1)" />
                <XAxis dataKey="time" stroke="var(--accent)" fontSize={11} tick={{ fill: 'var(--accent)' }} />
                <YAxis stroke="var(--accent)" fontSize={11} tick={{ fill: 'var(--accent)' }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--accent)',
                    borderRadius: '0',
                    color: 'var(--accent)',
                    boxShadow: '0 0 10px rgba(74, 222, 128, 0.3)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="threats"
                  stroke="var(--danger)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: 'var(--bg-color)', stroke: 'var(--danger)', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: 'var(--danger)', stroke: 'white' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Right Sidebar */}
      <motion.div className="sidebar" variants={itemVariants}>
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="corner-brackets"></div>
          <div className="corner-brackets-inner"></div>

          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.2rem', color: 'var(--accent)', textShadow: '0 0 5px var(--accent-glow)' }}>
            <Cpu size={20} /> FUZZY ENGINE LOGS
          </h3>

          <div style={{
            fontSize: '0.85rem',
            fontFamily: '"Fira Code", monospace, Consolas',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.8rem',
            overflowY: 'auto',
            flex: 1
          }}>
            <p>
              <span style={{ color: 'var(--accent)' }}>[{new Date().toLocaleTimeString()}]</span> <span style={{ color: 'var(--text-main)', opacity: 0.8 }}>SYS:</span> <br />
              <span style={{ color: 'var(--safe)', textShadow: '0 0 5px var(--safe)' }}><TypewriterText text="Fuzzy Logic Engine Initialized. Weights calibrated." delay={500} speed={20} /></span>
            </p>
            <p>
              <span style={{ color: 'var(--accent)' }}>[{new Date().toLocaleTimeString()}]</span> <span style={{ color: 'var(--text-main)', opacity: 0.8 }}>TRK:</span> <br />
              <span style={{ color: 'var(--safe)' }}><TypewriterText text="Object velocity tracking normal. No anomalies in Sector 7G." delay={2000} speed={20} /></span>
            </p>
            <p>
              <span style={{ color: 'var(--accent)' }}>[{new Date().toLocaleTimeString()}]</span> <span style={{ color: 'var(--text-main)', opacity: 0.8 }}>SENS:</span> <br />
              <span style={{ color: 'var(--warning)', textShadow: '0 0 5px var(--warning)' }}><TypewriterText text="WARN: Low visibility at Northern Perimeter." delay={4000} speed={20} /></span>
            </p>
            <p>
              <span style={{ color: 'var(--accent)' }}>[{new Date().toLocaleTimeString()}]</span> <span style={{ color: 'var(--text-main)', opacity: 0.8 }}>AI:</span> <br />
              <span style={{ color: 'var(--danger)', textShadow: '0 0 5px var(--danger)' }}><TypewriterText text="CRITICAL: Unidentified high-speed entity near Danger Zone. Risk Score: 85." delay={7000} speed={20} /></span>
            </p>
            <p>
              <span style={{ color: 'var(--accent)' }}>[{new Date().toLocaleTimeString()}]</span> <span style={{ color: 'var(--text-main)', opacity: 0.8 }}>SYS:</span> <br />
              <span style={{ color: 'var(--safe)' }}><TypewriterText text="Countermeasures standing by. Awaiting command." delay={10000} speed={20} /></span>
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
