import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCheck, X, Phone, MapPin, Clock, Send, FileText, MessageCircle, Wifi, Battery, Signal, Mail, Download, Share2 } from 'lucide-react';

// ---- Config: default recipients (can be overridden via VITE_ env vars) ----
const ALERT_PHONE = import.meta.env.VITE_ALERT_PHONE || '919156610416';
const ALERT_EMAIL = import.meta.env.VITE_ALERT_EMAIL || 'drishtimishra168@gmail.com';

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

// ---- Report Generator ----
function buildReportText(threatClass, riskScore, threatLevel, sector) {
    const ts = new Date().toISOString();
    const reportId = `TR-${Date.now().toString(36).toUpperCase()}`;
    const conf = Math.floor(85 + Math.random() * 14);
    return [
        `===== TRINETRA RAKSHAK -- INCIDENT REPORT =====`,
        `Report ID: ${reportId}`,
        `Generated: ${ts}`,
        `Classification: CRITICAL -- RESTRICTED`,
        ``,
        `--- THREAT SUMMARY ---`,
        `Threat Class: ${threatClass || 'Hostile Personnel'}`,
        `Risk Score: ${riskScore}%`,
        `Sector: ${sector}`,
        `Threat Level: ${threatLevel}`,
        `Detection Source: AI Fuzzy Logic Engine`,
        `Confidence: ${conf}%`,
        ``,
        `--- RESPONSE ACTIONS ---`,
        `[SENT] Telegram Alert Dispatched`,
        `[DELIVERED] SMS Alert to Commanding Officer`,
        `[READ] WhatsApp Notification`,
        `[IN PROGRESS] QRF Team Alpha Scrambled -- ETA 4 min`,
        `[ARCHIVED] CCTV Recording Secured`,
        `[LOGGED] Supabase Threat Log`,
        ``,
        `--- AI ANALYSIS ---`,
        `The Trinetra Rakshak AI detected a ${threatClass || 'hostile'} target at ${sector} with risk score ${riskScore}%.`,
        `Velocity-proximity-visibility matrix indicates hostile intent.`,
        `Multi-channel alert dispatch triggered across Telegram, SMS, and WhatsApp.`,
        `Quick Reaction Force has been mobilized.`,
        ``,
        `--- TRINETRA RAKSHAK | Ministry of Defence, India ---`,
        `This report is auto-generated. Handle as RESTRICTED.`,
    ].join('\n');
}

function buildReportHTML(threatClass, riskScore, threatLevel, sector) {
    const ts = new Date().toISOString();
    const reportId = `TR-${Date.now().toString(36).toUpperCase()}`;
    const conf = Math.floor(85 + Math.random() * 14);
    return `<html><head><title>TRINETRA RAKSHAK -- Incident Report</title>
    <style>
        body { background:#0a0a0a; color:#e0e0e0; font-family:'Courier New',monospace; padding:40px; }
        h1 { color:#22c55e; border-bottom:2px solid #22c55e; padding-bottom:10px; }
        h2 { color:#f59e0b; margin-top:30px; }
        .critical { color:#ef4444; font-weight:bold; font-size:1.2em; }
        table { border-collapse:collapse; width:100%; margin:15px 0; }
        td,th { border:1px solid #333; padding:8px 12px; text-align:left; }
        th { background:#1a1a1a; color:#22c55e; }
        .footer { margin-top:40px; border-top:1px solid #333; padding-top:15px; color:#555; font-size:0.8em; }
    </style></head><body>
    <h1>INCIDENT REPORT -- CLASSIFIED</h1>
    <p><b>Report ID:</b> ${reportId} | <b>Generated:</b> ${ts}</p>
    <p><b>Classification:</b> <span class="critical">CRITICAL -- RESTRICTED</span></p>
    <h2>Threat Summary</h2>
    <table>
        <tr><th>Parameter</th><th>Value</th></tr>
        <tr><td>Threat Class</td><td>${threatClass || 'Hostile Personnel'}</td></tr>
        <tr><td>Risk Score</td><td class="critical">${riskScore}%</td></tr>
        <tr><td>Sector</td><td>${sector}</td></tr>
        <tr><td>Threat Level</td><td class="critical">${threatLevel}</td></tr>
        <tr><td>Detection Source</td><td>AI Fuzzy Logic Engine (scikit-fuzzy)</td></tr>
        <tr><td>Confidence</td><td>${conf}%</td></tr>
    </table>
    <h2>Response Actions</h2>
    <table>
        <tr><th>Action</th><th>Status</th><th>Time</th></tr>
        <tr><td>Telegram Alert</td><td style="color:#22c55e">SENT</td><td>${ts.slice(11,19)} UTC</td></tr>
        <tr><td>SMS Alert to CO</td><td style="color:#22c55e">DELIVERED</td><td>${ts.slice(11,19)} UTC</td></tr>
        <tr><td>WhatsApp Notification</td><td style="color:#22c55e">READ</td><td>${ts.slice(11,19)} UTC</td></tr>
        <tr><td>QRF Team Alpha</td><td style="color:#f59e0b">SCRAMBLED</td><td>ETA 4 min</td></tr>
        <tr><td>CCTV Recording</td><td style="color:#22c55e">ARCHIVED</td><td>${ts.slice(11,19)} UTC</td></tr>
        <tr><td>Supabase Log</td><td style="color:#22c55e">LOGGED</td><td>${ts.slice(11,19)} UTC</td></tr>
    </table>
    <h2>AI Analysis</h2>
    <p>The Trinetra Rakshak AI detected a <b>${threatClass || 'hostile'}</b> target at <b>${sector}</b> with risk score <b>${riskScore}%</b>. Velocity-proximity-visibility matrix indicates hostile intent. Multi-channel alert dispatch triggered. QRF mobilized.</p>
    <div class="footer">TRINETRA RAKSHAK | Ministry of Defence, India<br/>Auto-generated. Handle as RESTRICTED.</div>
    </body></html>`;
}

// ---- Share Functions ----
function sendViaWhatsApp(text) {
    const encoded = encodeURIComponent(text);
    const url = `https://api.whatsapp.com/send?phone=${ALERT_PHONE}&text=${encoded}`;
    window.open(url, '_blank');
}

function sendViaEmail(subject, text) {
    const body = encodeURIComponent(text);
    const subj = encodeURIComponent(subject);
    window.open(`mailto:${ALERT_EMAIL}?subject=${subj}&body=${body}`, '_blank');
}

function downloadReport(html) {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trinetra_incident_report_${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
}

async function shareNative(text) {
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'TRINETRA RAKSHAK -- Incident Report',
                text: text,
            });
            return true;
        } catch { return false; }
    }
    return false;
}

// Also try sending via backend email API
async function sendViaBackendEmail(text, riskScore, threatClass, sector) {
    const API_URL = import.meta.env.PROD
        ? 'https://backend-ten-fawn-25.vercel.app'
        : 'http://127.0.0.1:5000';
    try {
        const res = await fetch(`${API_URL}/api/report/email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: ALERT_EMAIL,
                subject: `[TRINETRA] CRITICAL Incident -- ${threatClass || 'Hostile'} at ${sector} (${riskScore}%)`,
                body: text,
            }),
        });
        if (res.ok) return true;
    } catch { /* API may not support this yet */ }
    return false;
}


export default function MobileAlert({ threatLevel, riskScore, threatClass, sector = 'SEC-7A' }) {
    const [alerts, setAlerts] = useState([]);
    const [lastTrigger, setLastTrigger] = useState(0);
    const [smsIdx, setSmsIdx] = useState(0);
    const [waIdx, setWaIdx] = useState(0);
    const [showShareMenu, setShowShareMenu] = useState(null); // alert id
    const [sendStatus, setSendStatus] = useState('');

    useEffect(() => {
        if (threatLevel === 'CRITICAL' && Date.now() - lastTrigger > 5000) {
            setLastTrigger(Date.now());

            const isWhatsApp = smsIdx % 2 === 1;
            const template = isWhatsApp
                ? WHATSAPP_TEMPLATES[waIdx % WHATSAPP_TEMPLATES.length]
                : SMS_TEMPLATES[smsIdx % SMS_TEMPLATES.length];

            if (isWhatsApp) setWaIdx(p => p + 1);
            setSmsIdx(p => p + 1);

            const newAlert = {
                id: Date.now(),
                time: new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }),
                message: template.body(threatClass || 'Hostile', riskScore, sector),
                status: 'sent',
                from: template.from,
                type: isWhatsApp ? 'whatsapp' : 'sms',
            };
            setAlerts(prev => [...prev.slice(-2), newAlert]);

            setTimeout(() => setAlerts(prev => prev.map(a => a.id === newAlert.id ? { ...a, status: 'delivered' } : a)), 800);
            setTimeout(() => setAlerts(prev => prev.map(a => a.id === newAlert.id ? { ...a, status: 'read' } : a)), 2500);
            setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== newAlert.id)), 16000);

            // Auto-attempt backend email on first CRITICAL alert
            if (smsIdx === 0) {
                const reportText = buildReportText(threatClass, riskScore, threatLevel, sector);
                sendViaBackendEmail(reportText, riskScore, threatClass, sector);
            }
        }
    }, [threatLevel, riskScore, threatClass, sector, lastTrigger, smsIdx, waIdx]);

    const dismiss = (id) => setAlerts(prev => prev.filter(a => a.id !== id));

    const handleSendReport = async (method) => {
        const reportText = buildReportText(threatClass, riskScore, threatLevel, sector);
        const reportHTML = buildReportHTML(threatClass, riskScore, threatLevel, sector);
        const subject = `[TRINETRA] CRITICAL Incident -- ${threatClass || 'Hostile'} at ${sector} (${riskScore}%)`;

        setSendStatus('Sending...');

        switch (method) {
            case 'whatsapp':
                sendViaWhatsApp(reportText);
                setSendStatus('WhatsApp opened');
                break;
            case 'email':
                sendViaEmail(subject, reportText);
                // Also try backend email
                sendViaBackendEmail(reportText, riskScore, threatClass, sector);
                setSendStatus('Email opened');
                break;
            case 'download':
                downloadReport(reportHTML);
                setSendStatus('Downloaded');
                break;
            case 'share':
                const shared = await shareNative(reportText);
                setSendStatus(shared ? 'Shared' : 'Share unavailable');
                break;
            default:
                // Open the HTML report
                const blob = new Blob([reportHTML], { type: 'text/html' });
                window.open(URL.createObjectURL(blob), '_blank');
                setSendStatus('Opened');
        }

        setTimeout(() => setSendStatus(''), 3000);
        setShowShareMenu(null);
    };

    if (alerts.length === 0) return null;

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

                        {/* ---- SEND REPORT ACTIONS ---- */}
                        <div style={{ padding: '4px 6px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {/* Main action buttons row */}
                            <div style={{ display: 'flex', gap: 3 }}>
                                <button
                                    onClick={() => handleSendReport('whatsapp')}
                                    style={{
                                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                        background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)',
                                        borderRadius: 6, padding: '5px 4px', cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    title="Send incident report via WhatsApp"
                                >
                                    <MessageCircle size={10} style={{ color: '#25D366' }} />
                                    <span style={{ color: '#25D366', fontSize: '0.45rem', fontFamily: "'Share Tech Mono'", letterSpacing: 0.5 }}>WHATSAPP</span>
                                </button>

                                <button
                                    onClick={() => handleSendReport('email')}
                                    style={{
                                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                        background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
                                        borderRadius: 6, padding: '5px 4px', cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    title="Send incident report via Email"
                                >
                                    <Mail size={10} style={{ color: '#3b82f6' }} />
                                    <span style={{ color: '#3b82f6', fontSize: '0.45rem', fontFamily: "'Share Tech Mono'", letterSpacing: 0.5 }}>EMAIL</span>
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: 3 }}>
                                <button
                                    onClick={() => handleSendReport('download')}
                                    style={{
                                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                        background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)',
                                        borderRadius: 6, padding: '5px 4px', cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    title="Download incident report as HTML file"
                                >
                                    <Download size={10} style={{ color: '#a855f7' }} />
                                    <span style={{ color: '#a855f7', fontSize: '0.45rem', fontFamily: "'Share Tech Mono'", letterSpacing: 0.5 }}>DOWNLOAD</span>
                                </button>

                                <button
                                    onClick={() => handleSendReport('default')}
                                    style={{
                                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                        background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
                                        borderRadius: 6, padding: '5px 4px', cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    title="Open full incident report in new tab"
                                >
                                    <FileText size={10} style={{ color: '#22c55e' }} />
                                    <span style={{ color: '#22c55e', fontSize: '0.45rem', fontFamily: "'Share Tech Mono'", letterSpacing: 0.5 }}>VIEW REPORT</span>
                                </button>
                            </div>

                            {/* Status indicator */}
                            {sendStatus && (
                                <div style={{
                                    textAlign: 'center', fontSize: '0.45rem', color: '#22c55e',
                                    fontFamily: "'Share Tech Mono'", padding: '2px 0',
                                    animation: 'fadeIn 0.3s ease'
                                }}>
                                    {sendStatus}
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
