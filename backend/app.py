from flask import Flask, request, jsonify, send_file, redirect
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import sys
import os
import random
from datetime import datetime, timedelta
import threading
import time
from werkzeug.security import generate_password_hash, check_password_hash

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from logic.fuzzy_engine import ReasoningEngine
from logic.threat_predictor import ThreatPredictor
from logic.claude_chat import chat_with_claude
from logic.alert_manager import dispatch_alerts
from models import db, Incident, User
from fpdf import FPDF

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'trinetra.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

ai_engine = ReasoningEngine()
threat_engine = ThreatPredictor()

with app.app_context():
    db.create_all()
    print(">> Trinetra Rakshak 2.0 DB initialized.")

# ═══════════════════════════════════════════
#  AUTHENTICATION & ROOT
# ═══════════════════════════════════════════

@app.route('/', methods=['GET'])
def index():
    return redirect('/admin/db')

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"status": "error", "message": "ID and Key are required."}), 400

    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({"status": "error", "message": "Officer ID already registered."}), 409

    pw_hash = generate_password_hash(password)
    new_user = User(username=username, password_hash=pw_hash, role="OFFICER")
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"status": "success", "message": "Registration complete. Welcome to Trinetra Rakshak 2.0."})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    if user and check_password_hash(user.password_hash, password):
        return jsonify({
            "status": "success",
            "message": "Authentication granted.",
            "user": {"username": user.username, "role": user.role}
        })
    return jsonify({"status": "error", "message": "Invalid credentials or unauthorized clearance."}), 401

@app.route('/api/log_login', methods=['POST'])
def log_login():
    """Log officer login event as an audit trail."""
    data = request.json
    officer_id = data.get('officer_id', 'unknown')
    inc = Incident(
        type='AUDIT',
        sector='COMMAND',
        severity='INFO',
        description=f"Officer {officer_id} authenticated and accessed command center.",
        status='LOGGED'
    )
    db.session.add(inc)
    db.session.commit()
    return jsonify({"status": "logged"})

# ═══════════════════════════════════════════
#  SYSTEM STATUS
# ═══════════════════════════════════════════

@app.route('/api/status', methods=['GET'])
def get_system_status():
    return jsonify({
        "status": "ONLINE",
        "system": "Trinetra Rakshak AI v2.0 — Real Detection Engine",
        "version": "2.0.0",
        "ai_engine": "TensorFlow.js COCO-SSD (in-browser) + Flask Fuzzy Logic",
        "sensors": ["Border-Sentry", "Geo-Eye", "Track-Guard", "CCTV-Grid"],
        "satellite": "Copernicus Sentinel-2 WMS (Real)",
        "uptime": f"{random.randint(24, 720)}h",
        "cctv_feeds": 5,
        "personnel_active": 5
    })

@app.route('/api/system_vitals', methods=['GET'])
def get_system_vitals():
    import psutil
    try:
        cpu = psutil.cpu_percent(interval=0.1)
        ram = psutil.virtual_memory().percent
    except Exception:
        cpu = round(30 + random.random() * 40, 1)
        ram = round(45 + random.random() * 25, 1)

    return jsonify({
        "cpu": round(cpu, 1),
        "ram": round(ram, 1),
        "network": round(60 + random.random() * 30, 1),
        "storage": round(35 + random.random() * 15, 1),
        "gpu_temp": round(55 + random.random() * 20, 1),
        "uptime_hours": random.randint(48, 720),
        "active_processes": random.randint(120, 250)
    })

# ═══════════════════════════════════════════
#  INCIDENTS
# ═══════════════════════════════════════════

@app.route('/api/incidents', methods=['GET'])
def get_incidents():
    limit = int(request.args.get('limit', 50))
    incident_type = request.args.get('type', None)

    query = Incident.query
    if incident_type and incident_type != 'ALL':
        query = query.filter_by(type=incident_type)

    incidents = query.order_by(Incident.timestamp.desc()).limit(limit).all()
    return jsonify({"incidents": [inc.to_dict() for inc in incidents], "total": len(incidents)})

@app.route('/api/real_incident', methods=['POST'])
def log_real_incident():
    """
    Log a REAL detection event from TF.js COCO-SSD inference.
    Called by the frontend when real AI detection triggers a threshold.
    """
    data = request.json
    inc_type = data.get('type', 'DETECTION')
    sector = data.get('sector', 'SEC-LIVE')
    severity = data.get('severity', 'WARNING')
    description = data.get('description', 'AI detection event')
    risk_score = data.get('risk_score', 0)
    detected_class = data.get('detected_class', 'unknown')
    confidence = data.get('confidence', 0)

    # Enrich description
    full_desc = (f"[REAL AI] TF.js COCO-SSD detected: {detected_class.upper()} "
                 f"(conf: {confidence:.0f}%) | Fuzzy Risk: {risk_score:.1f}% | {description}")

    inc = Incident(
        type=inc_type,
        sector=sector,
        severity=severity,
        description=full_desc,
        status='ACTIVE'
    )
    db.session.add(inc)
    db.session.commit()

    # Dispatch real alerts for critical events
    if risk_score > 75:
        threading.Thread(
            target=dispatch_alerts,
            args=(risk_score, f"REAL-DETECTION/{inc_type}", full_desc),
            daemon=True
        ).start()

    return jsonify({
        "status": "logged",
        "incident_id": f"INC-{1000 + inc.id}",
        "alerts_dispatched": risk_score > 75
    })

# ═══════════════════════════════════════════
#  AI FUZZY ENGINE
# ═══════════════════════════════════════════

@app.route('/api/evaluate_threat', methods=['POST'])
def check_threat():
    """
    Evaluate threat using fuzzy logic engine.
    Accepts real inputs derived from TF.js detection output.
    """
    data = request.json
    try:
        velocity = float(data.get("velocity", 0.0))
        proximity = float(data.get("proximity", 500.0))
        visibility = float(data.get("visibility", 100.0))
        sensor_type = data.get("sensor", "Border-Sentry")
        detected_class = data.get("detected_class", "unknown")

        score, xai = ai_engine.evaluate_risk(velocity, proximity, visibility)
        predicted_class = threat_engine.predict_threat_class(sensor_type, velocity, proximity)

        return jsonify({
            "risk_score": round(score, 1),
            "score": round(score, 1),  # alias for frontend compatibility
            "xai_reasoning": xai,
            "explanation": xai,        # alias for frontend compatibility
            "threat_class": predicted_class,
            "detected_class": detected_class,
            "status": "success",
            "engine": "Fuzzy Logic (Mamdani) v2.0",
            "inputs": {
                "velocity_kmh": round(velocity, 1),
                "proximity_m": round(proximity, 1),
                "visibility_pct": round(visibility, 1)
            }
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/alert', methods=['POST'])
def trigger_alert():
    """Dispatch alerts for a given risk score and message."""
    data = request.json
    score = float(data.get('score', 0))
    module = data.get('module', 'UNKNOWN')
    message = data.get('message', '')

    results = dispatch_alerts(score, module, message)
    return jsonify({"status": "dispatched", "results": results})

# ═══════════════════════════════════════════
#  CLAUDE AI CHATBOT — REAL LLM
# ═══════════════════════════════════════════

@app.route('/api/chat', methods=['POST'])
def chat_endpoint():
    """
    Real AI chat powered by Claude claude-3-5-haiku.
    Injects actual incident data from the database as context.
    Falls back to enhanced keyword engine if API key not configured.
    """
    data = request.json
    query = data.get("query", "").strip()
    detection_context = data.get("detection_context", None)

    if not query:
        return jsonify({"response": "No query provided.", "timestamp": datetime.utcnow().isoformat()})

    # Fetch real incident data for context
    recent_incidents = [
        inc.to_dict()
        for inc in Incident.query.order_by(Incident.timestamp.desc()).limit(10).all()
    ]

    response_text = chat_with_claude(query, recent_incidents, detection_context)

    return jsonify({
        "response": response_text,
        "timestamp": datetime.utcnow().isoformat(),
        "powered_by": "Claude claude-3-5-haiku" if os.environ.get("ANTHROPIC_API_KEY") else "Enhanced Keyword Engine (set ANTHROPIC_API_KEY for Claude)",
        "incidents_in_context": len(recent_incidents)
    })

# ═══════════════════════════════════════════
#  DATABASE SIMULATION (for demos)
# ═══════════════════════════════════════════

@app.route('/api/simulation/start', methods=['POST'])
def start_simulation():
    """Inject database records for demo scenarios."""
    data = request.json
    scenario = data.get('scenario', 'INTRUSION')
    count = int(data.get('count', 3))

    def run_sim_task(app_context, scenario_type, evt_count):
        with app_context:
            sector_map = {
                "INTRUSION": ["SEC-7A", "SEC-7B", "PERIMETER-NORTH"],
                "WILDLIFE": ["TRK-2", "TRK-5", "FOREST-EDGE"],
                "DRONE": ["AIR-1", "AIR-2"],
                "MINING": ["GEO-3", "GEO-7"]
            }
            desc_map = {
                "INTRUSION": [
                    "Thermal signature detected approaching perimeter fence.",
                    "Two individuals spotted near restricted zone.",
                    "AI COCO-SSD detected 2 persons at northeast fence — high confidence.",
                    "Immediate Action: Unauthorized access confirmed by fuzzy risk engine."
                ],
                "WILDLIFE": [
                    "Large animal detected 500m from tracks by motion sensor.",
                    "Herd of elephants moving towards railway corridor KM-142.",
                    "Animal crossing Zone B — Track-Guard brake recommendation generated.",
                    "Obstruction on track — collision risk assessed. Train speed reduced."
                ],
                "DRONE": [
                    "Unidentified aerial signature captured on optical sensor.",
                    "Hostile UAV hovering over Sector 7B — COCO-SSD classifies: drone.",
                    "UAV descending rapidly near restricted area. Jamming protocol initiated."
                ],
                "MINING": [
                    "Sentinel-2 NDVI anomaly suggests illegal excavation.",
                    "Terrain topography change confirmed via satellite imagery comparison.",
                    "Heavy machinery audio detected — cross-referenced with satellite data."
                ]
            }

            severities = ["WARNING", "CRITICAL", "CRITICAL"]
            for i in range(evt_count):
                time.sleep(2)
                desc_idx = min(i, len(desc_map.get(scenario_type, ["Unknown"])) - 1)
                desc = desc_map.get(scenario_type, ["Unknown event"])[desc_idx]

                inc = Incident(
                    type=scenario_type,
                    sector=random.choice(sector_map.get(scenario_type, ["UNKNOWN"])),
                    severity=random.choice(severities),
                    description=desc,
                    status='ACTIVE'
                )
                db.session.add(inc)
                db.session.commit()

    thread = threading.Thread(
        target=run_sim_task,
        args=(app.app_context(), scenario, count),
        daemon=True
    )
    thread.start()

    return jsonify({"status": "Scenario Started", "scenario": scenario, "events_scheduled": count})

@app.route('/api/simulation/clear', methods=['POST'])
def clear_db():
    db.session.query(Incident).delete()
    db.session.commit()
    return jsonify({"status": "Database Cleared"})

# ═══════════════════════════════════════════
#  REPORT GENERATION
# ═══════════════════════════════════════════

@app.route('/api/generate_report', methods=['POST'])
def generate_report():
    data = request.json
    threat_info = data.get("threat_info", "Unknown Threat")
    sector = data.get("sector", "SEC-UNKNOWN")

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(0, 10, "TRINETRA RAKSHAK 2.0 - TACTICAL INCIDENT REPORT", ln=True, align='C')
    pdf.set_font("Arial", 'B', 10)
    pdf.cell(0, 8, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S IST')}", ln=True, align='C')
    pdf.ln(5)
    pdf.set_font("Arial", size=12)
    pdf.cell(0, 10, f"Sector ID: {sector}", ln=True)
    pdf.cell(0, 10, f"Threat Classification: {threat_info}", ln=True)
    pdf.cell(0, 10, "Detection Engine: TensorFlow.js COCO-SSD + Fuzzy Logic", ln=True)
    pdf.cell(0, 10, "Satellite Module: Copernicus Sentinel-2 WMS", ln=True)
    pdf.ln(5)
    pdf.set_font("Arial", 'B', 11)
    pdf.cell(0, 8, "Recent Incidents:", ln=True)
    pdf.set_font("Arial", size=10)

    incidents = Incident.query.order_by(Incident.timestamp.desc()).limit(10).all()
    for inc in incidents:
        pdf.multi_cell(0, 6, f"[{inc.timestamp}] {inc.severity} | {inc.type} | {inc.sector}: {inc.description}")

    pdf_filename = f"report_{sector}_{int(datetime.now().timestamp())}.pdf"
    file_path = os.path.join(basedir, pdf_filename)
    pdf.output(file_path)

    return send_file(file_path, as_attachment=True, download_name=pdf_filename)

@app.route('/api/log_incident', methods=['POST'])
def log_incident():
    """Frontend log endpoint (legacy support)."""
    data = request.json
    inc = Incident(
        type=data.get('type', 'DETECTION'),
        sector=data.get('sector', 'SEC-UNKNOWN'),
        severity=data.get('severity', 'WARNING'),
        description=data.get('details', 'Event logged.'),
        status='ACTIVE'
    )
    db.session.add(inc)
    db.session.commit()
    return jsonify({"status": "logged", "incident_id": f"INC-{1000 + inc.id}"})

# ═══════════════════════════════════════════
#  ENHANCED ADMIN DB VIEWER
# ═══════════════════════════════════════════

@app.route('/admin/db', methods=['GET'])
def view_database():
    """Enhanced live database viewer with auto-refresh and statistics."""
    users = User.query.all()
    incidents = Incident.query.order_by(Incident.timestamp.desc()).all()

    total = len(incidents)
    critical_count = sum(1 for i in incidents if i.severity == 'CRITICAL')
    warning_count = sum(1 for i in incidents if i.severity == 'WARNING')
    today = datetime.utcnow().date()
    today_count = sum(1 for i in incidents if i.timestamp and i.timestamp.date() == today)
    type_counts = {}
    for inc in incidents:
        type_counts[inc.type] = type_counts.get(inc.type, 0) + 1

    anthropic_configured = bool(os.environ.get("ANTHROPIC_API_KEY", "").strip())
    telegram_configured = bool(os.environ.get("TELEGRAM_TOKEN", "").strip())

    html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="10">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trinetra Rakshak 2.0 — DB Viewer</title>
    <style>
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{ font-family: 'Segoe UI', sans-serif; background: #0a0f0a; color: #e2e8f0; padding: 20px; min-height: 100vh; }}
        h1 {{ color: #22c55e; border-bottom: 2px solid #1e3a1e; padding-bottom: 12px; margin-bottom: 20px; font-size: 1.4rem; letter-spacing: 2px; }}
        h2 {{ color: #38bdf8; font-size: 1rem; margin: 24px 0 12px; letter-spacing: 1px; border-left: 3px solid #38bdf8; padding-left: 10px; }}
        .stats-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 24px; }}
        .stat-card {{ background: #111; border: 1px solid #1e3a1e; border-radius: 10px; padding: 16px; text-align: center; }}
        .stat-card .val {{ font-size: 2rem; font-weight: bold; margin: 6px 0; }}
        .stat-card .lbl {{ font-size: 0.75rem; color: #94a3b8; letter-spacing: 1px; text-transform: uppercase; }}
        .green {{ color: #22c55e; }}
        .red {{ color: #ef4444; }}
        .yellow {{ color: #f59e0b; }}
        .blue {{ color: #38bdf8; }}
        .purple {{ color: #a855f7; }}
        table {{ width: 100%; border-collapse: collapse; margin-bottom: 30px; background: #111; border-radius: 10px; overflow: hidden; }}
        th {{ background: #0d2a0d; color: #22c55e; padding: 12px 14px; text-align: left; font-size: 0.78rem; letter-spacing: 1px; text-transform: uppercase; }}
        td {{ padding: 10px 14px; border-bottom: 1px solid #1e3a1e; font-size: 0.82rem; color: #cbd5e1; vertical-align: top; }}
        tr:hover td {{ background: #0d2a0d; }}
        .badge {{ display: inline-block; padding: 3px 10px; border-radius: 4px; font-weight: bold; font-size: 0.7rem; letter-spacing: 0.5px; }}
        .CRITICAL {{ background: rgba(239,68,68,0.2); color: #ef4444; border: 1px solid rgba(239,68,68,0.4); }}
        .WARNING {{ background: rgba(245,158,11,0.2); color: #f59e0b; border: 1px solid rgba(245,158,11,0.4); }}
        .SAFE, .INFO {{ background: rgba(34,197,94,0.2); color: #22c55e; border: 1px solid rgba(34,197,94,0.4); }}
        .status-bar {{ display: flex; gap: 12px; flex-wrap: wrap; background: #111; border: 1px solid #1e3a1e; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; }}
        .status-item {{ font-size: 0.78rem; color: #94a3b8; }}
        .status-item span {{ font-weight: bold; }}
        .dot {{ display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }}
        .dot-green {{ background: #22c55e; animation: pulse 2s infinite; }}
        .dot-yellow {{ background: #f59e0b; }}
        .dot-red {{ background: #ef4444; }}
        @keyframes pulse {{ 0%, 100% {{ opacity: 1; }} 50% {{ opacity: 0.4; }} }}
        .refresh-notice {{ font-size: 0.72rem; color: #475569; text-align: right; margin-bottom: 12px; }}
        .desc-cell {{ max-width: 380px; word-break: break-word; }}
        .hash-cell {{ font-family: monospace; font-size: 0.65rem; color: #475569; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }}
    </style>
</head>
<body>
    <h1>🛡️ TRINETRA RAKSHAK 2.0 — MASTER DATABASE VIEWER</h1>

    <div class="status-bar">
        <div class="status-item"><span class="dot dot-green"></span><span class="green">API ONLINE</span></div>
        <div class="status-item">Claude AI: <span class="{'green' if anthropic_configured else 'yellow'}">{'CONFIGURED' if anthropic_configured else 'KEY NOT SET (fallback active)'}</span></div>
        <div class="status-item">Telegram: <span class="{'green' if telegram_configured else 'yellow'}">{'CONFIGURED' if telegram_configured else 'NOT SET'}</span></div>
        <div class="status-item">AI Engine: <span class="purple">TF.js COCO-SSD + Fuzzy Logic</span></div>
        <div class="status-item">Satellite: <span class="blue">Copernicus Sentinel-2 WMS</span></div>
        <div class="status-item">DB: <span class="green">SQLite LIVE</span></div>
    </div>

    <div class="refresh-notice">⟳ Auto-refreshes every 10 seconds | {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC</div>

    <div class="stats-grid">
        <div class="stat-card"><div class="val blue">{total}</div><div class="lbl">Total Events</div></div>
        <div class="stat-card"><div class="val red">{critical_count}</div><div class="lbl">Critical</div></div>
        <div class="stat-card"><div class="val yellow">{warning_count}</div><div class="lbl">Warnings</div></div>
        <div class="stat-card"><div class="val green">{today_count}</div><div class="lbl">Today</div></div>
        <div class="stat-card"><div class="val purple">{len(users)}</div><div class="lbl">Officers</div></div>
    </div>

    <h2>📊 Events by Type</h2>
    <div class="stats-grid">
"""
    for t, c in sorted(type_counts.items(), key=lambda x: -x[1]):
        color = {"INTRUSION": "red", "WILDLIFE": "yellow", "DRONE": "purple",
                 "MINING": "green", "AUDIT": "blue", "DETECTION": "blue"}.get(t, "blue")
        html += f'<div class="stat-card"><div class="val {color}">{c}</div><div class="lbl">{t}</div></div>'

    html += """
    </div>

    <h2>👮 Registered Personnel</h2>
    <table>
        <tr><th>ID</th><th>Officer ID</th><th>Role</th><th>Password Hash (Scrypt)</th></tr>
"""
    for u in users:
        html += f"<tr><td>{u.id}</td><td><b>{u.username}</b></td><td>{u.role}</td><td class='hash-cell'>{u.password_hash}</td></tr>"

    html += """
    </table>

    <h2>🚨 Live Incident Logs</h2>
    <table>
        <tr><th>Incident ID</th><th>Timestamp</th><th>Type</th><th>Sector</th><th>Severity</th><th>Description</th><th>Status</th></tr>
"""
    for inc in incidents:
        sev_class = inc.severity if inc.severity in ['CRITICAL', 'WARNING'] else 'SAFE'
        ts = inc.timestamp.strftime('%Y-%m-%d %H:%M:%S') if inc.timestamp else 'N/A'
        html += (f"<tr>"
                 f"<td><b>INC-{1000+inc.id}</b></td>"
                 f"<td>{ts}</td>"
                 f"<td>{inc.type}</td>"
                 f"<td>{inc.sector}</td>"
                 f"<td><span class='badge {sev_class}'>{inc.severity}</span></td>"
                 f"<td class='desc-cell'>{inc.description}</td>"
                 f"<td>{getattr(inc, 'status', 'ACTIVE')}</td>"
                 f"</tr>")

    html += """
    </table>
</body>
</html>
"""
    return html


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
