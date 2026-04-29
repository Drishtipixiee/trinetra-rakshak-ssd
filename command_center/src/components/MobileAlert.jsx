import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCheck, X, Phone, MapPin, Clock, Send, FileText, MessageCircle, Wifi, Battery, Signal } from 'lucide-react';

const SMS_TEMPLATES = [
    { from: 'TRINETRA AI', body: (cls, risk, sector) => `CRITICAL ALERT\n${cls} detected at ${sector}.\nRisk Score: ${risk}%\nQRF Alpha dispatched -- ETA 4 min.\nRespond ASAP.` },
    { from: 'SEC-7 OPS CENTER', body: (cls, risk, sector) => `Intel update: ${cls} confirmed at ${sector} via multi-sensor fusion.\nThreat level ELEVATED.\nAll units maintain heightened readiness.\nCO notified.` },
    { from: 'BSF REGIONAL CMD', body: (cls, risk, sector) => `Flash msg from ${sector}: ${cls} breach confirmed.\nRisk: ${risk}%. CCTV footage secured.\nForce deployment authorized.\nAck required.` },
];

const WHATSAPP_TEMPLATES = [
    { from: 'Cmd. Sharma', body: (cls, risk) => `Threat ${cls} flagged by AI -- risk ${risk}%. I am monitoring from HQ. Keep me updated on ground situation.` },
    { from: 'Lt. Col. Verma', body: (cls, risk) => `Received your alert. ${cls} at ${risk}% is concerning. I have alerted the QRF. Share live feed when possible.` },
    { from: 'Control Room', body: (cls, risk) => `FLASH: ${cls} (${risk}%) logged in national database. Forwarding to NIC for cross-reference. Stand by for orders.` },
];

export default function MobileAlert({ threatLevel, riskScore, threatClass, sector = 'SEC-7A' }) {
    const [alerts, setAlerts] = useState([]);
    const [lastTrigger, setLastTrigger] = useState(0);
    const [smsIdx, setSmsIdx] = useState(0);
    const [waIdx, setWaIdx] = useState(0);
    const [showReport, setShowReport] = useState(false);

    useEffect(() => {
        if (threatLevel === 'CRITICAL' && Date.now() - lastTrigger > 5000) {
            setLastTrigger(Date.now());

            // Alternate between SMS and WhatsApp
            const isWhatsApp = smsIdx % 2 === 1;
            const template = isWhatsApp
                ? WHATSAPP_TEMPLATES[waIdx % WHATSAPP_TEMPLATES.length]
                : SMS_TEMPLATES[smsIdx % SMS_TEMPLATES.length];

            if (isWhatsApp) setWaIdx(p => p + 1);
            else setSmsIdx(p => p + 1);

            const newAlert = {
                id: Date.now(),
                time: new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }),
                message: template.body(threatClass || 'Hostile', riskScore, sector),
                status: 'sent',
                from: template.from,
                type: isWhatsApp ? 'whatsapp' : 'sms',
            };
            setAlerts(prev => [...prev.slice(-2), newAlert]);

            // Delivery simulation
            setTimeout(() => setAlerts(prev => prev.map(a => a.id === newAlert.id ? { ...a, status: 'delivered' } : a)), 800);
            setTimeout(() => setAlerts(prev => prev.map(a => a.id === newAlert.id ? { ...a, status: 'read' } : a)), 2500);
            // Auto dismiss
            setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== newAlert.id)), 14000);

            // Show report button after 2nd alert
            if (smsIdx + waIdx >= 1) setShowReport(true);
        }
    }, [threatLevel, riskScore, threatClass, sector, lastTrigger, smsIdx, waIdx]);

    const dismiss = (id) => setAlerts(prev => prev.filter(a => a.id !== id));

    const generateReport = () => {
        // Create a tactical report in a new window
        const timestamp = new Date().toISOString();
        const reportHTML = `
            <html><head><title>TRINETRA RAKSHAK -- Incident Report</title>
            <style>
                body { background: #0a0a0a; color: #e0e0e0; font-family: 'Courier New', monospace; padding: 40px; }
                h1 { color: #22c55e; border-bottom: 2px solid #22c55e; padding-bottom: 10px; }
                h2 { color: #f59e0b; margin-top: 30px; }
                .field { margin: 8px 0; } .label { color: #888; } .val { color: #fff; font-weight: bold; }
                .critical { color: #ef4444; font-weight: bold; font-size: 1.2em; }
                table { border-collapse: collapse; width: 100%; margin: 15px 0; }
                td, th { border: 1px solid #333; padding: 8px 12px; text-align: left; }
                th { background: #1a1a1a; color: #22c55e; }
                .footer { margin-top: 40px; border-top: 1px solid #333; padding-top: 15px; color: #555; font-size: 0.8em; }
            </style></head><body>
            <h1>INCIDENT REPORT -- CLASSIFIED</h1>
            <div class="field"><span class="label">Report ID:</span> <span class="val">TR-${Date.now().toString(36).toUpperCase()}</span></div>
            <div class="field"><span class="label">Generated:</span> <span class="val">${timestamp}</span></div>
            <div class="field"><span class="label">Classification:</span> <span class="critical">CRITICAL -- RESTRICTED</span></div>

            <h2>Threat Summary</h2>
            <table>
                <tr><th>Parameter</th><th>Value</th></tr>
                <tr><td>Threat Class</td><td>${threatClass || 'Hostile Personnel'}</td></tr>
                <tr><td>Risk Score</td><td class="critical">${riskScore}%</td></tr>
                <tr><td>Sector</td><td>${sector}</td></tr>
                <tr><td>Threat Level</td><td class="critical">${threatLevel}</td></tr>
                <tr><td>Detection Source</td><td>AI Fuzzy Logic Engine (scikit-fuzzy)</td></tr>
                <tr><td>Confidence</td><td>${Math.floor(85 + Math.random() * 14)}%</td></tr>
            </table>

            <h2>Response Actions Taken</h2>
            <table>
                <tr><th>Action</th><th>Status</th><th>Time</th></tr>
                <tr><td>Telegram Alert Dispatched</td><td style="color:#22c55e">SENT</td><td>${timestamp.slice(11,19)} UTC</td></tr>
                <tr><td>SMS Alert to CO</td><td style="color:#22c55e">DELIVERED</td><td>${timestamp.slice(11,19)} UTC</td></tr>
                <tr><td>WhatsApp Notification</td><td style="color:#22c55e">READ</td><td>${timestamp.slice(11,19)} UTC</td></tr>
                <tr><td>QRF Team Alpha Scrambled</td><td style="color:#f59e0b">IN PROGRESS</td><td>ETA 4 min</td></tr>
                <tr><td>CCTV Recording Secured</td><td style="color:#22c55e">ARCHIVED</td><td>${timestamp.slice(11,19)} UTC</td></tr>
                <tr><td>Supabase Threat Log</td><td style="color:#22c55e">LOGGED</td><td>${timestamp.slice(11,19)} UTC</td></tr>
            </table>

            <h2>AI Analysis</h2>
            <p>The Trinetra Rakshak AI Fuzzy Logic Engine detected a <strong>${threatClass || 'hostile'}</strong> target at <strong>${sector}</strong> with a risk score of <strong>${riskScore}%</strong>. The velocity-proximity-visibility matrix indicates hostile intent. Multi-channel alert dispatch was triggered across Telegram, SMS, and WhatsApp. Quick Reaction Force has been mobilized.</p>

            <div class="footer">
                <div>TRINETRA RAKSHAK -- Ministry of Defence, India</div>
                <div>This report is auto-generated by the AI surveillance system. Handle as RESTRICTED.</div>
            </div>
            </body></html>
        `;
        const blob = new Blob([reportHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    };

    if (alerts.length === 0 && !showReport) return null;

    return (
        <div className="mobile-alert-container">
            <AnimatePresence>
                {alerts.map(alert => (
                    <motion.div
                        key={alert.id}
                        className="mobile-phone"
                        initial={{ opacity: 0, y: 60, scale: 0.8 }}
                        animate={{
                            opacity: 1, y: 0, scale: 1,
                            x: [0, -3, 3, -2, 2, 0],
                        }}
                        exit={{ opacity: 0, y: 40, scale: 0.8 }}
                        transition={{
                            type: 'spring', stiffness: 300, damping: 20,
                            x: { duration: 0.5, ease: 'easeInOut' }
                        }}
                    >
                        <div className="phone-notch" />

                        <div className="phone-statusbar">
                            <span>{alert.time} IST</span>
                            <div className="phone-icons" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <Signal size={9} style={{ opacity: 0.5 }} />
                                <Wifi size={9} style={{ opacity: 0.5 }} />
                                <Battery size={9} style={{ opacity: 0.5 }} />
                                <span style={{ fontSize: '0.5rem', opacity: 0.4 }}>92%</span>
                            </div>
                        </div>

                        <div className="phone-notification" style={
                            alert.type === 'whatsapp'
                                ? { background: 'rgba(37,211,102,0.06)', borderLeft: '3px solid #25D366' }
                                : { borderLeft: '3px solid #ef4444' }
                        }>
                            <div className="phone-notif-header">
                                <div className="phone-notif-icon" style={
                                    alert.type === 'whatsapp'
                                        ? { background: 'rgba(37,211,102,0.15)', borderRadius: '50%' }
                                        : { background: 'rgba(239,68,68,0.15)', borderRadius: '50%' }
                                }>
                                    {alert.type === 'whatsapp'
                                        ? <MessageCircle size={14} style={{ color: '#25D366' }} />
                                        : <Shield size={14} />
                                    }
                                </div>
                                <div>
                                    <div className="phone-notif-from" style={{
                                        color: alert.type === 'whatsapp' ? '#25D366' : 'rgba(255,255,255,0.85)'
                                    }}>
                                        {alert.from}
                                    </div>
                                    <div style={{
                                        fontSize: '0.48rem', color: 'rgba(255,255,255,0.3)',
                                        display: 'flex', alignItems: 'center', gap: 3
                                    }}>
                                        {alert.type === 'whatsapp' ? 'WhatsApp' : 'SMS'} <MapPin size={7} /> {sector}
                                    </div>
                                </div>
                                <button className="phone-close" onClick={() => dismiss(alert.id)}><X size={12} /></button>
                            </div>

                            <div className="phone-notif-body" style={{ whiteSpace: 'pre-line', fontSize: '0.62rem', lineHeight: 1.5 }}>
                                {alert.message}
                            </div>

                            <div className="phone-notif-footer">
                                <div className="phone-receipt">
                                    <CheckCheck size={12} style={{
                                        color: alert.status === 'read' ? '#53bdeb'
                                            : alert.status === 'delivered' ? 'rgba(255,255,255,0.4)'
                                            : 'rgba(255,255,255,0.2)'
                                    }} />
                                    <span style={{
                                        color: alert.status === 'read' ? '#53bdeb' : 'rgba(255,255,255,0.4)',
                                        fontSize: '0.5rem'
                                    }}>
                                        {alert.status === 'read' ? 'Read' : alert.status === 'delivered' ? 'Delivered' : 'Sending...'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Clock size={9} style={{ color: 'rgba(255,255,255,0.3)' }} />
                                    <span className="phone-notif-time">{alert.time}</span>
                                </div>
                            </div>
                        </div>

                        {/* Report generation button */}
                        <div style={{ padding: '4px 6px', display: 'flex', gap: 4 }}>
                            <div className="phone-reply-input" style={{
                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                cursor: 'pointer', transition: 'all 0.2s'
                            }} onClick={generateReport}>
                                <FileText size={10} style={{ color: '#22c55e' }} />
                                <span style={{ color: '#22c55e', fontSize: '0.5rem' }}>GENERATE INCIDENT REPORT</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
