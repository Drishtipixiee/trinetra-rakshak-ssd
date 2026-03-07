from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

import sys
import os
import random
from datetime import datetime, timedelta

# Append the current dir to resolve modules easily 
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from logic.fuzzy_engine import ReasoningEngine
from logic.threat_predictor import ThreatPredictor
from fpdf import FPDF

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Central Logic Engine reference
ai_engine = ReasoningEngine()
threat_engine = ThreatPredictor()


# ═══════════════════════════════════════════
#  EXISTING ENDPOINTS
# ═══════════════════════════════════════════

@app.route('/api/status', methods=['GET'])
def get_system_status():
    """ Heartbeat for the Command Center. """
    return jsonify({
        "status": "ONLINE",
        "system": "Trinetra Rakshak API v5.0",
        "sensors": ["Border-Sentry", "Geo-Eye", "Track-Guard"],
        "uptime": f"{random.randint(24,720)}h",
        "cctv_feeds": 4,
        "personnel_active": 5
    })


@app.route('/api/evaluate_threat', methods=['POST'])
def check_threat():
    """ Evaluate raw sensor parameters, return fuzzy Risk Score + XAI string. """
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
    """ Generates an actionable PDF Incident Report. """
    data = request.json
    threat_info = data.get("threat_info", "Unknown Threat")
    sector = data.get("sector", "SEC-UNKNOWN")
    risk_score = data.get("risk_score", 0)
    gps_coords = data.get("gps", "Lat: 28.6139, Lon: 77.2090")
    
    pdf = FPDF()
    pdf.add_page()
    
    # Header
    pdf.set_font("Arial", 'B', 14)
    pdf.cell(0, 10, "CONFIDENTIAL - MINISTRY OF DEFENCE", ln=True, align='C')
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(0, 10, "TRINETRA RAKSHAK - INCIDENT REPORT", ln=True, align='C')
    pdf.ln(5)
    
    pdf.set_font("Arial", size=12)
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S IST")
    
    pdf.cell(0, 10, f"Report ID: TR-{int(datetime.now().timestamp())}", ln=True)
    pdf.cell(0, 10, f"Timestamp: {timestamp}", ln=True)
    pdf.cell(0, 10, f"Sector ID: {sector}", ln=True)
    pdf.cell(0, 10, f"GPS Coordinates: {gps_coords}", ln=True)
    pdf.cell(0, 10, f"Fuzzy Risk Score: {risk_score}%", ln=True)
    pdf.cell(0, 10, f"Threat Classification: {threat_info}", ln=True)
    pdf.cell(0, 10, f"Reporting Officer: Maj. Rajesh Sharma (SEC-7)", ln=True)
    
    pdf.ln(10)
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(0, 10, "RECOMMENDED ACTIONS:", ln=True)
    pdf.set_font("Arial", size=11)
    
    if risk_score >= 70:
        pdf.multi_cell(0, 8, "1. Immediate field deployment of Quick Reaction Force (QRF)\n2. Activate sector-wide lockdown protocol\n3. Notify Regional Commander for escalation\n4. Preserve all CCTV footage for evidence")
    elif risk_score >= 40:
        pdf.multi_cell(0, 8, "1. Increase patrol frequency in affected sector\n2. Enable enhanced surveillance mode\n3. Brief all personnel on watch about potential threat\n4. Prepare QRF for standby deployment")
    else:
        pdf.multi_cell(0, 8, "1. Continue routine surveillance operations\n2. Log incident for trend analysis\n3. No immediate action required")
    
    pdf.ln(10)
    pdf.set_font("Arial", 'I', 9)
    pdf.multi_cell(0, 8, "This is an automatically generated dispatch report by the Trinetra Rakshak Integrated Command & Control Surveillance System. Classified document - unauthorized distribution prohibited.")
    
    pdf_filename = f"report_{sector}_{int(datetime.now().timestamp())}.pdf"
    file_path = os.path.join(os.path.dirname(__file__), pdf_filename)
    pdf.output(file_path)
    
    return send_file(file_path, as_attachment=True, download_name=pdf_filename)


# ═══════════════════════════════════════════
#  NEW v5.0 ENDPOINTS
# ═══════════════════════════════════════════

@app.route('/api/system_vitals', methods=['GET'])
def get_system_vitals():
    """ Returns simulated system health data. """
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
    """ Returns mock incident history for the last 24 hours. """
    incidents = []
    base_time = datetime.now()
    
    incident_templates = [
        {"type": "INTRUSION", "sector": "SEC-7A", "severity": "CRITICAL", "description": "Unauthorized human movement detected at perimeter fence"},
        {"type": "WILDLIFE", "sector": "TRK-2", "severity": "WARNING", "description": "Wild elephant detected on railway track near KM 142"},
        {"type": "MINING", "sector": "GEO-3", "severity": "WARNING", "description": "Terrain change detected — suspected illegal mining activity"},
        {"type": "UAV", "sector": "SEC-7B", "severity": "CRITICAL", "description": "Unidentified aerial vehicle in restricted airspace"},
        {"type": "VEHICLE", "sector": "SEC-7A", "severity": "WARNING", "description": "Suspicious vehicle approaching checkpoint at high speed"},
        {"type": "SYSTEM", "sector": "SYS", "severity": "NORMAL", "description": "Routine system diagnostic completed"},
        {"type": "PATROL", "sector": "SEC-7C", "severity": "NORMAL", "description": "Patrol unit check-in — all clear"},
        {"type": "SENSOR", "sector": "SEC-7D", "severity": "WARNING", "description": "Motion sensor triggered — false alarm (animal)"},
    ]
    
    for i in range(min(20, len(incident_templates) * 3)):
        template = random.choice(incident_templates)
        time_offset = timedelta(minutes=random.randint(5, 1440))
        incidents.append({
            "id": f"INC-{1000 + i}",
            "timestamp": (base_time - time_offset).strftime("%Y-%m-%d %H:%M:%S"),
            "type": template["type"],
            "sector": template["sector"],
            "severity": template["severity"],
            "description": template["description"],
            "status": random.choice(["RESOLVED", "PENDING", "INVESTIGATING"]),
            "responding_officer": random.choice([
                "Maj. Rajesh Sharma", "Sub. Vikram Singh", "Hav. Pradeep Kumar",
                "Sep. Amit Yadav", "NK. Suresh Rathore"
            ])
        })
    
    incidents.sort(key=lambda x: x["timestamp"], reverse=True)
    return jsonify({"incidents": incidents, "total": len(incidents)})


@app.route('/api/personnel', methods=['GET'])
def get_personnel():
    """ Returns duty roster with Indian military names and designations. """
    personnel = [
        {"name": "Maj. Rajesh Sharma", "rank": "SECTOR COMMANDER", "designation": "CO SEC-7", "status": "ACTIVE", "sector": "SEC-7", "contact": "FREQ-47.5MHz", "last_checkin": "2 min ago"},
        {"name": "Sub. Vikram Singh", "rank": "SUBEDAR", "designation": "WATCH OFFICER", "status": "ON PATROL", "sector": "SEC-7A", "contact": "FREQ-47.5MHz", "last_checkin": "8 min ago"},
        {"name": "Hav. Pradeep Kumar", "rank": "HAVILDAR", "designation": "SURVEILLANCE OPS", "status": "ACTIVE", "sector": "SEC-7B", "contact": "FREQ-47.5MHz", "last_checkin": "1 min ago"},
        {"name": "Sep. Amit Yadav", "rank": "SEPOY", "designation": "GATE SENTRY", "status": "ACTIVE", "sector": "SEC-7A", "contact": "FREQ-47.5MHz", "last_checkin": "Just now"},
        {"name": "Sep. Deepak Meena", "rank": "SEPOY", "designation": "PERIMETER GUARD", "status": "OFF DUTY", "sector": "SEC-7C", "contact": "N/A", "last_checkin": "45 min ago"},
        {"name": "NK. Suresh Rathore", "rank": "NAIK", "designation": "COMMS OPERATOR", "status": "ACTIVE", "sector": "SEC-7", "contact": "FREQ-47.5MHz", "last_checkin": "3 min ago"},
    ]
    
    active = sum(1 for p in personnel if p["status"] != "OFF DUTY")
    return jsonify({"personnel": personnel, "total": len(personnel), "active": active})


@app.route('/api/weather', methods=['GET'])
def get_weather():
    """ Returns simulated weather data for operational sector. """
    conditions = ["CLEAR", "OVERCAST", "LIGHT RAIN", "FOG", "STORM"]
    condition = random.choice(conditions[:3])  # Usually clear/overcast
    
    visibility_map = {"CLEAR": 95, "OVERCAST": 75, "LIGHT RAIN": 45, "FOG": 20, "STORM": 15}
    
    return jsonify({
        "condition": condition,
        "temperature_c": round(22 + random.random() * 16, 1),
        "humidity_pct": round(40 + random.random() * 45, 1),
        "wind_speed_kmh": round(5 + random.random() * 25, 1),
        "wind_direction": random.choice(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]),
        "visibility_pct": visibility_map.get(condition, 80) + round(random.random() * 10 - 5, 1),
        "sector": "SEC-7",
        "alert": condition in ["FOG", "STORM"]
    })


@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    """ Returns threat statistics and analytics data. """
    sectors = ["SEC-7A", "SEC-7B", "SEC-7C", "SEC-7D", "SEC-8A", "SEC-8B"]
    
    return jsonify({
        "threats_by_sector": [
            {"sector": s, "count": random.randint(2, 18)} for s in sectors
        ],
        "threat_classification": [
            {"type": "Human Intruder", "count": random.randint(15, 30)},
            {"type": "Vehicle", "count": random.randint(5, 15)},
            {"type": "Wildlife", "count": random.randint(10, 25)},
            {"type": "UAV/Drone", "count": random.randint(2, 10)},
            {"type": "Mining Activity", "count": random.randint(5, 15)},
        ],
        "response_time_trend": [
            {"time": f"{h:02d}:00", "avg_minutes": round(2 + random.random() * 5, 1)}
            for h in range(0, 24, 4)
        ],
        "kpi": {
            "total_alerts_24h": random.randint(30, 80),
            "avg_response_min": round(3 + random.random() * 3, 1),
            "resolution_rate_pct": round(88 + random.random() * 10, 1),
            "threat_level": random.choice(["NORMAL", "ELEVATED", "HIGH"]),
            "false_positive_rate": round(5 + random.random() * 10, 1)
        }
    })


@app.route('/api/quick_action', methods=['POST'])
def handle_quick_action():
    """ Handles emergency quick actions. """
    data = request.json
    action = data.get("action", "unknown")
    
    responses = {
        "lockdown": {
            "status": "EXECUTED",
            "message": "Facility lockdown initiated. All access points sealed. Biometric gates disabled.",
            "eta": "0 min",
            "severity": "CRITICAL"
        },
        "qrf": {
            "status": "DISPATCHED",
            "message": "Quick Reaction Force (QRF) Team Alpha dispatched to Sector 7.",
            "eta": "4 min",
            "severity": "HIGH"
        },
        "alarm": {
            "status": "ACTIVATED",
            "message": "Perimeter alarm activated across all sectors. Audio alert broadcasting.",
            "eta": "0 min",
            "severity": "HIGH"
        },
        "comms": {
            "status": "OPEN",
            "message": "Emergency channel FREQ-47.5MHz opened. All units alerted on secure line.",
            "eta": "0 min",
            "severity": "MEDIUM"
        }
    }
    
    response = responses.get(action, {
        "status": "UNKNOWN",
        "message": f"Unknown action: {action}",
        "severity": "LOW"
    })
    
    response["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S IST")
    response["action"] = action
    
    return jsonify(response)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
