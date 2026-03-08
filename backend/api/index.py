from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import os
import sys
from datetime import datetime, timedelta

# Add parent dir for local logic imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ─── Try to import fuzzy logic (graceful fallback if unavailable) ───
try:
    from logic.fuzzy_engine import ReasoningEngine
    from logic.threat_predictor import ThreatPredictor
    ai_engine = ReasoningEngine()
    threat_engine = ThreatPredictor()
    FUZZY_AVAILABLE = True
except Exception:
    FUZZY_AVAILABLE = False

# ═══════════════════════════════════════════
#  API ENDPOINTS
# ═══════════════════════════════════════════

@app.route('/api/status', methods=['GET'])
def get_system_status():
    return jsonify({
        "status": "ONLINE",
        "system": "Trinetra Rakshak API v5.3",
        "sensors": ["Border-Sentry", "Geo-Eye", "Track-Guard"],
        "uptime": f"{random.randint(24,720)}h",
        "cctv_feeds": 4,
        "personnel_active": 5,
        "fuzzy_engine": "ACTIVE" if FUZZY_AVAILABLE else "FALLBACK",
        "deployed_on": "Vercel Serverless"
    })


@app.route('/api/evaluate_threat', methods=['POST', 'OPTIONS'])
def check_threat():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    data = request.json or {}
    velocity = data.get("velocity", 0.0)
    proximity = data.get("proximity", 500.0)
    visibility = data.get("visibility", 100.0)
    sensor_type = data.get("sensor", "Border-Sentry")

    if FUZZY_AVAILABLE:
        try:
            score, xai = ai_engine.evaluate_risk(velocity, proximity, visibility)
            predicted_class = threat_engine.predict_threat_class(sensor_type, velocity, proximity)
            return jsonify({
                "risk_score": round(score, 1),
                "xai_reasoning": xai,
                "threat_class": predicted_class,
                "status": "success",
                "engine": "scikit-fuzzy"
            })
        except Exception as e:
            pass

    # Fallback: heuristic risk calculation
    base_risk = max(0, 100 - proximity * 0.2) + velocity * 0.3 + (100 - visibility) * 0.2
    risk_score = min(100, max(0, base_risk))
    status_label = "CRITICAL" if risk_score >= 70 else "WARNING" if risk_score >= 40 else "SAFE"

    return jsonify({
        "risk_score": round(risk_score, 1),
        "xai_reasoning": f"{status_label}: Velocity {velocity}km/h | Proximity {proximity}m | Visibility {visibility}%. Risk: {risk_score:.1f}%",
        "threat_class": "Human Intruder" if velocity > 10 else "Unknown",
        "status": "success",
        "engine": "heuristic-fallback"
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
    incidents = []
    base_time = datetime.now()
    templates = [
        {"type": "INTRUSION", "sector": "SEC-7A", "severity": "CRITICAL", "description": "Unauthorized human movement at perimeter fence"},
        {"type": "WILDLIFE", "sector": "TRK-2", "severity": "WARNING", "description": "Wild elephant on railway track near KM 142"},
        {"type": "MINING", "sector": "GEO-3", "severity": "WARNING", "description": "Terrain change — suspected illegal mining"},
        {"type": "UAV", "sector": "SEC-7B", "severity": "CRITICAL", "description": "Unidentified aerial vehicle in restricted airspace"},
        {"type": "VEHICLE", "sector": "SEC-7A", "severity": "WARNING", "description": "Suspicious vehicle approaching checkpoint"},
        {"type": "SYSTEM", "sector": "SYS", "severity": "NORMAL", "description": "Routine diagnostic completed"},
        {"type": "PATROL", "sector": "SEC-7C", "severity": "NORMAL", "description": "Patrol unit check-in — all clear"},
    ]

    for i in range(15):
        t = random.choice(templates)
        offset = timedelta(minutes=random.randint(5, 1440))
        incidents.append({
            "id": f"INC-{1000 + i}",
            "timestamp": (base_time - offset).strftime("%Y-%m-%d %H:%M:%S"),
            "type": t["type"], "sector": t["sector"],
            "severity": t["severity"], "description": t["description"],
            "status": random.choice(["RESOLVED", "PENDING", "INVESTIGATING"]),
            "responding_officer": random.choice(["Maj. Rajesh Sharma", "Sub. Vikram Singh", "Hav. Pradeep Kumar", "Sep. Amit Yadav"])
        })

    incidents.sort(key=lambda x: x["timestamp"], reverse=True)
    return jsonify({"incidents": incidents, "total": len(incidents)})


@app.route('/api/personnel', methods=['GET'])
def get_personnel():
    personnel = [
        {"name": "Maj. Rajesh Sharma", "rank": "SECTOR COMMANDER", "designation": "CO SEC-7", "status": "ACTIVE", "sector": "SEC-7", "last_checkin": "2 min ago"},
        {"name": "Sub. Vikram Singh", "rank": "SUBEDAR", "designation": "WATCH OFFICER", "status": "ON PATROL", "sector": "SEC-7A", "last_checkin": "8 min ago"},
        {"name": "Hav. Pradeep Kumar", "rank": "HAVILDAR", "designation": "SURVEILLANCE OPS", "status": "ACTIVE", "sector": "SEC-7B", "last_checkin": "1 min ago"},
        {"name": "Sep. Amit Yadav", "rank": "SEPOY", "designation": "GATE SENTRY", "status": "ACTIVE", "sector": "SEC-7A", "last_checkin": "Just now"},
        {"name": "Sep. Deepak Meena", "rank": "SEPOY", "designation": "PERIMETER GUARD", "status": "OFF DUTY", "sector": "SEC-7C", "last_checkin": "45 min ago"},
        {"name": "NK. Suresh Rathore", "rank": "NAIK", "designation": "COMMS OPERATOR", "status": "ACTIVE", "sector": "SEC-7", "last_checkin": "3 min ago"},
    ]
    active = sum(1 for p in personnel if p["status"] != "OFF DUTY")
    return jsonify({"personnel": personnel, "total": len(personnel), "active": active})


@app.route('/api/weather', methods=['GET'])
def get_weather():
    conditions = ["CLEAR", "OVERCAST", "LIGHT RAIN"]
    condition = random.choice(conditions)
    visibility_map = {"CLEAR": 95, "OVERCAST": 75, "LIGHT RAIN": 45}
    return jsonify({
        "condition": condition,
        "temperature_c": round(22 + random.random() * 16, 1),
        "humidity_pct": round(40 + random.random() * 45, 1),
        "wind_speed_kmh": round(5 + random.random() * 25, 1),
        "wind_direction": random.choice(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]),
        "visibility_pct": visibility_map.get(condition, 80) + round(random.random() * 10 - 5, 1),
        "sector": "SEC-7",
        "alert": condition == "STORM"
    })


@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    sectors = ["SEC-7A", "SEC-7B", "SEC-7C", "SEC-7D", "SEC-8A", "SEC-8B"]
    return jsonify({
        "threats_by_sector": [{"sector": s, "count": random.randint(2, 18)} for s in sectors],
        "threat_classification": [
            {"type": "Human Intruder", "count": random.randint(15, 30)},
            {"type": "Vehicle", "count": random.randint(5, 15)},
            {"type": "Wildlife", "count": random.randint(10, 25)},
            {"type": "UAV/Drone", "count": random.randint(2, 10)},
            {"type": "Mining Activity", "count": random.randint(5, 15)},
        ],
        "response_time_trend": [{"time": f"{h:02d}:00", "avg_minutes": round(2 + random.random() * 5, 1)} for h in range(0, 24, 4)],
        "kpi": {
            "total_alerts_24h": random.randint(30, 80),
            "avg_response_min": round(3 + random.random() * 3, 1),
            "resolution_rate_pct": round(88 + random.random() * 10, 1),
            "threat_level": random.choice(["NORMAL", "ELEVATED", "HIGH"]),
            "false_positive_rate": round(5 + random.random() * 10, 1)
        }
    })


@app.route('/api/quick_action', methods=['POST', 'OPTIONS'])
def handle_quick_action():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    data = request.json or {}
    action = data.get("action", "unknown")
    responses = {
        "lockdown": {"status": "EXECUTED", "message": "Facility lockdown initiated. All access points sealed.", "severity": "CRITICAL"},
        "qrf": {"status": "DISPATCHED", "message": "QRF Team Alpha dispatched to Sector 7. ETA: 4 min.", "severity": "HIGH"},
        "alarm": {"status": "ACTIVATED", "message": "Perimeter alarm activated. Audio alert broadcasting.", "severity": "HIGH"},
        "comms": {"status": "OPEN", "message": "Emergency channel FREQ-47.5MHz opened. All units alerted.", "severity": "MEDIUM"}
    }
    response = responses.get(action, {"status": "UNKNOWN", "message": f"Unknown: {action}", "severity": "LOW"})
    response["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S IST")
    response["action"] = action
    return jsonify(response)


# ─── Health check ───
@app.route('/', methods=['GET'])
@app.route('/api', methods=['GET'])
def health():
    return jsonify({
        "service": "Trinetra Rakshak Backend API",
        "version": "5.3",
        "status": "ONLINE",
        "endpoints": [
            "/api/status",
            "/api/evaluate_threat",
            "/api/system_vitals",
            "/api/incidents",
            "/api/personnel",
            "/api/weather",
            "/api/analytics",
            "/api/quick_action"
        ]
    })


# Vercel serverless handler
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
