import { User, Radio, Shield, MapPin } from 'lucide-react';

const PERSONNEL = [
    { name: 'Maj. Rajesh Sharma', rank: 'SECTOR COMMANDER', status: 'ACTIVE', sector: 'SEC-7', lastSeen: '2 min ago' },
    { name: 'Sub. Vikram Singh', rank: 'WATCH OFFICER', status: 'ON PATROL', sector: 'SEC-7A', lastSeen: '8 min ago' },
    { name: 'Hav. Pradeep Kumar', rank: 'SURVEILLANCE OPS', status: 'ACTIVE', sector: 'SEC-7B', lastSeen: '1 min ago' },
    { name: 'Sep. Amit Yadav', rank: 'GATE SENTRY', status: 'ACTIVE', sector: 'SEC-7A', lastSeen: 'Just now' },
    { name: 'Sep. Deepak Meena', rank: 'PERIMETER GUARD', status: 'OFF DUTY', sector: 'SEC-7C', lastSeen: '45 min ago' },
    { name: 'NK. Suresh Rathore', rank: 'COMMS OPERATOR', status: 'ACTIVE', sector: 'SEC-7', lastSeen: '3 min ago' },
];

const STATUS_COLORS = {
    'ACTIVE': 'var(--safe)',
    'ON PATROL': 'var(--warning)',
    'OFF DUTY': 'rgba(255,255,255,0.3)',
};

export default function PersonnelRoster() {
    return (
        <div className="personnel-roster">
            <div className="personnel-header">
                <Shield size={14} /> DUTY ROSTER
                <span className="personnel-online">
                    {PERSONNEL.filter(p => p.status !== 'OFF DUTY').length} ACTIVE
                </span>
            </div>
            <div className="personnel-list">
                {PERSONNEL.map((person, idx) => (
                    <div key={idx} className="personnel-item">
                        <div className="personnel-avatar" style={{ borderColor: STATUS_COLORS[person.status] }}>
                            <User size={14} />
                        </div>
                        <div className="personnel-info">
                            <div className="personnel-name">{person.name}</div>
                            <div className="personnel-rank">{person.rank}</div>
                        </div>
                        <div className="personnel-status">
                            <div className="status-dot-small" style={{ backgroundColor: STATUS_COLORS[person.status] }} />
                            <span style={{ color: STATUS_COLORS[person.status], fontSize: '0.6rem' }}>{person.status}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
