from flask import Flask, request, jsonify, send_file, redirect
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import sys
import os
import random
import shutil
from datetime import datetime, timedelta
import threading
import time
from werkzeug.security import generate_password_hash, check_password_hash

# Path adjustment for Vercel and local modules
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from logic.fuzzy_engine import ReasoningEngine
from logic.threat_predictor import ThreatPredictor
from models import db, Incident, User
from fpdf import FPDF

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# DB Configuration - Use /tmp for Vercel Serverless environment
basedir = os.path.abspath(os.path.dirname(__file__))

# Vercel specifies the execution environment in `/var/task`, but this is read-only. We must write to `/tmp`
is_vercel = os.environ.get('VERCEL', False)

if is_vercel:
    db_path = os.path.join('/tmp', 'trinetra.db')
    source_db_path = os.path.join(parent_dir, 'trinetra.db')
    # Copy original DB to /tmp if it doesn't exist there so we retain users
    if not os.path.exists(db_path) and os.path.exists(source_db_path):
        import shutil
        shutil.copy2(source_db_path, db_path)
else:
    db_path = os.path.join(parent_dir, 'trinetra.db')

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + db_path
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Central Logic Engine reference
ai_engine = ReasoningEngine()
threat_engine = ThreatPredictor()

# Create DB tables
with app.app_context():
    db.create_all()

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
        "system": "Trinetra Rakshak API v5.4 Master (Vercel)",
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

@app.route('/api/simulation/start', methods=['POST'])
def start_simulation():
    data = request.json
    scenario = data.get('scenario', 'INTRUSION')
    count = int(data.get('count', 3))
    
    # In Vercel serverless, background threads might be killed immediately.
    # For simulation, we'll just insert one immediate record to show it works.
    with app.app_context():
        sector_map = {"INTRUSION": ["SEC-7A"], "WILDLIFE": ["TRK-2"], "DRONE": ["AIR-1"], "MINING": ["GEO-3"]}
        desc_map = {"INTRUSION": ["Intruder detected."], "WILDLIFE": ["Animal on track."], "DRONE": ["UAV spotted."], "MINING": ["Terrain change."]}
        
        inc = Incident(
            type=scenario,
            sector=random.choice(sector_map.get(scenario, ["UNKNOWN"])),
            severity="CRITICAL",
            description=random.choice(desc_map.get(scenario, ["Observation logged manually."])),
            status="ACTIVE"
        )
        db.session.add(inc)
        db.session.commit()
    
    return jsonify({"status": "Simulation Record Created (Instant)", "scenario": scenario})

@app.route('/api/simulation/clear', methods=['POST'])
def clear_db():
    db.session.query(Incident).delete()
    db.session.commit()
    return jsonify({"status": "Database Cleared"})

# ═══════════════════════════════════════════
#  ADMIN DB VIEWER
# ═══════════════════════════════════════════

@app.route('/admin/db', methods=['GET'])
def view_database():
    users = User.query.all()
    incidents = Incident.query.order_by(Incident.timestamp.desc()).all()
    
    html = f"""
    <html>
        <head>
            <title>Trinetra DB Viewer (Vercel)</title>
            <style>
                body {{ font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #f8fafc; padding: 20px; }}
                h1, h2 {{ color: #38bdf8; border-bottom: 2px solid #1e293b; padding-bottom: 10px; }}
                table {{ width: 100%; border-collapse: collapse; margin-bottom: 30px; background: #1e293b; }}
                th {{ background: #0ea5e9; color: #fff; padding: 12px; text-align: left; }}
                td {{ padding: 10px; border-bottom: 1px solid #334155; }}
                tr:hover {{ background: #334155; }}
                .badge {{ padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }}
                .demo-note {{ background: #334155; padding: 10px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem; border-left: 4px solid #f59e0b; }}
            </style>
        </head>
        <body>
            <h1>🛡️ Trinetra Rakshak - Master Database Viewer</h1>
            <div class="demo-note">
                <b>NOTE (VERCEL DEPLOYMENT):</b> This is a demo serverless environment. 
                Database changes (Logins/Incidents) are temporary and will reset when the serverless instance restarts.
            </div>
            
            <h2>Registered Personnel</h2>
            <table>
                <tr><th>ID</th><th>Officer ID</th><th>Role</th><th>Password Hash (Scrypt)</th></tr>
    """
    for u in users:
        html += f"<tr><td>{u.id}</td><td><b>{u.username}</b></td><td>{u.role}</td><td style='font-family: monospace; font-size: 11px; color: #94a3b8;'>{u.password_hash}</td></tr>"
    html += "</table><h2>Live Incident Logs</h2><table><tr><th>ID</th><th>Timestamp</th><th>Type</th><th>Sector</th><th>Severity</th></tr>"
    for inc in incidents:
        html += f"<tr><td>INC-{1000+inc.id}</td><td>{inc.timestamp}</td><td>{inc.type}</td><td>{inc.sector}</td><td>{inc.severity}</td></tr>"
    html += "</table></body></html>"
    return html

# ═══════════════════════════════════════════
#  AI CHATBOT ENGINE
# ═══════════════════════════════════════════

@app.route('/api/chat', methods=['POST'])
def chat_with_ai():
    data = request.json
    query = data.get("query", "").lower()
    recent = Incident.query.order_by(Incident.timestamp.desc()).first()
    if recent:
        response_text = f"System online. Latest scan in {recent.sector} shows a {recent.type} alert. Status: {recent.severity}."
    else:
        response_text = "All systems green. No active threats detected in Sector 7."
    return jsonify({"response": response_text, "timestamp": datetime.utcnow().isoformat()})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
