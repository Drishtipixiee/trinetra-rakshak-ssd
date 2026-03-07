import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Users, Volume2, Radio, AlertTriangle } from 'lucide-react';

const ACTIONS = [
    {
        id: 'lockdown', label: 'LOCKDOWN', icon: Lock, color: 'var(--danger)', confirm: true,
        log: '[SYS] ⚠ FACILITY LOCKDOWN INITIATED — All access points sealed. Biometric gates disabled.'
    },
    {
        id: 'qrf', label: 'DEPLOY QRF', icon: Users, color: 'var(--warning)', confirm: false,
        log: '[SYS] Quick Reaction Force (QRF) dispatched to Sector 7. ETA: 4 minutes.'
    },
    {
        id: 'alarm', label: 'SOUND ALARM', icon: Volume2, color: '#f97316', confirm: false,
        log: '[SYS] Perimeter alarm activated across all sectors. Audio alert broadcasting.'
    },
    {
        id: 'comms', label: 'EMERGENCY COMMS', icon: Radio, color: 'var(--accent)', confirm: false,
        log: '[SYS] Emergency channel FREQ-47.5MHz opened. All units alerted on secure line.'
    },
];

export default function QuickActions({ addLog, playPing }) {
    const [confirming, setConfirming] = useState(null);
    const [cooldowns, setCooldowns] = useState({});

    const executeAction = (action) => {
        if (action.confirm && confirming !== action.id) {
            setConfirming(action.id);
            setTimeout(() => setConfirming(null), 3000);
            return;
        }

        // Execute
        setConfirming(null);
        setCooldowns(prev => ({ ...prev, [action.id]: true }));
        addLog(action.log, action.id === 'lockdown' ? 'critical' : 'warning');
        if (playPing) playPing();

        setTimeout(() => {
            setCooldowns(prev => ({ ...prev, [action.id]: false }));
        }, 5000);
    };

    return (
        <div className="quick-actions">
            <div className="qa-header">QUICK ACTIONS</div>
            <div className="qa-grid">
                {ACTIONS.map(action => {
                    const Icon = action.icon;
                    const isConfirm = confirming === action.id;
                    const inCooldown = cooldowns[action.id];

                    return (
                        <motion.button
                            key={action.id}
                            className={`qa-btn ${isConfirm ? 'confirming' : ''} ${inCooldown ? 'cooldown' : ''}`}
                            style={{ '--qa-color': action.color }}
                            onClick={() => !inCooldown && executeAction(action)}
                            whileTap={{ scale: 0.95 }}
                            disabled={inCooldown}
                        >
                            {isConfirm ? (
                                <>
                                    <AlertTriangle size={14} />
                                    <span>CONFIRM?</span>
                                </>
                            ) : (
                                <>
                                    <Icon size={14} />
                                    <span>{inCooldown ? 'ACTIVE...' : action.label}</span>
                                </>
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
