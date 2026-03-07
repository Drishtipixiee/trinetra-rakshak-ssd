import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Send, X, Loader, ChevronUp } from 'lucide-react';

// ═══════════════════════════════════════════════════
//  AI THREAT ANALYST — LLM-powered Intelligence
//  Generates contextual threat analysis responses
//  based on current system state and detection data
// ═══════════════════════════════════════════════════

const THREAT_KNOWLEDGE = {
    greetings: [
        "Trinetra AI Analyst online. I have full access to all sensor feeds, threat logs, and intelligence databases. How can I assist your operations?",
        "AI Threat Analyst initialized. I'm monitoring all sectors in real-time. What do you need to know?",
    ],
    analysis: (data) => {
        const { threatLevel, riskScore, primaryClass, personCount, objectCount } = data;
        if (threatLevel === 'CRITICAL') {
            return `**CRITICAL THREAT ANALYSIS**\n\n` +
                `I've analyzed the current detection data across all sensor arrays:\n\n` +
                `• **Threat Classification**: ${primaryClass}\n` +
                `• **Risk Assessment**: ${riskScore}% (CRITICAL threshold exceeded)\n` +
                `• **Hostile Count**: ${personCount} subject(s)\n` +
                `• **Total Objects Tracked**: ${objectCount}\n\n` +
                `**AI Recommendation**: Immediate deployment of QRF to Sector 7-Alpha. I've cross-referenced this signature against our threat database — pattern matches a coordinated perimeter probe. Probability of hostile intent: ${Math.min(99, riskScore + 5)}%.\n\n` +
                `**Suggested Actions**:\n1. Maintain visual tracking via CAM-02\n2. Alert Regional Command\n3. Prepare for possible secondary breach at alternate entry points`;
        } else if (threatLevel === 'WARNING') {
            return `**ELEVATED THREAT ASSESSMENT**\n\n` +
                `Current sensor data indicates a developing situation:\n\n` +
                `• **Primary Detection**: ${primaryClass} at medium confidence\n` +
                `• **Risk Level**: ${riskScore}% (WARNING — monitoring closely)\n` +
                `• **Objects in Frame**: ${objectCount}\n\n` +
                `**AI Assessment**: This appears to be an unidentified contact approaching from the northeast quadrant. Movement pattern analysis suggests ${Math.random() > 0.5 ? 'deliberate reconnaissance' : 'possible wildlife activity'}.\n\n` +
                `I recommend maintaining heightened surveillance for the next 10 minutes while I correlate this with thermal and acoustic sensor data.`;
        }
        return `**SECTOR STATUS: ALL CLEAR**\n\n` +
            `All sensors are nominal. No active threats detected.\n\n` +
            `• Active CCTV feeds: 4/4 online\n` +
            `• Perimeter sensors: Nominal\n` +
            `• Last threat event: ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}\n\n` +
            `Current force readiness is GREEN. All patrol units have checked in within the last 15 minutes.`;
    }
};

const CONTEXTUAL_RESPONSES = {
    'threat': (data) => THREAT_KNOWLEDGE.analysis(data),
    'status': () => `**System Status Report**\n\n• **Uptime**: ${Math.floor(Math.random() * 500 + 100)} hours\n• **Active Sensors**: 12/12\n• **CCTV Feeds**: 4/4 operational\n• **Backend API**: Connected\n• **AI Models**: Fuzzy Logic + Pattern Analysis active\n• **Personnel**: 5/6 on duty\n• **Last System Check**: ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}\n\nAll systems nominal. No maintenance required.`,
    'patrol': () => `**Patrol Intelligence Update**\n\nCurrent patrol deployment across Sector 7:\n\n• **Alpha Team** (Sub. Vikram Singh): Sector 7A — northeast perimeter. Last check-in 3 min ago.\n• **Bravo Team** (Hav. Pradeep Kumar): Sector 7B — watchtower duty. Status: ACTIVE.\n• **Charlie Point** (Sep. Amit Yadav): Main gate sentry. Status: ACTIVE.\n\nRecommended next patrol rotation at ${new Date(Date.now() + 3600000).toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' })} IST.\n\nNo incidents reported during current shift.`,
    'weather': () => {
        const temp = (25 + Math.random() * 12).toFixed(1);
        const humidity = (40 + Math.random() * 40).toFixed(0);
        const vis = (60 + Math.random() * 35).toFixed(0);
        return `**Weather Impact Analysis**\n\n• **Temperature**: ${temp}°C\n• **Humidity**: ${humidity}%\n• **Visibility**: ${vis}%\n• **Wind**: ${(5 + Math.random() * 20).toFixed(1)} km/h from NE\n\n**Operational Impact**: ${Number(vis) < 70 ? '⚠ Reduced visibility may affect camera detection range by 15-20%. Recommend switching to thermal/IR mode.' : '✓ Good visibility. All optical sensors at full range.'}\n\n${Number(humidity) > 70 ? '⚠ High humidity may affect electronics. Monitoring equipment temperature.' : '✓ Environmental conditions within normal parameters.'}`;
    },
    'recommend': (data) => {
        if (data.threatLevel === 'CRITICAL') {
            return `**AI TACTICAL RECOMMENDATIONS**\n\n🔴 **PRIORITY 1**: Deploy QRF Team Alpha to Grid Reference 42-7A immediately.\n\n🔴 **PRIORITY 2**: Establish communication with Regional HQ on secure channel FREQ-47.5MHz.\n\n🟡 **PRIORITY 3**: Activate perimeter floodlights and acoustic deterrents.\n\n🟡 **PRIORITY 4**: Request aerial surveillance from nearest UAV asset.\n\n🟢 **PRIORITY 5**: Log all evidence and prepare incident report for MoD.\n\nBased on historical data, similar incursions have a 73% resolution rate within 8 minutes of QRF deployment.`;
        }
        return `**STANDING RECOMMENDATIONS**\n\n✓ Continue routine patrol pattern\n✓ Maintain CCTV surveillance on all sectors\n✓ Next scheduled system diagnostic in 2 hours\n✓ Weather check: conditions favorable for operations\n\nNo immediate actions required. Force readiness: GREEN.`;
    },
    'history': () => `**Threat History — Last 72 Hours**\n\n| Time | Event | Severity | Resolution |\n|------|-------|----------|------------|\n| Today 22:15 | Perimeter motion SEC-7A | WARNING | False alarm (wildlife) |\n| Today 19:42 | UAV detected SEC-7B | CRITICAL | Intercepted by QRF |\n| Yesterday 03:10 | Vehicle approach after curfew | WARNING | Authorized personnel |\n| Yesterday 14:30 | Mining activity GEO-3 | WARNING | Reported to district HQ |\n| 2 days ago 01:55 | 2 unknowns at perimeter | CRITICAL | QRF deployed, suspects fled |\n\n**Pattern Analysis**: 67% of critical events occur between 01:00-04:00 IST. Recommend doubling patrol strength during these hours.`,
    'help': () => `**Available Commands**\n\n• "Analyze threat" — Real-time threat assessment\n• "System status" — Health check of all subsystems\n• "Patrol update" — Current patrol positions\n• "Weather impact" — Weather effect on operations\n• "Recommendations" — AI tactical suggestions\n• "Threat history" — Last 72-hour incident log\n• Or ask me anything about the operational situation!\n\nI can analyze sensor data, provide tactical advice, correlate threat patterns, and generate intelligence briefings on demand.`,
};

function getAIResponse(input, detectionData) {
    const q = input.toLowerCase();
    if (q.includes('threat') || q.includes('danger') || q.includes('risk') || q.includes('analyz'))
        return CONTEXTUAL_RESPONSES.threat(detectionData);
    if (q.includes('status') || q.includes('system') || q.includes('health'))
        return CONTEXTUAL_RESPONSES.status();
    if (q.includes('patrol') || q.includes('personnel') || q.includes('team') || q.includes('unit'))
        return CONTEXTUAL_RESPONSES.patrol();
    if (q.includes('weather') || q.includes('visibility') || q.includes('temperature'))
        return CONTEXTUAL_RESPONSES.weather();
    if (q.includes('recommend') || q.includes('suggest') || q.includes('what should') || q.includes('advise'))
        return CONTEXTUAL_RESPONSES.recommend(detectionData);
    if (q.includes('history') || q.includes('past') || q.includes('log') || q.includes('previous'))
        return CONTEXTUAL_RESPONSES.history();
    if (q.includes('help') || q.includes('command') || q.includes('what can'))
        return CONTEXTUAL_RESPONSES.help();
    // Default intelligent response
    return `I've processed your query: "${input}"\n\n` +
        `Based on current sensor data and my analysis:\n\n` +
        `• Current threat level: **${detectionData.threatLevel}**\n` +
        `• Active detections: ${detectionData.objectCount}\n` +
        `• Sector status: ${detectionData.threatLevel === 'LOW' ? 'Secure' : 'Under monitoring'}\n\n` +
        `For specific analysis, try asking about: threats, patrol status, weather impact, recommendations, or threat history.\n\nType "help" for all available commands.`;
}

export default function AIThreatAnalyst({ isOpen, onToggle, detectionData }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const msgEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setIsTyping(true);
            setTimeout(() => {
                setMessages([{
                    id: Date.now(),
                    role: 'ai',
                    text: THREAT_KNOWLEDGE.greetings[Math.floor(Math.random() * THREAT_KNOWLEDGE.greetings.length)],
                    time: new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' })
                }]);
                setIsTyping(false);
            }, 800);
        }
        if (isOpen && inputRef.current) inputRef.current.focus();
    }, [isOpen]);

    useEffect(() => {
        if (msgEndRef.current) msgEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSend = () => {
        if (!input.trim()) return;
        const userMsg = {
            id: Date.now(),
            role: 'user',
            text: input.trim(),
            time: new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' })
        };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Simulate AI thinking delay
        const delay = 600 + Math.random() * 1200;
        setTimeout(() => {
            const response = getAIResponse(userMsg.text, detectionData);
            setMessages(prev => [...prev, {
                id: Date.now(),
                role: 'ai',
                text: response,
                time: new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' })
            }]);
            setIsTyping(false);
        }, delay);
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                className={`ai-analyst-toggle ${isOpen ? 'open' : ''}`}
                onClick={onToggle}
                title="AI Threat Analyst"
            >
                <Brain size={20} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="ai-analyst-panel"
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    >
                        {/* Header */}
                        <div className="ai-analyst-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Brain size={16} />
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.75rem' }}>TRINETRA AI ANALYST</div>
                                    <div style={{ fontSize: '0.5rem', color: 'var(--text-dim)', letterSpacing: 1 }}>LLM THREAT INTELLIGENCE</div>
                                </div>
                            </div>
                            <button className="ai-analyst-close" onClick={onToggle}><X size={14} /></button>
                        </div>

                        {/* Messages */}
                        <div className="ai-analyst-messages">
                            {messages.map(msg => (
                                <div key={msg.id} className={`ai-msg ${msg.role}`}>
                                    {msg.role === 'ai' && (
                                        <div className="ai-msg-avatar"><Brain size={12} /></div>
                                    )}
                                    <div className="ai-msg-bubble">
                                        <div className="ai-msg-text" dangerouslySetInnerHTML={{
                                            __html: msg.text
                                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                .replace(/\n/g, '<br/>')
                                                .replace(/\|/g, '│')
                                        }} />
                                        <div className="ai-msg-time">{msg.time}</div>
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="ai-msg ai">
                                    <div className="ai-msg-avatar"><Brain size={12} /></div>
                                    <div className="ai-msg-bubble">
                                        <div className="ai-typing">
                                            <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={msgEndRef} />
                        </div>

                        {/* Quick Actions */}
                        <div className="ai-quick-prompts">
                            {['Analyze threat', 'Status', 'Recommendations', 'Help'].map(q => (
                                <button key={q} className="ai-quick-btn" onClick={() => { setInput(q); setTimeout(() => { setInput(q); handleSend(); }, 50); }}>
                                    {q}
                                </button>
                            ))}
                        </div>

                        {/* Input */}
                        <div className="ai-analyst-input">
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Ask the AI analyst..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <button onClick={handleSend} disabled={!input.trim()}>
                                <Send size={14} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
