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

# Append the current dir to resolve modules easily 
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from logic.fuzzy_engine import ReasoningEngine
from logic.threat_predictor import ThreatPredictor
from models import db, Incident, User
from fpdf import FPDF

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# DB Configuration
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'trinetra.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Central Logic Engine reference
ai_engine = ReasoningEngine()
threat_engine = ThreatPredictor()

# Create DB tables
with app.app_context():
    # Force creation of all tables (this handles the new User model)
    db.create_all()
    # Force creation of all tables 
    db.create_all()
    print(">> Secure DB initialized.")

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
    
    return jsonify({
        "status": "success",
        "message": "Registration complete. Welcome to Trinetra."
    })

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
            "user": {
                "username": user.username,
                "role": user.role
            }
        })
    else:
        return jsonify({
            "status": "error",
            "message": "Invalid credentials or unauthorized clearance."
        }), 401

# ═══════════════════════════════════════════
#  DASHBOARD ENDPOINTS
# ═══════════════════════════════════════════

@app.route('/api/status', methods=['GET'])
def get_system_status():
    return jsonify({
        "status": "ONLINE",
        "system": "Trinetra Rakshak API v5.0 Master",
        "sensors": ["Border-Sentry", "Geo-Eye", "Track-Guard", "Wildlife-Scan"],
        "uptime": f"{random.randint(24,720)}h",
        "cctv_feeds": 8,
        "personnel_active": 5
    })

@app.route('/api/system_vitals', methods=['GET'])
def get_system_vitals():
    return jsonify({
        "cpu": round(30 + random.random() * 40, 1),
        "ram": round(45 + random.random() * 25, 1),
        "network": round(60 + random.random() * 30, 1),
        "storage": round(35 + random.random() * 15, 1),
        "gpu_temp": round(55 + random.random() * 20, 1),
        "uptime_hours": random.randint(48, 720),
        "active_processes": random.randint(120, 250)
    })

@app.route('/api/incidents', methods=['GET'])
def get_incidents():
    """ Fetch real incidents stored in SQLite """
    limit = int(request.args.get('limit', 50))
    incident_type = request.args.get('type', None)
    
    query = Incident.query
    if incident_type and incident_type != 'ALL':
        query = query.filter_by(type=incident_type)
        
    incidents = query.order_by(Incident.timestamp.desc()).limit(limit).all()
    
    return jsonify({
        "incidents": [inc.to_dict() for inc in incidents],
        "total": len(incidents)
    })

# ═══════════════════════════════════════════
#  DATABASE SIMULATION ENDPOINTS
# ═══════════════════════════════════════════

# To simulate "one by one", we can use a background thread or sequential API inserts.
# We will provide an endpoint to clear DB and insert a fresh scenario step by step.

@app.route('/api/simulation/start', methods=['POST'])
def start_simulation():
    """ 
    Triggers a specific simulation scenario. 
    It will inject database records with small delays.
    """
    data = request.json
    scenario = data.get('scenario', 'INTRUSION') # INTRUSION, WILDLIFE, DRONE, MINING
    count = int(data.get('count', 3))
    
    def run_sim_task(app_app_context, scenario_type, evt_count):
        with app_app_context:
            sector_map = {
                "INTRUSION": ["SEC-7A", "SEC-7B", "PERIMETER-NORTH"],
                "WILDLIFE": ["TRK-2", "TRK-5", "FOREST-EDGE"],
                "DRONE": ["AIR-1", "AIR-2"],
                "MINING": ["GEO-3", "GEO-7"]
            }
            desc_map = {
                "INTRUSION": [
                    "Thermal signature detected approaching fence.",
                    "Two individuals spotted near restricted zone.",
                    "Breach attempt detected! CCTV caught two intruders.",
                    "Immediate Action Required: Unauthorized access verified."
                ],
                "WILDLIFE": [
                    "Large animal detected 500m from tracks.",
                    "Herd of elephants moving towards railway track.",
                    "Animal crossing Zone B detected.",
                    "Obstruction on track - potential collision risk."
                ],
                "DRONE": [
                    "Unidentified aerial signature captured on radar.",
                    "Hostile drone hovering over Sector 7B.",
                    "Drone descending rapidly near sensitive payload."
                ],
                "MINING": [
                    "Heatmap anomaly suggests illegal excavation.",
                    "Heavy machinery audio detected via acoustic sensors.",
                    "Terrain topographical change confirmed by satellite."
                ]
            }
            
            severities = ["WARNING", "CRITICAL", "CRITICAL"]
            
            for i in range(evt_count):
                time.sleep(2)  # 2 second delay for realistic appearance
                desc_idx = min(i, len(desc_map.get(scenario_type, ["Unknown Event"])) - 1)
                desc = desc_map.get(scenario_type, ["Unknown"])[desc_idx]
                
                # if the user specifically wants "CCTV caught two intruders"
                if scenario_type == 'INTRUSION' and i == 1:
                    desc = "CCTV caught two intruders near the north perimeter fence."
                
                inc = Incident(
                    type=scenario_type,
                    sector=random.choice(sector_map.get(scenario_type, ["UNKNOWN"])),
                    severity=random.choice(severities),
                    description=desc,
                    status="ACTIVE"
                )
                db.session.add(inc)
                db.session.commit()
                
    
    thread = threading.Thread(target=run_sim_task, args=(app.app_context(), scenario, count))
    thread.start()
    
    return jsonify({"status": "Simulation Started", "scenario": scenario, "events_scheduled": count})

@app.route('/api/simulation/clear', methods=['POST'])
def clear_db():
    db.session.query(Incident).delete()
    db.session.commit()
    return jsonify({"status": "Database Cleared"})

# ═══════════════════════════════════════════
#  ADMIN DB VIEWER (For Presentation)
# ═══════════════════════════════════════════

@app.route('/admin/db', methods=['GET'])
def view_database():
    """ Renders the entire database in a simple HTML table for browser viewing """
    users = User.query.all()
    incidents = Incident.query.order_by(Incident.timestamp.desc()).all()
    
    html = """
    <html>
        <head>
            <title>Trinetra DB Viewer</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #f8fafc; padding: 20px; }
                h1, h2 { color: #38bdf8; border-bottom: 2px solid #1e293b; padding-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; background: #1e293b; }
                th, str { background: #0ea5e9; color: #fff; padding: 12px; text-align: left; }
                td { padding: 10px; border-bottom: 1px solid #334155; }
                tr:hover { background: #334155; }
                .badge { padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
                .CRITICAL { background: #ef4444; color: white; }
                .WARNING { background: #f59e0b; color: white; }
                .SAFE { background: #10b981; color: white; }
            </style>
        </head>
        <body>
            <h1>🛡️ Trinetra Rakshak - Master Database Viewer</h1>
            
            <h2>Registered Personnel (Users Table)</h2>
            <table>
                <tr><th>ID</th><th>Officer ID (Username)</th><th>Role</th><th>Password Hash (Scrypt)</th></tr>
    """
    for u in users:
        html += f"<tr><td>{u.id}</td><td><b>{u.username}</b></td><td>{u.role}</td><td style='font-family: monospace; font-size: 11px; color: #94a3b8;'>{u.password_hash}</td></tr>"
        
    html += """
            </table>
            
            <h2>Live Incident Logs (Incidents Table)</h2>
            <table>
                <tr><th>Incident ID</th><th>Timestamp</th><th>Type</th><th>Sector</th><th>Severity</th><th>Description</th></tr>
    """
    for inc in incidents:
        sev_class = inc.severity if inc.severity in ['CRITICAL', 'WARNING'] else 'SAFE'
        html += f"<tr><td>INC-{1000+inc.id}</td><td>{inc.timestamp}</td><td>{inc.type}</td><td>{inc.sector}</td><td><span class='badge {sev_class}'>{inc.severity}</span></td><td>{inc.description}</td></tr>"
        
    html += """
            </table>
        </body>
    </html>
    """
    return html



# ═══════════════════════════════════════════
#  AI CHATBOT ENGINE
# ═══════════════════════════════════════════

@app.route('/api/chat', methods=['POST'])
def chat_with_ai():
    """ Understands intent and replies intelligently based on the real SQLite DB. """
    data = request.json
    query = data.get("query", "").lower()
    
    response_text = "I am processing your request."
    
    # 1. Breach / Intrusion Queries
    if any(word in query for word in ["breach", "intruder", "caught", "person", "human"]):
        recent = Incident.query.filter_by(type='INTRUSION').order_by(Incident.timestamp.desc()).first()
        if recent:
            if "two intruders" in recent.description.lower() or "two individuals" in recent.description.lower():
                response_text = f"Yes, CCTV caught two intruders in {recent.sector}. Immediate QRF deployment is advised. Threat level is {recent.severity}."
            else:
                response_text = f"We have an active breach in {recent.sector}: {recent.description}"
        else:
            response_text = "All sectors are currently secure. No intruders detected."
            
    # 2. Wildlife / Animal Queries
    elif any(word in query for word in ["animal", "wildlife", "walking", "elephant", "track"]):
        recent = Incident.query.filter_by(type='WILDLIFE').order_by(Incident.timestamp.desc()).first()
        if recent:
            response_text = f"Alert: Wildlife tracking system detected an animal crossing in {recent.sector}. Status is {recent.severity}. Railway collision protocols active."
        else:
            response_text = "No animal movement near critical infrastructure currently."

    # 3. Sector-Specific Queries ("update on sec 7")
    elif "sec 7" in query or "sector 7" in query:
        # Get the latest incident in any SEC-7* sector
        recent = Incident.query.filter(Incident.sector.like('SEC-7%')).order_by(Incident.timestamp.desc()).first()
        if recent:
            response_text = f"Sector 7 latest update: A {recent.severity} alert was logged for {recent.type}. Detail: {recent.description}"
        else:
            response_text = "Sector 7 is currently reporting all clear. No recent anomalies detected."

    # 4. Drone / UAV Queries
    elif any(word in query for word in ["drone", "uav", "air", "flying"]):
        recent = Incident.query.filter_by(type='DRONE').order_by(Incident.timestamp.desc()).first()
        if recent:
            response_text = f"Airspace warning: {recent.description} in {recent.sector}. Anti-drone jamming systems are armed."
        else:
            response_text = "Airspace is clear. No unauthorized UAVs detected."

    # 5. General Status / "What happened" Queries
    elif any(word in query for word in ["status", "all", "what happened", "update"]):
        recent = Incident.query.order_by(Incident.timestamp.desc()).first()
        total = Incident.query.count()
        critical = Incident.query.filter_by(severity='CRITICAL').count()
        if recent:
             response_text = f"System online. {total} total events logged ({critical} critical). The most recent event was a {recent.severity} {recent.type} alert in {recent.sector}."
        else:
             response_text = f"System online. We have {total} total logged events, with {critical} critical alerts currently."
        
    # 6. Action Commands
    elif "lockdown" in query:
        response_text = "Lockdown sequence initiated. Sealing all access points and deploying automated defense measures."
    
    # Default Fallback
    else:
        response_text = "Command recorded. I am currently monitoring the border, wildlife tracks, and airspace. You can ask me for status updates or specific sector intelligence."
        
    return jsonify({
        "response": response_text,
        "timestamp": datetime.utcnow().isoformat()
    })

# ═══════════════════════════════════════════
#  LEGACY SENSOR EVALUATION & REPORT
# ═══════════════════════════════════════════

@app.route('/api/evaluate_threat', methods=['POST'])
def check_threat():
    data = request.json
    try:
        velocity = data.get("velocity", 0.0)
        proximity = data.get("proximity", 500.0)
        visibility = data.get("visibility", 100.0)
        sensor_type = data.get("sensor", "Border-Sentry")
        
        score, xai = ai_engine.evaluate_risk(velocity, proximity, visibility)
        predicted_class = threat_engine.predict_threat_class(sensor_type, velocity, proximity)
        
        return jsonify({
            "risk_score": round(score, 1),
            "xai_reasoning": xai,
            "threat_class": predicted_class,
            "status": "success"
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400


@app.route('/api/generate_report', methods=['POST'])
def generate_report():
    data = request.json
    threat_info = data.get("threat_info", "Unknown Threat")
    sector = data.get("sector", "SEC-UNKNOWN")
    
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(0, 10, "TRINETRA RAKSHAK - TACTICAL REPORT", ln=True, align='C')
    pdf.ln(5)
    pdf.set_font("Arial", size=12)
    pdf.cell(0, 10, f"Sector ID: {sector}", ln=True)
    pdf.cell(0, 10, f"Threat Classification: {threat_info}", ln=True)
    
    pdf_filename = f"report_{sector}_{int(datetime.now().timestamp())}.pdf"
    file_path = os.path.join(basedir, pdf_filename)
    pdf.output(file_path)
    
    return send_file(file_path, as_attachment=True, download_name=pdf_filename)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
