from flask import Flask, request, jsonify
from flask_cors import CORS

import sys
import os

# Append the current dir to resolve modules easily 
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from logic.fuzzy_engine import ReasoningEngine
from logic.threat_predictor import ThreatPredictor
from fpdf import FPDF
from datetime import datetime
app = Flask(__name__)
# Allow Elite Command Center frontend access
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Central Logic Engine reference
ai_engine = ReasoningEngine()
threat_engine = ThreatPredictor()

@app.route('/api/status', methods=['GET'])
def get_system_status():
    """ Heartbeat for the Command Center. """
    return jsonify({
        "status": "ONLINE",
        "system": "Trinetra Rakshak API",
        "sensors": ["Border-Sentry", "Geo-Eye", "Track-Guard"]
    })

@app.route('/api/evaluate_threat', methods=['POST'])
def check_threat():
    """ 
    Evaluates raw parameters coming from sensors or manual manual injection 
    and returns a fuzzy Risk Score and XAI string.
    """
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
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400

@app.route('/api/generate_report', methods=['POST'])
def generate_report():
    """ Generates an actionable PDF Incident Report. """
    data = request.json
    threat_info = data.get("threat_info", "Unknown Threat")
    sector = data.get("sector", "SEC-UNKNOWN")
    risk_score = data.get("risk_score", 0)
    gps_coords = data.get("gps", "Lat: 28.6139, Lon: 77.2090") # default to New Delhi
    
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(0, 10, "TRINETRA RAKSHAK - INCIDENT REPORT", ln=True, align='C')
    pdf.ln(10)
    
    pdf.set_font("Arial", size=12)
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    pdf.cell(0, 10, f"Timestamp: {timestamp}", ln=True)
    pdf.cell(0, 10, f"Sector ID: {sector}", ln=True)
    pdf.cell(0, 10, f"GPS Coordinates: {gps_coords}", ln=True)
    pdf.cell(0, 10, f"Fuzzy Risk Score: {risk_score}%", ln=True)
    pdf.cell(0, 10, f"Threat Inference: {threat_info}", ln=True)
    
    pdf.ln(10)
    pdf.set_font("Arial", 'I', 10)
    pdf.multi_cell(0, 10, "This is an automatically generated dispatch report by the Trinetra Rakshak Command System. Immediate field verification recommended.")
    
    # Save the PDF to a temporary file and send it
    pdf_filename = f"report_{sector}_{int(datetime.now().timestamp())}.pdf"
    file_path = os.path.join(os.path.dirname(__file__), pdf_filename)
    pdf.output(file_path)
    
    from flask import send_file
    return send_file(file_path, as_attachment=True, download_name=pdf_filename)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
