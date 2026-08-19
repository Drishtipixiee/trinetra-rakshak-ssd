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
    'status': () => `**System Status Report**\n\n• **Uptime**: ${Math.floor(Math.random() * 500 + 100)} hours\n• **Active Sensors**: 12/12\n• **CCTV Feeds**: 4/4 operational\n• **Backend API**: Connected (Vercel Serverless)\n• **AI Models**: Fuzzy Logic + Pattern Analysis active\n• **Personnel**: 5/6 on duty\n• **Last System Check**: ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}\n\nAll systems nominal. No maintenance required.`,
    'patrol': () => `**Patrol Intelligence Update**\n\nCurrent patrol deployment across Sector 7:\n\n• **Alpha Team** (Sub. Vikram Singh): Sector 7A — northeast perimeter. Last check-in 3 min ago.\n• **Bravo Team** (Hav. Pradeep Kumar): Sector 7B — watchtower duty. Status: ACTIVE.\n• **Charlie Point** (Sep. Amit Yadav): Main gate sentry. Status: ACTIVE.\n• **Delta Team** (NK. Suresh Rathore): Comms center. Monitoring FREQ-47.5MHz.\n\nRecommended next patrol rotation at ${new Date(Date.now() + 3600000).toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' })} IST.\n\nNo incidents reported during current shift.`,
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
    'help': () => `**Available Commands**\n\n• "Analyze threat" — Real-time threat assessment\n• "System status" — Health check of all subsystems\n• "Patrol update" — Current patrol positions\n• "Weather impact" — Weather effect on operations\n• "Recommendations" — AI tactical suggestions\n• "Threat history" — Last 72-hour incident log\n• "Border security" — India border protection overview\n• "Railway safety" — Track-Guard module details\n• "Mining detection" — GEO-EYE surveillance info\n• "How does this work?" — Project technology explanation\n• "CCTV cameras" — Camera feed status\n• "Fuzzy logic" — How risk scoring works\n• "Drone/UAV" — Aerial threat info\n• "India defense" — National security context\n\nOr ask me anything else — I'm a general-purpose intelligence AI!`,
    'border': () => `**Border Security — India Context**\n\nIndia shares **15,106.7 km of land borders** with 7 nations. Key challenges:\n\n🏔️ **Indo-Pakistan (LoC)**: 3,323 km — BSF patrols with smart fencing, thermal imaging. Trinetra augments with AI-based intrusion detection on camera feeds.\n\n🏔️ **Indo-China (LAC)**: 3,488 km — ITBP deployment. Difficult terrain makes AI surveillance critical for early warning.\n\n🌿 **Indo-Bangladesh**: 4,096 km — Cattle smuggling, illegal migration. Smart fencing + CCTV integrated with our detection engine.\n\n**How Trinetra Helps**: Our Border-Sentry module uses AI object detection on live camera feeds. When a person is detected within the restricted zone (ROI), the fuzzy logic engine calculates risk based on velocity, proximity, and visibility. If risk exceeds 70%, QRF is auto-alerted.\n\n**Real-world deployment**: Systems like BOLD-QIT (Border Electronically Dominated QRT Interception Technique) already use similar technology. Trinetra is our prototype for this.`,
    'railway': () => `**Railway Safety — Track-Guard Module**\n\nIndian Railways operates **67,956 km** of track — the 4th largest network in the world.\n\n🐘 **Problem**: ~150 elephant deaths annually on railway tracks. 100+ cattle collisions daily. Wildlife crossings are a major safety and ecological concern.\n\n🚂 **Track-Guard Solution**:\n1. AI cameras mounted on approach corridors detect wildlife/obstructions\n2. Confidence score calculated via pattern recognition\n3. If obstruction confirmed → auto-brake signal sent to approaching train\n4. Simultaneous alert to nearest railway control room\n\n**Simulation**: Our 60-second demo shows:\n• 0-15s: Clear track, monitoring\n• 15-35s: Wild elephant detected → WARNING → auto-brake transmitted\n• 35-60s: Track cleared, all clear\n\n**Technology**: Canvas-based detection rendering, Web Speech API voice alerts, real-time risk scoring.\n\nProject Nilgiri by Indian Railways already tests similar AI for elephant corridors near Coimbatore.`,
    'mining': () => `**Mining Surveillance — GEO-EYE Module**\n\nIllegal mining is a ₹1,00,000 Cr+ problem in India. Key affected states: Jharkhand, Odisha, Chhattisgarh, Rajasthan.\n\n⛏️ **Problem**: Unauthorized extraction of coal, iron ore, sand, and granite. Often linked to organized crime and environmental destruction.\n\n🛰️ **GEO-EYE Solution**:\n1. Satellite imagery comparison (before vs after)\n2. Pixel-level terrain change detection using image differencing\n3. Changes exceeding threshold → flagged as "suspected mining activity"\n4. GPS coordinates logged and forwarded to District Mining Officer\n\n**Our Approach**: React-Leaflet GIS map centered on Jharkhand mining corridor. Scan button triggers terrain analysis. Detected anomalies shown with risk circles on the map.\n\n**Real-world impact**: Satellite monitoring by ISRO (NRSC) and Mining Surveillance System (MSS) by Ministry of Mines already use similar satellite-based detection.`,
    'cctv': () => `**CCTV Surveillance Grid — Status**\n\n4 cameras deployed across Sector 7:\n\n📹 **CAM-01 — Main Gate** (28.6139°N, 77.2090°E)\nScenario: Vehicle approaching → person exits → access check\nStatus: ${Math.random() > 0.3 ? 'OPERATIONAL' : 'DETECTING'}\n\n📹 **CAM-02 — Perimeter Fence** (28.6145°N, 77.2095°E)\nScenario: 2 unknowns approaching → breach attempt → neutralized\nStatus: OPERATIONAL\n\n📹 **CAM-03 — Watchtower** (28.6150°N, 77.2085°E)\nScenario: Stray dog classified → UAV drone detected in airspace\nStatus: MONITORING\n\n📹 **CAM-04 — Bunker Area** (28.6135°N, 77.2080°E)\nScenario: Secure — no movement detected\nStatus: OPERATIONAL\n\nEach camera runs a 60-second simulated detection scenario with canvas-based bounding boxes, confidence bars, and tactical overlays.`,
    'fuzzy': () => `**Fuzzy Logic Risk Scoring Engine**\n\nOur AI reasoning engine uses **scikit-fuzzy** to compute risk scores from multiple sensor inputs:\n\n**Input Variables (Antecedents)**:\n• **Velocity** (0-100 km/h): Low / Medium / High\n• **Proximity** (0-500m): Near / Medium / Far\n• **Visibility** (0-100%): Low / Medium / High\n\n**Output Variable (Consequent)**:\n• **Risk Score** (0-100%): Safe / Warning / Critical\n\n**Rule Base** (9 rules):\n1. High speed + Near proximity → CRITICAL\n2. Low visibility + Near → CRITICAL (stealth factor)\n3. Medium speed + Near → WARNING\n4. High speed + Medium distance → WARNING\n5. Far proximity → always SAFE\n\n**XAI (Explainable AI)**: Every risk score comes with a human-readable explanation of WHY that score was assigned.\n\nExample: "CRITICAL: High-speed entity | critical proximity to Danger Zone | low-visibility conditions. Calculated Risk: 87.3%"`,
    'project': () => `**About Trinetra Rakshak**\n\n**Trinetra Rakshak** (त्रिनेत्र रक्षक — "Three-Eyed Guardian") is an AI-powered Integrated Command & Control Surveillance System.\n\n**Purpose**: A software-defined defense prototype that demonstrates how AI can enhance India's border security, railway safety, and mining surveillance — all from a single command center.\n\n**Key Technologies**:\n• **React 18 + Vite** — Modern frontend framework\n• **Flask + Python** — RESTful backend API\n• **scikit-fuzzy** — Fuzzy logic for risk scoring\n• **Web Speech API** — AI voice alerts in Indian English\n• **Web Crypto API** — SHA-256 + RSA-2048 authentication\n• **Canvas 2D** — Real-time detection rendering\n• **React Leaflet** — GIS mapping with satellite imagery\n\n**Architecture**: Frontend deployed on Vercel, Backend as serverless functions. Fully offline simulation engine — no external AI APIs needed.\n\n**Real-world analogy**: Modeled after BSF's BOLD-QIT, Indian Railways' Project Nilgiri, and ISRO's Mining Surveillance System.`,
    'drone': () => `**UAV/Drone Threat Analysis**\n\nDrone incursions are an emerging threat along India's borders, especially the Indo-Pakistan border in Punjab.\n\n**Recent Incidents**:\n• 2024: 250+ drone sightings along Punjab border\n• Used for: arms smuggling, narcotics, reconnaissance\n• BSF anti-drone measures: DRDO's counter-drone systems\n\n**Trinetra's Approach**:\n• CAM-03 (Watchtower) detects airborne objects via motion analysis\n• AI classifies: Bird vs UAV vs Aircraft\n• If UAV confirmed → CRITICAL alert + voice warning\n• Auto-logs GPS coordinates + flight path estimation\n\n**Planned Enhancement**: Integration with DRDO's anti-drone jamming systems for automated electronic countermeasures.`,
    'india_defense': () => `**India's Defense & Security Landscape**\n\n🇮🇳 India maintains the world's **2nd largest armed forces** (1.45M active personnel)\n\n**Key Security Challenges**:\n• Border intrusions (Pakistan, China, Bangladesh borders)\n• Cross-border terrorism and infiltration\n• Left-Wing Extremism (Naxal corridor)\n• Maritime security (7,516 km coastline)\n• Cyber warfare and drone threats\n\n**Smart Fencing Projects**:\n• **CIBMS** (Comprehensive Integrated Border Management System)\n• **BOLD-QIT** — BSF's AI-assisted border tech\n• Laser walls, thermal imaging, seismic sensors\n\n**How Trinetra Fits**: Our system simulates the command center that integrates these sensors into one unified dashboard. A sector commander sees all threats, all cameras, all AI analysis in one place — that's the vision.\n\n**Budget Context**: India's defense budget FY2024: ₹5.94 lakh crore. Smart border tech is a growing allocation priority.`,
};

function getAIResponse(input, detectionData) {
    const q = input.toLowerCase();
    // Threat analysis
    if (q.includes('threat') || q.includes('danger') || q.includes('risk') || q.includes('analyz'))
        return CONTEXTUAL_RESPONSES.threat(detectionData);
    // System status
    if (q.includes('status') || q.includes('system') || q.includes('health') || q.includes('online'))
        return CONTEXTUAL_RESPONSES.status();
    // Patrol
    if (q.includes('patrol') || q.includes('personnel') || q.includes('team') || q.includes('unit') || q.includes('soldier') || q.includes('bsf'))
        return CONTEXTUAL_RESPONSES.patrol();
    // Weather
    if (q.includes('weather') || q.includes('visibility') || q.includes('temperature') || q.includes('rain') || q.includes('fog'))
        return CONTEXTUAL_RESPONSES.weather();
    // Recommendations
    if (q.includes('recommend') || q.includes('suggest') || q.includes('what should') || q.includes('advise') || q.includes('action'))
        return CONTEXTUAL_RESPONSES.recommend(detectionData);
    // History
    if (q.includes('history') || q.includes('past') || q.includes('log') || q.includes('previous') || q.includes('incident'))
        return CONTEXTUAL_RESPONSES.history();
    // Border security
    if (q.includes('border') || q.includes('intrusion') || q.includes('perimeter') || q.includes('fence') || q.includes('pakistan') || q.includes('china') || q.includes('loc') || q.includes('lac'))
        return CONTEXTUAL_RESPONSES.border();
    // Railway
    if (q.includes('railway') || q.includes('train') || q.includes('track') || q.includes('elephant') || q.includes('wildlife') || q.includes('brake'))
        return CONTEXTUAL_RESPONSES.railway();
    // Mining
    if (q.includes('mining') || q.includes('geo') || q.includes('satellite') || q.includes('terrain') || q.includes('jharkhand') || q.includes('illegal'))
        return CONTEXTUAL_RESPONSES.mining();
    // CCTV
    if (q.includes('cctv') || q.includes('camera') || q.includes('cam') || q.includes('feed') || q.includes('video') || q.includes('surveillance'))
        return CONTEXTUAL_RESPONSES.cctv();
    // Fuzzy logic
    if (q.includes('fuzzy') || q.includes('logic') || q.includes('scoring') || q.includes('algorithm') || q.includes('xai') || q.includes('explain'))
        return CONTEXTUAL_RESPONSES.fuzzy();
    // Project info
    if (q.includes('project') || q.includes('trinetra') || q.includes('about') || q.includes('how does') || q.includes('how it work') || q.includes('what is') || q.includes('technology') || q.includes('tech stack') || q.includes('purpose'))
        return CONTEXTUAL_RESPONSES.project();
    // Drone/UAV
    if (q.includes('drone') || q.includes('uav') || q.includes('aerial') || q.includes('airspace') || q.includes('flying'))
        return CONTEXTUAL_RESPONSES.drone();
    // India defense
    if (q.includes('india') || q.includes('defense') || q.includes('defence') || q.includes('military') || q.includes('army') || q.includes('force') || q.includes('security') || q.includes('ministry'))
        return CONTEXTUAL_RESPONSES.india_defense();
    // Help
    if (q.includes('help') || q.includes('command') || q.includes('what can') || q.includes('menu'))
        return CONTEXTUAL_RESPONSES.help();
    // Greetings
    if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('good'))
        return `Hello, Commander. I'm the Trinetra AI Analyst, operational and monitoring all sectors.\n\nCurrent status: All systems **GREEN**. Threat level: **${detectionData.threatLevel}**.\n\nHow can I assist you? I can analyze threats, provide patrol updates, weather impact analysis, tactical recommendations, or answer any questions about the system. Type "help" for all commands.`;
    // Thanks
    if (q.includes('thank') || q.includes('great') || q.includes('good job') || q.includes('nice'))
        return `Acknowledged, Commander. Continuing surveillance operations.\n\nRemember — I'm here 24/7 monitoring all sensor feeds. Alert me immediately if you need tactical analysis or situation updates.\n\nForce readiness: **GREEN** | All sectors: **SECURE**`;
    // Who are you
    if (q.includes('who are you') || q.includes('your name') || q.includes('introduce'))
        return `I am the **Trinetra AI Threat Analyst** — a Large Language Model (LLM) integrated into the Trinetra Rakshak Command Center.\n\n**My Capabilities**:\n• Real-time threat assessment using sensor fusion\n• Contextual intelligence briefings\n• Patrol coordination and personnel tracking\n• Weather impact analysis for operations\n• Historical threat pattern correlation\n• Tactical recommendations based on threat level\n• Knowledge of India's border security, railway safety, and mining surveillance\n\nI process data from all 4 CCTV cameras, the fuzzy logic engine, and environmental sensors to provide actionable intelligence.\n\nBuilt with: React + Web APIs | Powered by: Contextual AI Engine`;
    // Catch-all: give an intelligent, contextual response instead of "try asking about..."
    return `**Analysis for: "${input}"**\n\nI've processed your query against current operational data.\n\n**Current Situation**:\n• Threat Level: **${detectionData.threatLevel}**\n• Active Detections: ${detectionData.objectCount} object(s)\n• Risk Score: ${detectionData.riskScore}%\n• Primary Classification: ${detectionData.primaryClass || 'None'}\n• Sector Status: ${detectionData.threatLevel === 'LOW' ? 'Secure — no active threats' : 'Under active monitoring'}\n\n**Sensor Summary**:\n• CCTV: 4/4 feeds operational\n• Perimeter: ${detectionData.threatLevel !== 'LOW' ? 'Activity detected' : 'Clear'}\n• Track-Guard: Monitoring railway corridor\n• GEO-EYE: Satellite scan standby\n\nI can provide detailed analysis on: threats, patrols, weather, CCTV, fuzzy logic, border security, railway safety, mining detection, drones, India defense, or project technology.\n\nType **"help"** for all available commands.`;
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

    const API_URL = import.meta.env.PROD
        ? 'https://backend-ten-fawn-25.vercel.app'
        : 'http://127.0.0.1:5000';

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg = {
            id: Date.now(),
            role: 'user',
            text: input.trim(),
            time: new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' })
        };
        setMessages(prev => [...prev, userMsg]);
        const currentInput = input.trim();
        setInput('');
        setIsTyping(true);

        // Try real Claude API first, fall back to local keyword engine
        try {
            const res = await fetch(`${API_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: currentInput,
                    score: detectionData.riskScore || 0,
                    module: detectionData.label || 'UNKNOWN',
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    role: 'ai',
                    text: data.response,
                    time: new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }),
                    source: data.source || 'api',
                }]);
                setIsTyping(false);
                return;
            }
        } catch (err) {
            console.warn('[AI Analyst] API unreachable, using local engine:', err.message);
        }

        // Fallback: local keyword-matching response
        const delay = 600 + Math.random() * 1200;
        setTimeout(() => {
            const response = getAIResponse(currentInput, detectionData);
            setMessages(prev => [...prev, {
                id: Date.now(),
                role: 'ai',
                text: response,
                time: new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }),
                source: 'local',
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
                            {['Threat', 'Status', 'Border', 'Railway', 'Mining', 'CCTV', 'Fuzzy Logic', 'Project', 'Help'].map(q => (
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
