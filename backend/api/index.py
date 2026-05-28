"""
TRINETRA RAKSHAK — Backend API v6.0
त्रिनेत्र रक्षक Command Center Backend
Fixes: PostgreSQL persistence, multi-recipient email alerts, alert_recipients table
"""

from flask import Flask, request, jsonify, redirect, render_template_string
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail, Message
import sys
import os
import random
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash

# Path adjustment for Vercel and local modules
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from logic.fuzzy_engine import ReasoningEngine
from logic.threat_predictor import ThreatPredictor
from models import db, Incident, User, LoginAudit

app = Flask(__name__)
CORS(app, origins=[
    "https://commandcenter-seven.vercel.app",
    "http://localhost:5173",
    "https://trinetra-rakshak-ssd.vercel.app"
])

# ═══════════════════════════════════════════
#  DATABASE CONFIGURATION (PostgreSQL-first)
# ═══════════════════════════════════════════
db_url = os.environ.get('DATABASE_URL') or os.environ.get('POSTGRES_URL') or os.environ.get('DB_URL')

if db_url:
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "pool_size": 5,
        "max_overflow": 2
    }
    DB_TYPE = "PostgreSQL"
else:
    is_vercel = os.environ.get('VERCEL', False)
    if is_vercel:
        db_path = os.path.join('/tmp', 'trinetra.db')
        source_db_path = os.path.join(parent_dir, 'trinetra.db')
        if not os.path.exists(db_path) and os.path.exists(source_db_path):
            import shutil
            shutil.copy2(source_db_path, db_path)
    else:
        db_path = os.path.join(parent_dir, 'trinetra.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + db_path
    DB_TYPE = "SQLite"

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'trinetra-rakshak-secret-2026')

# ═══════════════════════════════════════════
#  FLASK-MAIL CONFIGURATION
# ═══════════════════════════════════════════
app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'True').lower() == 'true'
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME', '')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD', '')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_USERNAME', 'trinetra@defense.gov.in')

mail = Mail(app)

db.init_app(app)

# ═══════════════════════════════════════════
#  ALERT RECIPIENTS MODEL (inline addition)
# ═══════════════════════════════════════════
class AlertRecipient(db.Model):
    __tablename__ = 'alert_recipients'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), nullable=False, unique=True)
    role = db.Column(db.String(50), default='Officer')
    phone = db.Column(db.String(20), nullable=True)
    active = db.Column(db.Boolean, default=True)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'phone': self.phone,
            'active': self.active,
            'added_at': self.added_at.isoformat() if self.added_at else None
        }


# Central Logic Engine reference
ai_engine = ReasoningEngine()
threat_engine = ThreatPredictor()

# Create DB tables and seed default recipient
with app.app_context():
    db.create_all()
    # Seed default admin recipient if none exist
    if AlertRecipient.query.count() == 0:
        seed = AlertRecipient(
            name='Drishti Admin',
            email='drishti@example.com',
            role='Admin',
            phone='+91-9999999999',
            active=True
        )
        db.session.add(seed)
        db.session.commit()


# ═══════════════════════════════════════════
#  HTML EMAIL TEMPLATE
# ═══════════════════════════════════════════
def build_alert_email(incident_data):
    severity = incident_data.get('severity', 'WARNING')
    severity_color = '#FF3B30' if severity == 'CRITICAL' else '#FF9500' if severity == 'WARNING' else '#00D4AA'
    timestamp = incident_data.get('timestamp', datetime.utcnow().isoformat())
    sector = incident_data.get('sector', 'UNKNOWN')
    inc_type = incident_data.get('type', 'UNKNOWN')
    inc_id = incident_data.get('id', 'N/A')
    risk_score = incident_data.get('risk_score', 'N/A')
    description = incident_data.get('description', '')

    html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Trinetra Alert</title></head>
<body style="margin:0;padding:0;background:#0A1628;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A1628;padding:20px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#0F1F3D;border-radius:12px;overflow:hidden;border:1px solid rgba(255,107,53,0.3);">
        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#FF6B35,#FF8C00);padding:24px 32px;text-align:center;">
            <div style="font-size:28px;margin-bottom:4px;">🛡️</div>
            <div style="font-size:22px;font-weight:700;color:#fff;letter-spacing:3px;">TRINETRA RAKSHAK</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.8);letter-spacing:4px;margin-top:4px;">त्रिनेत्र रक्षक — AI DEFENSE SURVEILLANCE</div>
          </td>
        </tr>
        <!-- ALERT BADGE -->
        <tr>
          <td style="padding:24px 32px 16px;text-align:center;">
            <div style="display:inline-block;background:{severity_color}22;border:2px solid {severity_color};border-radius:8px;padding:10px 28px;">
              <span style="color:{severity_color};font-size:18px;font-weight:700;letter-spacing:3px;">🚨 {severity} ALERT</span>
            </div>
          </td>
        </tr>
        <!-- INCIDENT TABLE -->
        <tr>
          <td style="padding:0 32px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:8px;overflow:hidden;">
              <tr style="background:rgba(255,107,53,0.15);">
                <td colspan="2" style="padding:10px 16px;color:#FF6B35;font-size:11px;font-weight:700;letter-spacing:2px;border-bottom:1px solid rgba(255,107,53,0.2);">INCIDENT DETAILS</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
                <td style="padding:10px 16px;color:#8FA8C8;font-size:12px;width:40%;">Incident ID</td>
                <td style="padding:10px 16px;color:#F0F4FF;font-size:12px;font-weight:600;">#{inc_id}</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02);">
                <td style="padding:10px 16px;color:#8FA8C8;font-size:12px;">Incident Type</td>
                <td style="padding:10px 16px;color:#F0F4FF;font-size:12px;font-weight:600;">{inc_type}</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
                <td style="padding:10px 16px;color:#8FA8C8;font-size:12px;">Sector</td>
                <td style="padding:10px 16px;color:#FFD700;font-size:12px;font-weight:600;">{sector}</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02);">
                <td style="padding:10px 16px;color:#8FA8C8;font-size:12px;">Severity</td>
                <td style="padding:10px 16px;font-size:12px;font-weight:700;color:{severity_color};">{severity}</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
                <td style="padding:10px 16px;color:#8FA8C8;font-size:12px;">Timestamp (UTC)</td>
                <td style="padding:10px 16px;color:#F0F4FF;font-size:12px;">{timestamp}</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02);">
                <td style="padding:10px 16px;color:#8FA8C8;font-size:12px;">Risk Score</td>
                <td style="padding:10px 16px;color:{severity_color};font-size:14px;font-weight:700;">{risk_score}/100</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;color:#8FA8C8;font-size:12px;">Description</td>
                <td style="padding:10px 16px;color:#F0F4FF;font-size:12px;">{description}</td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- ACTION -->
        <tr>
          <td style="padding:0 32px 24px;text-align:center;">
            <a href="https://commandcenter-seven.vercel.app" style="display:inline-block;background:linear-gradient(135deg,#FF6B35,#FF8C00);color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:700;font-size:13px;letter-spacing:2px;">
              → OPEN COMMAND CENTER
            </a>
          </td>
        </tr>
        <!-- FOOTER -->
        <tr>
          <td style="background:rgba(0,0,0,0.3);padding:16px 32px;text-align:center;border-top:1px solid rgba(255,107,53,0.1);">
            <div style="color:#8FA8C8;font-size:10px;letter-spacing:1px;">Automated alert from Trinetra Command Center | Do not reply</div>
            <div style="color:#8FA8C8;font-size:10px;margin-top:4px;">Ministry of Defence — Bharat | Classification: RESTRICTED</div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
"""
    return html


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


@app.route('/api/log_login', methods=['POST'])
def log_login():
    data = request.json
    try:
        new_login = LoginAudit(
            officer_id=data.get('officer_id', 'UNKNOWN'),
            ip=data.get('ip', '0.0.0.0')
        )
        db.session.add(new_login)
        db.session.commit()
        return jsonify({"status": "success"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


# ═══════════════════════════════════════════
#  DASHBOARD ENDPOINTS
# ═══════════════════════════════════════════

@app.route('/api/status', methods=['GET'])
def get_system_status():
    return jsonify({
        "status": "ONLINE",
        "system": "Trinetra Rakshak API v6.0",
        "db_type": DB_TYPE,
        "sensors": ["Border-Sentry", "Geo-Eye", "Track-Guard", "Wildlife-Scan"],
        "uptime": f"{random.randint(24, 720)}h",
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


@app.route('/api/incidents', methods=['POST'])
def create_incident():
    data = request.json
    try:
        incident = Incident(
            type=data.get('type', 'INTRUSION'),
            sector=data.get('sector', 'SEC-7'),
            severity=data.get('severity', 'WARNING'),
            description=data.get('description', 'Automated detection'),
            status=data.get('status', 'ACTIVE'),
            risk_score=data.get('risk_score', random.randint(40, 95))
        )
        db.session.add(incident)
        db.session.commit()

        # Auto-send alert email for CRITICAL incidents
        if incident.severity == 'CRITICAL':
            _send_alert_emails(incident.to_dict())

        return jsonify({"status": "success", "incident": incident.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


# ═══════════════════════════════════════════
#  ALERT RECIPIENTS ENDPOINTS
# ═══════════════════════════════════════════

@app.route('/api/recipients', methods=['GET'])
def get_recipients():
    recipients = AlertRecipient.query.filter_by(active=True).all()
    return jsonify({
        "recipients": [r.to_dict() for r in recipients],
        "total": len(recipients)
    })


@app.route('/api/recipients', methods=['POST'])
def add_recipient():
    data = request.json
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    role = data.get('role', 'Officer').strip()
    phone = data.get('phone', '').strip()

    if not name or not email:
        return jsonify({"status": "error", "message": "Name and email are required."}), 400

    existing = AlertRecipient.query.filter_by(email=email).first()
    if existing:
        existing.active = True
        existing.name = name
        existing.role = role
        existing.phone = phone
        db.session.commit()
        return jsonify({"status": "success", "message": "Recipient updated.", "recipient": existing.to_dict()})

    new_recipient = AlertRecipient(name=name, email=email, role=role, phone=phone, active=True)
    try:
        db.session.add(new_recipient)
        db.session.commit()
        return jsonify({"status": "success", "message": "Recipient added.", "recipient": new_recipient.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/recipients/<int:recipient_id>', methods=['DELETE'])
def deactivate_recipient(recipient_id):
    recipient = AlertRecipient.query.get(recipient_id)
    if not recipient:
        return jsonify({"status": "error", "message": "Recipient not found."}), 404
    recipient.active = False
    db.session.commit()
    return jsonify({"status": "success", "message": f"Recipient {recipient.email} deactivated."})


@app.route('/api/recipients/<int:recipient_id>/toggle', methods=['PATCH'])
def toggle_recipient(recipient_id):
    recipient = AlertRecipient.query.get(recipient_id)
    if not recipient:
        return jsonify({"status": "error", "message": "Recipient not found."}), 404
    recipient.active = not recipient.active
    db.session.commit()
    return jsonify({"status": "success", "recipient": recipient.to_dict()})


# ═══════════════════════════════════════════
#  EMAIL ALERT SENDING
# ═══════════════════════════════════════════

def _send_alert_emails(incident_data):
    """Internal function to send HTML alert emails to all active recipients."""
    recipients_emails = []

    # From DB
    try:
        db_recipients = AlertRecipient.query.filter_by(active=True).all()
        recipients_emails = [r.email for r in db_recipients]
    except Exception:
        pass

    # Fallback from env var
    if not recipients_emails:
        fallback = os.environ.get('ALERT_RECIPIENTS', '')
        if fallback:
            recipients_emails = [e.strip() for e in fallback.split(',') if e.strip()]

    if not recipients_emails:
        return False

    severity = incident_data.get('severity', 'WARNING')
    sector = incident_data.get('sector', 'UNKNOWN')
    timestamp = incident_data.get('timestamp', datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'))
    subject = f"🚨 TRINETRA ALERT — {severity} | Sector {sector} | {timestamp}"

    html_body = build_alert_email(incident_data)
    sent_count = 0

    for email in recipients_emails:
        try:
            msg = Message(
                subject=subject,
                recipients=[email],
                html=html_body
            )
            mail.send(msg)
            sent_count += 1
        except Exception as e:
            app.logger.error(f"Failed to send alert to {email}: {e}")

    return sent_count > 0


@app.route('/api/send-alert', methods=['POST'])
def send_alert():
    data = request.json
    incident_data = data if data else {}
    success = _send_alert_emails(incident_data)
    return jsonify({
        "status": "success" if success else "warning",
        "message": "Alerts dispatched." if success else "No recipients configured or mail not set up."
    })


@app.route('/api/send-test-alert', methods=['POST'])
def send_test_alert():
    test_incident = {
        "id": "TEST-001",
        "type": "SYSTEM TEST",
        "sector": "SEC-7",
        "severity": "WARNING",
        "timestamp": datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC'),
        "risk_score": 42,
        "description": "This is a test alert from Trinetra Command Center to verify email delivery."
    }
    success = _send_alert_emails(test_incident)
    return jsonify({
        "status": "success" if success else "error",
        "message": "Test alert sent to all active recipients." if success else "Mail configuration missing or no recipients."
    })


# ═══════════════════════════════════════════
#  AI ENGINE ENDPOINTS
# ═══════════════════════════════════════════

@app.route('/api/analyze', methods=['POST'])
def analyze():
    data = request.json
    try:
        result = ai_engine.process(data)
        threat_info = threat_engine.predict(result.get('risk_score', 50))

        # Auto-save CRITICAL incidents
        if result.get('severity') == 'CRITICAL':
            incident = Incident(
                type=data.get('type', 'INTRUSION'),
                sector=data.get('sector', 'SEC-7'),
                severity='CRITICAL',
                description=result.get('description', 'AI-detected critical threat'),
                status='ACTIVE',
                risk_score=result.get('risk_score', 85)
            )
            db.session.add(incident)
            db.session.commit()
            _send_alert_emails(incident.to_dict())

        return jsonify({
            "status": "success",
            "analysis": result,
            "threat_prediction": threat_info
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/simulate', methods=['POST'])
def simulate_detection():
    data = request.json or {}
    sector = data.get('sector', f"SEC-{random.randint(7, 10)}")
    severity_choices = ['WARNING', 'WARNING', 'CRITICAL', 'ALL-CLEAR']
    severity = random.choice(severity_choices)
    inc_types = ['PERSON', 'VEHICLE', 'DRONE', 'WILDLIFE']
    inc_type = data.get('type', random.choice(inc_types))
    risk_score = random.randint(60, 95) if severity == 'CRITICAL' else random.randint(20, 60)

    description_map = {
        'PERSON': f"Unauthorized personnel detected near perimeter fence in {sector}",
        'VEHICLE': f"Unregistered vehicle approaching restricted zone in {sector}",
        'DRONE': f"Unknown aerial object detected at low altitude over {sector}",
        'WILDLIFE': f"Large wildlife on patrol route detected near {sector}"
    }

    incident = Incident(
        type=inc_type,
        sector=sector,
        severity=severity,
        description=description_map.get(inc_type, f"AI-detected anomaly in {sector}"),
        status='ACTIVE',
        risk_score=risk_score
    )
    db.session.add(incident)
    db.session.commit()

    if severity == 'CRITICAL':
        _send_alert_emails(incident.to_dict())

    return jsonify({
        "status": "success",
        "incident": incident.to_dict(),
        "message": f"Simulated {inc_type} detection in {sector}"
    })


@app.route('/api/geo-eye', methods=['GET'])
def geo_eye():
    sectors = ['DHANBAD MINING ZONE', 'BOKARO CORRIDOR', 'RAMGARH BELT', 'HAZARIBAGH SECTOR']
    alerts = []
    for sector in sectors:
        if random.random() > 0.6:
            alerts.append({
                "sector": sector,
                "activity": random.choice(["ILLEGAL EXCAVATION", "HEAVY MACHINERY", "EXPLOSIVE SIGNATURES", "NIGHT OPERATIONS"]),
                "confidence": round(random.uniform(0.65, 0.97), 2),
                "coordinates": f"{round(23.5 + random.random() * 0.3, 4)}°N, {round(85.2 + random.random() * 0.4, 4)}°E",
                "timestamp": datetime.utcnow().isoformat()
            })
    return jsonify({"alerts": alerts, "scan_time": datetime.utcnow().isoformat(), "satellites_active": random.randint(3, 6)})


@app.route('/api/border-sentry', methods=['GET'])
def border_sentry():
    sectors = ['SEC-7', 'SEC-7A', 'SEC-7B', 'SEC-7C']
    detections = []
    for s in sectors:
        if random.random() > 0.5:
            detections.append({
                "sector": s,
                "type": random.choice(["PERSON", "VEHICLE", "DRONE"]),
                "confidence": round(random.uniform(0.7, 0.98), 2),
                "risk_score": random.randint(40, 95),
                "distance_m": random.randint(50, 500)
            })
    return jsonify({
        "detections": detections,
        "sensors_online": 24,
        "coverage_km": 12.4,
        "last_scan": datetime.utcnow().isoformat()
    })


@app.route('/api/track-guard', methods=['GET'])
def track_guard():
    return jsonify({
        "status": "ACTIVE",
        "trains_monitored": random.randint(8, 15),
        "wildlife_detections_today": random.randint(0, 4),
        "track_segments": ["KM-140", "KM-141", "KM-142", "KM-143", "KM-144"],
        "last_detection": "Wild Elephant — KM-142 (Cleared)",
        "system_health": "OPTIMAL"
    })


# ═══════════════════════════════════════════
#  SIMULATION ENDPOINTS
# ═══════════════════════════════════════════

@app.route('/api/simulation/start', methods=['POST'])
def start_simulation():
    data = request.json or {}
    scenario = data.get('scenario', 'BORDER_INTRUSION')

    scenarios = {
        'BORDER_INTRUSION': [
            {'type': 'PERSON', 'sector': 'SEC-7A', 'severity': 'WARNING', 'risk_score': 55,
             'description': 'Unidentified individual approaching perimeter at KM-142'},
            {'type': 'PERSON', 'sector': 'SEC-7A', 'severity': 'CRITICAL', 'risk_score': 87,
             'description': 'Multi-target intrusion — armed personnel detected at border fence SEC-7A'},
        ],
        'DRONE_ALERT': [
            {'type': 'DRONE', 'sector': 'SEC-7B', 'severity': 'WARNING', 'risk_score': 61,
             'description': 'Unregistered quadcopter detected at 80m altitude'},
            {'type': 'DRONE', 'sector': 'SEC-7B', 'severity': 'CRITICAL', 'risk_score': 92,
             'description': 'Armed drone with payload detected — engagement protocol initiated'},
        ]
    }

    events = scenarios.get(scenario, scenarios['BORDER_INTRUSION'])
    created = []
    for event in events:
        incident = Incident(**event, status='ACTIVE')
        db.session.add(incident)
        db.session.commit()
        if event['severity'] == 'CRITICAL':
            _send_alert_emails(incident.to_dict())
        created.append(incident.to_dict())

    return jsonify({"status": "success", "scenario": scenario, "incidents_created": created})


# ═══════════════════════════════════════════
#  ADMIN DB VIEWER (Complete Redesign)
# ═══════════════════════════════════════════

ADMIN_DB_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trinetra Rakshak — Command DB Viewer</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0A1628; --card: #0F1F3D; --saffron: #FF6B35; --gold: #FFD700;
      --blue: #1E88E5; --text: #F0F4FF; --muted: #8FA8C8;
      --success: #00D4AA; --warn: #FF9500; --danger: #FF3B30;
    }
    body {
      background: linear-gradient(135deg, #0A1628 0%, #0F1F3D 50%, #071020 100%);
      color: var(--text); font-family: 'Segoe UI', system-ui, sans-serif;
      min-height: 100vh; padding-bottom: 40px;
    }
    header {
      background: rgba(10,22,40,0.98); backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255,107,53,0.25);
      padding: 16px 32px; display: flex; align-items: center;
      justify-content: space-between; position: sticky; top: 0; z-index: 100;
    }
    .logo { display: flex; align-items: center; gap: 12px; }
    .logo-icon { font-size: 24px; }
    .logo-text { font-size: 18px; font-weight: 700; letter-spacing: 3px;
      background: linear-gradient(135deg,#FF6B35,#FFD700);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .logo-sub { font-size: 10px; color: var(--muted); letter-spacing: 2px; margin-top: 2px; }
    .status-bar {
      background: rgba(0,212,170,0.1); border: 1px solid rgba(0,212,170,0.3);
      border-radius: 8px; padding: 6px 14px; font-size: 11px;
      color: var(--success); letter-spacing: 1px; display: flex; align-items: center; gap: 8px;
    }
    .pulse { width: 8px; height: 8px; border-radius: 50%; background: var(--success);
      animation: pulse 1.5s ease-in-out infinite; }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
    .container { max-width: 1200px; margin: 0 auto; padding: 24px 32px; }

    /* SYSTEM STATUS BOARD */
    .system-board {
      background: rgba(255,107,53,0.08); border: 1px solid rgba(255,107,53,0.2);
      border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;
    }
    .board-title { font-size: 11px; letter-spacing: 3px; color: var(--saffron);
      font-weight: 700; margin-bottom: 16px; }
    .board-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
    .board-item { text-align: center; padding: 12px;
      background: rgba(255,255,255,0.03); border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.06); }
    .board-label { font-size: 10px; color: var(--muted); letter-spacing: 1px; margin-bottom: 6px; }
    .board-value { font-size: 16px; font-weight: 700; }
    .val-green { color: var(--success); }
    .val-gold { color: var(--gold); }
    .val-saffron { color: var(--saffron); }

    /* PERSISTENT DB BANNER */
    .persistent-banner {
      background: rgba(0,212,170,0.1); border: 1px solid rgba(0,212,170,0.3);
      border-radius: 10px; padding: 14px 20px; margin-bottom: 24px;
      display: flex; align-items: center; gap: 12px;
      font-size: 13px; color: var(--success);
    }
    .persistent-banner .icon { font-size: 20px; }

    /* SECTION */
    .section { margin-bottom: 28px; }
    .section-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 14px;
    }
    .section-title { font-size: 12px; letter-spacing: 3px; color: var(--saffron);
      font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .count-badge {
      background: rgba(255,107,53,0.2); border: 1px solid rgba(255,107,53,0.4);
      border-radius: 20px; padding: 2px 10px; font-size: 11px; color: var(--saffron);
    }

    /* TABLE */
    .table-wrap { border-radius: 10px; overflow: hidden;
      border: 1px solid rgba(255,107,53,0.15); }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: rgba(255,107,53,0.12); }
    thead th { padding: 10px 14px; text-align: left; font-size: 10px;
      letter-spacing: 2px; color: var(--saffron); font-weight: 700; }
    tbody tr { border-top: 1px solid rgba(255,255,255,0.05);
      transition: background 0.2s; }
    tbody tr:hover { background: rgba(255,107,53,0.06); }
    tbody tr:nth-child(even) { background: rgba(255,255,255,0.02); }
    tbody tr:nth-child(even):hover { background: rgba(255,107,53,0.06); }
    td { padding: 10px 14px; font-size: 12px; color: var(--text); }
    td.mono { font-family: 'Courier New', monospace; font-size: 11px; color: var(--muted); }
    .no-data { text-align: center; padding: 32px; color: var(--muted); font-size: 13px; }

    /* BADGES */
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px;
      font-size: 10px; font-weight: 700; letter-spacing: 1px; }
    .badge-critical { background: rgba(255,59,48,0.15); color: #FF3B30;
      border: 1px solid rgba(255,59,48,0.4); }
    .badge-warning { background: rgba(255,149,0,0.15); color: #FF9500;
      border: 1px solid rgba(255,149,0,0.4); }
    .badge-safe { background: rgba(0,212,170,0.12); color: var(--success);
      border: 1px solid rgba(0,212,170,0.3); }
    .badge-active { background: rgba(0,212,170,0.12); color: var(--success);
      border: 1px solid rgba(0,212,170,0.3); }
    .badge-inactive { background: rgba(255,59,48,0.1); color: #FF3B30;
      border: 1px solid rgba(255,59,48,0.3); }

    /* HASH reveal */
    .hash-text { max-width: 150px; overflow: hidden; text-overflow: ellipsis;
      white-space: nowrap; display: inline-block; vertical-align: middle; }
    .reveal-btn { background: none; border: 1px solid rgba(30,136,229,0.4);
      color: #1E88E5; border-radius: 4px; padding: 2px 8px; font-size: 10px;
      cursor: pointer; margin-left: 4px; }
    .reveal-btn:hover { background: rgba(30,136,229,0.15); }

    /* QUICK ACTIONS */
    .quick-actions {
      background: var(--card); border: 1px solid rgba(255,107,53,0.15);
      border-radius: 12px; padding: 20px 24px;
    }
    .action-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 14px; }
    .action-btn {
      padding: 12px 16px; border-radius: 8px; border: none; cursor: pointer;
      font-size: 12px; font-weight: 600; letter-spacing: 1px; transition: all 0.2s;
      display: flex; align-items: center; gap: 8px;
    }
    .action-btn:hover { transform: translateY(-2px); }
    .btn-warn { background: rgba(255,149,0,0.15); color: var(--warn);
      border: 1px solid rgba(255,149,0,0.4); }
    .btn-blue { background: rgba(30,136,229,0.15); color: var(--blue);
      border: 1px solid rgba(30,136,229,0.4); }
    .btn-saffron { background: linear-gradient(135deg,#FF6B35,#FF8C00);
      color: #fff; box-shadow: 0 4px 15px rgba(255,107,53,0.3); }
    .btn-saffron:hover { box-shadow: 0 6px 20px rgba(255,107,53,0.5); }

    /* REFRESH */
    .refresh-bar { text-align: right; color: var(--muted); font-size: 11px;
      margin-bottom: 8px; }

    @media (max-width: 600px) {
      header { padding: 12px 16px; }
      .container { padding: 16px; }
      .board-grid { grid-template-columns: repeat(2, 1fr); }
    }
  </style>
</head>
<body>
  <header>
    <div class="logo">
      <span class="logo-icon">🛡️</span>
      <div>
        <div class="logo-text">TRINETRA RAKSHAK</div>
        <div class="logo-sub">त्रिनेत्र रक्षक — COMMAND DATABASE VIEWER</div>
      </div>
    </div>
    <div class="status-bar">
      <div class="pulse"></div>
      SYSTEM ONLINE | DB: {{ db_type }}
    </div>
  </header>

  <div class="container">
    <div class="refresh-bar" id="refresh-counter">Auto-refresh in <span id="countdown">30</span>s</div>

    <!-- PERSISTENT DB BANNER -->
    {% if db_type == 'PostgreSQL' %}
    <div class="persistent-banner">
      <span class="icon">✅</span>
      <div>
        <strong>PERSISTENT DATABASE</strong> — Data syncs across all users and sessions in real-time.
        Connected to PostgreSQL cloud database. Data is permanent and globally consistent.
      </div>
    </div>
    {% else %}
    <div class="persistent-banner" style="background:rgba(255,149,0,0.1);border-color:rgba(255,149,0,0.3);color:var(--warn);">
      <span class="icon">⚠️</span>
      <div>
        <strong>DEVELOPMENT MODE</strong> — Using SQLite (local/ephemeral). 
        Set DATABASE_URL environment variable for persistent PostgreSQL storage.
      </div>
    </div>
    {% endif %}

    <!-- SYSTEM STATUS BOARD -->
    <div class="system-board">
      <div class="board-title">SYSTEM STATUS BOARD</div>
      <div class="board-grid">
        <div class="board-item">
          <div class="board-label">DATABASE TYPE</div>
          <div class="board-value val-gold">{{ db_type }}</div>
        </div>
        <div class="board-item">
          <div class="board-label">CONNECTION</div>
          <div class="board-value val-green">LIVE</div>
        </div>
        <div class="board-item">
          <div class="board-label">REGISTERED OFFICERS</div>
          <div class="board-value val-saffron">{{ user_count }}</div>
        </div>
        <div class="board-item">
          <div class="board-label">TOTAL INCIDENTS</div>
          <div class="board-value val-saffron">{{ incident_count }}</div>
        </div>
        <div class="board-item">
          <div class="board-label">ALERT RECIPIENTS</div>
          <div class="board-value val-green">{{ recipient_count }}</div>
        </div>
        <div class="board-item">
          <div class="board-label">LAST LOGIN</div>
          <div class="board-value" style="font-size:11px;color:var(--muted);">{{ last_login }}</div>
        </div>
      </div>
    </div>

    <!-- REGISTERED PERSONNEL -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">👮 REGISTERED PERSONNEL
          <span class="count-badge">{{ users|length }}</span>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>OFFICER ID</th><th>ROLE</th><th>PASSWORD HASH</th>
            </tr>
          </thead>
          <tbody>
            {% for u in users %}
            <tr>
              <td class="mono">{{ u.id }}</td>
              <td><strong>{{ u.username }}</strong></td>
              <td><span class="badge badge-safe">{{ u.role }}</span></td>
              <td class="mono">
                <span class="hash-text" id="hash-{{ u.id }}">••••••••••••••••</span>
                <button class="reveal-btn" onclick="toggleHash('{{ u.id }}', '{{ u.password_hash }}')">REVEAL</button>
              </td>
            </tr>
            {% else %}
            <tr><td colspan="4" class="no-data">No officers registered</td></tr>
            {% endfor %}
          </tbody>
        </table>
      </div>
    </div>

    <!-- INCIDENTS -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">🚨 LIVE INCIDENTS
          <span class="count-badge">{{ incidents|length }}</span>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>TIMESTAMP</th><th>TYPE</th><th>SECTOR</th>
              <th>SEVERITY</th><th>RISK SCORE</th><th>STATUS</th><th>DESCRIPTION</th>
            </tr>
          </thead>
          <tbody>
            {% for inc in incidents %}
            <tr>
              <td class="mono">#{{ inc.id }}</td>
              <td class="mono" style="white-space:nowrap;">{{ inc.timestamp.strftime('%Y-%m-%d %H:%M') if inc.timestamp else 'N/A' }}</td>
              <td>{{ inc.type }}</td>
              <td style="color: var(--gold); font-weight:600;">{{ inc.sector }}</td>
              <td>
                {% if inc.severity == 'CRITICAL' %}
                  <span class="badge badge-critical">CRITICAL</span>
                {% elif inc.severity == 'WARNING' %}
                  <span class="badge badge-warning">WARNING</span>
                {% else %}
                  <span class="badge badge-safe">{{ inc.severity }}</span>
                {% endif %}
              </td>
              <td style="font-weight:700;color:{% if inc.risk_score >= 75 %}#FF3B30{% elif inc.risk_score >= 50 %}#FF9500{% else %}#00D4AA{% endif %};">
                {{ inc.risk_score }}/100
              </td>
              <td><span class="badge badge-active">{{ inc.status }}</span></td>
              <td style="font-size:11px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ inc.description }}</td>
            </tr>
            {% else %}
            <tr><td colspan="8" class="no-data">No incidents recorded</td></tr>
            {% endfor %}
          </tbody>
        </table>
      </div>
    </div>

    <!-- ALERT RECIPIENTS -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">📧 ALERT RECIPIENTS
          <span class="count-badge">{{ recipients|length }}</span>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>NAME</th><th>EMAIL</th><th>ROLE</th>
              <th>PHONE</th><th>STATUS</th><th>ADDED</th>
            </tr>
          </thead>
          <tbody>
            {% for r in recipients %}
            <tr>
              <td class="mono">{{ r.id }}</td>
              <td><strong>{{ r.name }}</strong></td>
              <td class="mono">{{ r.email }}</td>
              <td><span class="badge badge-safe">{{ r.role }}</span></td>
              <td class="mono">{{ r.phone or '—' }}</td>
              <td>
                {% if r.active %}
                  <span class="badge badge-active">ACTIVE</span>
                {% else %}
                  <span class="badge badge-inactive">INACTIVE</span>
                {% endif %}
              </td>
              <td class="mono">{{ r.added_at.strftime('%Y-%m-%d') if r.added_at else 'N/A' }}</td>
            </tr>
            {% else %}
            <tr><td colspan="7" class="no-data">No alert recipients configured</td></tr>
            {% endfor %}
          </tbody>
        </table>
      </div>
    </div>

    <!-- LOGIN AUDIT -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">📋 LOGIN AUDIT TRAIL
          <span class="count-badge">{{ audits|length }}</span>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>ID</th><th>OFFICER ID</th><th>IP ADDRESS</th><th>TIMESTAMP</th></tr>
          </thead>
          <tbody>
            {% for a in audits %}
            <tr>
              <td class="mono">{{ a.id }}</td>
              <td><strong>{{ a.officer_id }}</strong></td>
              <td class="mono">{{ a.ip }}</td>
              <td class="mono">{{ a.timestamp.strftime('%Y-%m-%d %H:%M:%S') if a.timestamp else 'N/A' }}</td>
            </tr>
            {% else %}
            <tr><td colspan="4" class="no-data">No login records</td></tr>
            {% endfor %}
          </tbody>
        </table>
      </div>
    </div>

    <!-- QUICK ACTIONS -->
    <div class="quick-actions">
      <div class="section-title">⚡ QUICK ACTIONS</div>
      <div class="action-grid" style="margin-top:16px;">
        <button class="action-btn btn-warn" onclick="clearOldIncidents()">
          🗑️ Clear Incidents (&gt;7 days)
        </button>
        <button class="action-btn btn-blue" onclick="exportJSON()">
          📥 Export All Data as JSON
        </button>
        <button class="action-btn btn-saffron" onclick="sendTestAlert()">
          📧 Send Test Alert to All
        </button>
      </div>
      <div id="action-result" style="margin-top:12px;font-size:12px;color:var(--success);display:none;"></div>
    </div>
  </div>

  <script>
    // Hash reveal toggle
    const hashData = {};
    function toggleHash(id, hash) {
      const el = document.getElementById('hash-' + id);
      const btn = el.nextElementSibling;
      if (hashData[id]) {
        el.textContent = '••••••••••••••••';
        btn.textContent = 'REVEAL';
        hashData[id] = false;
      } else {
        el.textContent = hash;
        btn.textContent = 'HIDE';
        hashData[id] = true;
      }
    }

    // Countdown and auto-refresh
    let countdown = 30;
    const countEl = document.getElementById('countdown');
    setInterval(() => {
      countdown--;
      if (countdown <= 0) { location.reload(); }
      else { countEl.textContent = countdown; }
    }, 1000);

    // Quick actions
    async function showResult(msg, ok) {
      const el = document.getElementById('action-result');
      el.style.display = 'block';
      el.style.color = ok ? 'var(--success)' : 'var(--warn)';
      el.textContent = msg;
      setTimeout(() => { el.style.display = 'none'; }, 5000);
    }

    async function clearOldIncidents() {
      if (!confirm('Clear all incidents older than 7 days?')) return;
      const res = await fetch('/api/clear-old-incidents', { method: 'POST' });
      const data = await res.json();
      showResult(data.message, res.ok);
      setTimeout(() => location.reload(), 2000);
    }

    async function exportJSON() {
      window.open('/api/export-data', '_blank');
    }

    async function sendTestAlert() {
      const res = await fetch('/api/send-test-alert', { method: 'POST' });
      const data = await res.json();
      showResult(data.message, data.status === 'success');
    }
  </script>
</body>
</html>"""


@app.route('/admin/db')
def admin_db():
    users = User.query.all()
    incidents = Incident.query.order_by(Incident.timestamp.desc()).limit(50).all()
    recipients = AlertRecipient.query.order_by(AlertRecipient.added_at.desc()).all()
    audits = []
    try:
        audits = LoginAudit.query.order_by(LoginAudit.timestamp.desc()).limit(30).all()
    except Exception:
        pass

    last_login = "N/A"
    if audits:
        try:
            last_login = audits[0].timestamp.strftime('%Y-%m-%d %H:%M') if audits[0].timestamp else "N/A"
        except Exception:
            pass

    return render_template_string(
        ADMIN_DB_HTML,
        users=users,
        incidents=incidents,
        recipients=recipients,
        audits=audits,
        db_type=DB_TYPE,
        user_count=len(users),
        incident_count=len(incidents),
        recipient_count=len([r for r in recipients if r.active]),
        last_login=last_login
    )


@app.route('/api/clear-old-incidents', methods=['POST'])
def clear_old_incidents():
    cutoff = datetime.utcnow() - timedelta(days=7)
    deleted = Incident.query.filter(Incident.timestamp < cutoff).delete()
    db.session.commit()
    return jsonify({"status": "success", "message": f"Cleared {deleted} incidents older than 7 days."})


@app.route('/api/export-data', methods=['GET'])
def export_data():
    users = [{'id': u.id, 'username': u.username, 'role': u.role} for u in User.query.all()]
    incidents = [inc.to_dict() for inc in Incident.query.all()]
    recipients = [r.to_dict() for r in AlertRecipient.query.all()]
    return jsonify({
        "export_timestamp": datetime.utcnow().isoformat(),
        "users": users,
        "incidents": incidents,
        "alert_recipients": recipients
    })


# ═══════════════════════════════════════════
#  HEALTH CHECK
# ═══════════════════════════════════════════

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "db": DB_TYPE,
        "timestamp": datetime.utcnow().isoformat()
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)
