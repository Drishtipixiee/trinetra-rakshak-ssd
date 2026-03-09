import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Train, Map as MapIcon, Terminal, Play, CheckCircle2, ChevronRight, Activity } from 'lucide-react';

const FLOWS = [
    {
        id: 'perimeter',
        title: 'PERIMETER SURVEILLANCE',
        icon: Video,
        color: 'var(--accent)',
        description: 'AI-driven border intrusion detection and live tracking.',
        steps: [
            { text: 'Switch to LIVE FEED mode.', action: (p) => p.setActiveTab('LIVE'), duration: 1500 },
            { text: 'Start Software Simulation Engine.', action: (p) => p.setSimActive(true), duration: 2000 },
            { text: 'AI isolates targets with Bounding Boxes.', action: null, duration: 4000 },
            { text: 'Intrusion data pushed to SQLite DB.', action: null, duration: 2500 },
            { text: 'Threat alert sent to Dashboard ticker.', action: (p) => p.setActiveTab('DASHBOARD'), duration: 2000 }
        ]
    },
    {
        id: 'track',
        title: 'TRACK-GUARD AUTO-BRAKE',
        icon: Train,
        color: 'var(--safe)',
        description: 'Autonomous wildlife detection and train braking.',
        steps: [
            { text: 'Switch to TRACK-GUARD mode.', action: (p) => p.setActiveTab('TRACK-GUARD'), duration: 1500 },
            { text: 'Start Railway Simulation.', action: (p) => p.setTrackActive(true), duration: 2000 },
            { text: 'Obstruction (Wildlife) detected on tracks.', action: null, duration: 4000 },
            { text: 'Calculate Time to Impact dynamically.', action: null, duration: 3000 },
            { text: 'Auto-brake signal sent to targeted train.', action: null, duration: 3000 }
        ]
    },
    {
        id: 'geoeye',
        title: 'SATELLITE GIS (GEO-EYE)',
        icon: MapIcon,
        color: '#f59e0b',
        description: 'Illegal mining detection via terrain subtraction.',
        steps: [
            { text: 'Switch to GEO-EYE mode.', action: (p) => p.setActiveTab('GEO-EYE'), duration: 1500 },
            { text: 'Initiate GIS Terrain Scan.', action: (p) => p.triggerGeoScan(), duration: 2500 },
            { text: 'Radar overlay fetches satellite data.', action: null, duration: 3000 },
            { text: 'Mining hotspots plotted on tactical map.', action: null, duration: 3000 },
            { text: 'Threat radius identified by AI.', action: null, duration: 2500 }
        ]
    },
    {
        id: 'backend',
        title: 'SYSTEM-WIDE SCENARIOS',
        icon: Terminal,
        color: '#a855f7',
        description: 'Python Flask backend direct event injection.',
        steps: [
            { text: 'Switch to SIMULATIONS mode.', action: (p) => p.setActiveTab('SIMULATION'), duration: 1500 },
            { text: 'Target UAV DRONE scenario payload.', action: null, duration: 2000 },
            { text: 'Inject payload to Python Flask API.', action: (p) => p.triggerBackendSim('DRONE'), duration: 2500 },
            { text: 'Backend inserts events into SQLite DB.', action: null, duration: 3000 },
            { text: 'React synchronizes Live Database Stream.', action: null, duration: 3000 }
        ]
    }
];

export default function FlowSimulationDashboard({
    setActiveTab,
    setSimActive,
    setTrackActive,
    triggerGeoScan,
    triggerBackendSim,
    addLog
}) {
    const [activeFlowId, setActiveFlowId] = useState(FLOWS[0].id);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);
    const playRef = useRef(null);

    const activeFlow = FLOWS.find(f => f.id === activeFlowId);

    // Auto-play logic
    useEffect(() => {
        if (!isPlaying) {
            if (playRef.current) clearTimeout(playRef.current);
            return;
        }

        const steps = activeFlow.steps;

        // Start or advance step
        if (currentStepIndex < steps.length) {
            const step = steps[currentStepIndex === -1 ? 0 : currentStepIndex];

            // Execute side effect if this is the start of the step
            if (step.action && currentStepIndex !== -1) {
                step.action({ setActiveTab, setSimActive, setTrackActive, triggerGeoScan, triggerBackendSim });
            }

            playRef.current = setTimeout(() => {
                if (currentStepIndex + 1 < steps.length) {
                    setCurrentStepIndex(prev => prev + 1);
                } else {
                    // Finished
                    setIsPlaying(false);
                    addLog(`[SYSTEM] Flow "${activeFlow.title}" demonstration completed.`, 'safe');
                    setTimeout(() => setCurrentStepIndex(-1), 3000);
                }
            }, currentStepIndex === -1 ? 500 : step.duration);
        }

        return () => {
            if (playRef.current) clearTimeout(playRef.current);
        };
    }, [isPlaying, currentStepIndex, activeFlow]);

    const handleStartFlow = () => {
        if (isPlaying) return;
        addLog(`[SYSTEM] Starting interactive flow demo: ${activeFlow.title}`, 'normal');
        setIsPlaying(true);
        setCurrentStepIndex(0);
    };

    const handleStopFlow = () => {
        setIsPlaying(false);
        setCurrentStepIndex(-1);
        if (playRef.current) clearTimeout(playRef.current);
    };

    return (
        <div style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid var(--glass-border)',
            borderRadius: 12,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            marginTop: 8
        }}>
            {/* Header Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)' }}>
                {FLOWS.map((flow) => {
                    const Icon = flow.icon;
                    const isActive = activeFlowId === flow.id;
                    return (
                        <div
                            key={flow.id}
                            onClick={() => {
                                if (!isPlaying) {
                                    setActiveFlowId(flow.id);
                                    setCurrentStepIndex(-1);
                                }
                            }}
                            style={{
                                flex: 1,
                                padding: '12px 0',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 6,
                                cursor: isPlaying ? 'not-allowed' : 'pointer',
                                background: isActive ? `rgba(${getRGB(flow.color)}, 0.1)` : 'transparent',
                                borderBottom: isActive ? `2px solid ${flow.color}` : '2px solid transparent',
                                opacity: isPlaying && !isActive ? 0.3 : 1,
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <Icon size={16} color={isActive ? flow.color : 'var(--text-dim)'} />
                            <span style={{
                                fontSize: '0.65rem',
                                fontFamily: "'Share Tech Mono'",
                                color: isActive ? flow.color : 'var(--text-dim)',
                                letterSpacing: 1,
                                textAlign: 'center'
                            }}>
                                {flow.title}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Flow Content Area */}
            <div style={{ display: 'flex', minHeight: 260 }}>

                {/* Left Info Panel */}
                <div style={{
                    width: '35%',
                    padding: 20,
                    background: 'rgba(0,0,0,0.4)',
                    borderRight: '1px solid var(--glass-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeFlow.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <activeFlow.icon size={32} color={activeFlow.color} style={{ marginBottom: 16 }} />
                            <h3 style={{
                                fontSize: '1rem',
                                fontFamily: "'Share Tech Mono'",
                                color: activeFlow.color,
                                margin: '0 0 8px 0',
                                letterSpacing: 2
                            }}>
                                {activeFlow.title}
                            </h3>
                            <p style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-dim)',
                                lineHeight: 1.6,
                                marginBottom: 24
                            }}>
                                {activeFlow.description}
                            </p>

                            {!isPlaying ? (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleStartFlow}
                                    style={{
                                        background: `rgba(${getRGB(activeFlow.color)}, 0.15)`,
                                        border: `1px solid ${activeFlow.color}`,
                                        color: activeFlow.color,
                                        padding: '10px 16px',
                                        borderRadius: 6,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        fontFamily: "'Share Tech Mono'",
                                        fontSize: '0.8rem',
                                        letterSpacing: 1
                                    }}
                                >
                                    <Play size={14} /> RUN INTERACTIVE DEMO
                                </motion.button>
                            ) : (
                                <motion.button
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleStopFlow}
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.15)',
                                        border: '1px solid var(--danger)',
                                        color: 'var(--danger)',
                                        padding: '10px 16px',
                                        borderRadius: 6,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        fontFamily: "'Share Tech Mono'",
                                        fontSize: '0.8rem',
                                        letterSpacing: 1
                                    }}
                                >
                                    <Activity size={14} /> ABORT SEQUENCE
                                </motion.button>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Right Steps Panel */}
                <div style={{ flex: 1, padding: 24, position: 'relative' }}>

                    <div style={{
                        fontSize: '0.65rem',
                        color: 'var(--text-dim)',
                        letterSpacing: 1,
                        marginBottom: 16,
                        display: 'flex',
                        justifyContent: 'space-between'
                    }}>
                        <span>EXECUTION SEQUENCE</span>
                        {isPlaying && (
                            <span className="pulse-text" style={{ color: activeFlow.color }}>
                                ► SEQUENCE ACTIVE
                            </span>
                        )}
                    </div>

                    <div style={{ position: 'relative' }}>
                        {/* Vertical connector line */}
                        <div style={{
                            position: 'absolute',
                            left: 11,
                            top: 10,
                            bottom: 10,
                            width: 2,
                            background: 'rgba(255,255,255,0.05)',
                            zIndex: 0
                        }} />

                        {/* Animated progress line */}
                        {isPlaying && currentStepIndex >= 0 && (
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${(currentStepIndex / (activeFlow.steps.length - 1)) * 100}%` }}
                                transition={{ duration: 0.5 }}
                                style={{
                                    position: 'absolute',
                                    left: 11,
                                    top: 10,
                                    width: 2,
                                    background: activeFlow.color,
                                    zIndex: 1,
                                    boxShadow: `0 0 10px ${activeFlow.color}`
                                }}
                            />
                        )}

                        {/* Steps list */}
                        {activeFlow.steps.map((step, idx) => {
                            const isActiveNode = isPlaying && currentStepIndex === idx;
                            const isPastNode = isPlaying && currentStepIndex > idx;
                            const isFutureNode = isPlaying && currentStepIndex < idx;

                            return (
                                <div key={idx} style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 16,
                                    marginBottom: idx === activeFlow.steps.length - 1 ? 0 : 20,
                                    position: 'relative',
                                    zIndex: 2,
                                    opacity: isFutureNode ? 0.4 : 1,
                                    transition: 'opacity 0.3s'
                                }}>
                                    {/* Node icon */}
                                    <div style={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: '50%',
                                        background: isActiveNode ? activeFlow.color : isPastNode ? `rgba(${getRGB(activeFlow.color)}, 0.2)` : 'rgba(0,0,0,0.8)',
                                        border: `2px solid ${isActiveNode || isPastNode ? activeFlow.color : 'rgba(255,255,255,0.2)'}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: isActiveNode ? `0 0 15px ${activeFlow.color}` : 'none',
                                        transition: 'all 0.3s'
                                    }}>
                                        {isPastNode ? (
                                            <CheckCircle2 size={12} color={activeFlow.color} />
                                        ) : isActiveNode ? (
                                            <motion.div
                                                animate={{ scale: [1, 1.5, 1] }}
                                                transition={{ repeat: Infinity, duration: 1 }}
                                                style={{ width: 6, height: 6, borderRadius: '50%', background: '#000' }}
                                            />
                                        ) : (
                                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: "'Share Tech Mono'" }}>{idx + 1}</span>
                                        )}
                                    </div>

                                    {/* Step content */}
                                    <div style={{
                                        flex: 1,
                                        background: isActiveNode ? `rgba(${getRGB(activeFlow.color)}, 0.05)` : 'transparent',
                                        border: `1px solid ${isActiveNode ? `rgba(${getRGB(activeFlow.color)}, 0.3)` : 'transparent'}`,
                                        padding: '4px 12px',
                                        borderRadius: 6,
                                        transform: isActiveNode ? 'scale(1.02) translateX(4px)' : 'scale(1) translateX(0)',
                                        transition: 'all 0.3s',
                                        position: 'relative',
                                        top: -2
                                    }}>
                                        <div style={{
                                            color: isActiveNode || isPastNode ? 'var(--text-main)' : 'var(--text-dim)',
                                            fontSize: '0.8rem',
                                            fontWeight: isActiveNode ? 600 : 400
                                        }}>
                                            {step.text}
                                        </div>

                                        {/* Progress bar for active step */}
                                        {isActiveNode && (
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: '100%' }}
                                                transition={{ duration: step.duration / 1000, ease: 'linear' }}
                                                style={{
                                                    height: 2,
                                                    background: activeFlow.color,
                                                    marginTop: 8,
                                                    borderRadius: 2
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Simple helper to extract RGB values from CSS vars roughly to use in rgba()
function getRGB(colorVar) {
    if (colorVar === 'var(--accent)') return '34, 197, 94'; // green
    if (colorVar === 'var(--safe)') return '34, 197, 94'; // green
    if (colorVar === 'var(--warning)') return '245, 158, 11'; // amber
    if (colorVar === 'var(--danger)') return '239, 68, 68'; // red
    if (colorVar === '#f59e0b') return '245, 158, 11';
    if (colorVar === '#a855f7') return '168, 85, 247'; // purple
    return '255, 255, 255';
}
