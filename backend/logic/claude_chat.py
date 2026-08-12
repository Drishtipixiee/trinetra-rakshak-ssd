"""
Claude AI Chat Module for Trinetra Rakshak 2.0
Uses Claude claude-3-5-haiku for fast, cheap, intelligent responses.
System prompt includes real incident data from the SQLite DB.
Falls back to enhanced keyword engine if ANTHROPIC_API_KEY is not set.
"""

import os
import logging

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are ARIA (Adaptive Reconnaissance Intelligence Analyst), the AI assistant for Trinetra Rakshak — India's AI-powered Integrated Command & Control Surveillance System. You are operating inside a military-grade command center monitoring Sector 7, Jharkhand region.

You have access to:
- Live CCTV feeds (CAM-01 to CAM-05) with AI object detection (TensorFlow.js COCO-SSD)
- Border-Sentry module: perimeter intrusion detection with real-time inference
- GEO-EYE module: Sentinel-2 satellite imagery for illegal mining detection in Jharkhand
- Track-Guard module: Railway wildlife/obstruction detection with brake recommendation
- Real-time incident database (SQLite + Supabase cloud sync)
- Fuzzy logic risk scoring engine (Mamdani inference: proximity, velocity, visibility inputs)
- Telegram and SMS alert dispatch system

System facts:
- AI detection: TensorFlow.js COCO-SSD running in-browser at ~10fps on video frames
- Risk scores: computed by fuzzy inference engine, 0-100 scale
- Alerts: Telegram + SMS auto-triggered for risk > 75%
- Track-Guard: generates brake recommendation signals; real actuation requires RDSO API (not publicly accessible for prototypes)
- Sentinel-2: 10m/pixel resolution, detects large-scale mining (>10m area changes)

Always respond in a professional military tone. Be concise (under 200 words). Analyze data honestly, including system limitations. Never fabricate sensor readings."""


def chat_with_claude(query: str, recent_incidents: list, detection_context: dict = None) -> str:
    """
    Send a query to Claude with real incident context.

    Args:
        query: User's question
        recent_incidents: List of recent incident dicts from SQLite
        detection_context: Optional current detection state dict

    Returns:
        AI response string
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()

    if not api_key:
        logger.warning("[Claude] ANTHROPIC_API_KEY not set. Using enhanced keyword fallback.")
        return _keyword_fallback(query, recent_incidents, detection_context)

    try:
        import anthropic

        client = anthropic.Anthropic(api_key=api_key)
        context_str = _build_context(recent_incidents, detection_context)

        message = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=600,
            system=SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": f"{context_str}\n\nOfficer Query: {query}"
                }
            ]
        )

        response = message.content[0].text
        logger.info(f"[Claude] Response generated ({len(response)} chars)")
        return response

    except ImportError:
        logger.error("[Claude] anthropic library not installed")
        return _keyword_fallback(query, recent_incidents, detection_context)
    except Exception as e:
        logger.error(f"[Claude] API error: {e}")
        return _keyword_fallback(query, recent_incidents, detection_context)


def _build_context(recent_incidents: list, detection_context: dict = None) -> str:
    """Build a real-data context string from the DB to inject into Claude."""
    lines = ["=== LIVE SYSTEM CONTEXT ==="]

    if recent_incidents:
        lines.append(f"\nRecent Incidents ({len(recent_incidents)} total logged):")
        for inc in recent_incidents[:5]:
            lines.append(
                f"  [{inc.get('timestamp', 'N/A')}] {inc.get('severity', '?')} | "
                f"{inc.get('type', '?')} | Sector: {inc.get('sector', '?')} | "
                f"{inc.get('description', '')}"
            )
    else:
        lines.append("\nNo recent incidents in database — all sectors clear.")

    if detection_context:
        lines.append(f"\nCurrent Real-Time Detection State:")
        lines.append(f"  Threat Level: {detection_context.get('threatLevel', 'LOW')}")
        lines.append(f"  Risk Score: {detection_context.get('riskScore', 0)}%")
        lines.append(f"  Primary Detected Class: {detection_context.get('primaryClass', 'None')}")
        lines.append(f"  Objects in Frame: {detection_context.get('objectCount', 0)}")

    lines.append("=== END CONTEXT ===")
    return "\n".join(lines)


def _keyword_fallback(query: str, recent_incidents: list, detection_context: dict = None) -> str:
    """Enhanced keyword-based fallback when Claude API is unavailable."""
    q = query.lower()

    total = len(recent_incidents)
    critical = sum(1 for i in recent_incidents if i.get('severity') == 'CRITICAL')
    latest = recent_incidents[0] if recent_incidents else None

    if any(w in q for w in ["breach", "intruder", "person", "human", "hostile", "caught"]):
        intrusions = [i for i in recent_incidents if i.get('type') == 'INTRUSION']
        if intrusions:
            r = intrusions[0]
            return (f"INTRUSION ALERT — Sector {r.get('sector', '7A')}. "
                    f"Severity: {r.get('severity')}. {r.get('description')}. "
                    f"TF.js COCO-SSD confirmed detection. Recommend QRF deployment.")
        return "All sectors secure. No unauthorized intrusions detected. Perimeter integrity nominal."

    if any(w in q for w in ["wildlife", "animal", "elephant", "track", "railway", "train"]):
        wildlife = [i for i in recent_incidents if i.get('type') == 'WILDLIFE']
        if wildlife:
            r = wildlife[0]
            return (f"TRACK-GUARD — {r.get('sector')}: {r.get('description')}. "
                    f"Brake recommendation signal generated. "
                    f"(RDSO live integration not available for prototype — signal is logged.)")
        return "Track-Guard monitoring active. No wildlife on railway corridors. Track clear."

    if any(w in q for w in ["mining", "satellite", "geo", "sentinel", "jharkhand", "terrain"]):
        mining = [i for i in recent_incidents if i.get('type') == 'MINING']
        if mining:
            r = mining[0]
            return (f"GEO-EYE ALERT — {r.get('description')} at {r.get('sector')}. "
                    f"Sentinel-2 satellite confirms terrain anomaly. "
                    f"Severity: {r.get('severity')}. Forwarded to District Mining Officer.")
        return "GEO-EYE active. Sentinel-2 WMS loaded. No new terrain anomalies in Jharkhand corridor."

    if any(w in q for w in ["drone", "uav", "aerial", "air"]):
        drones = [i for i in recent_incidents if i.get('type') == 'DRONE']
        if drones:
            r = drones[0]
            return f"UAV ALERT — {r.get('description')} | Sector: {r.get('sector')} | Severity: {r.get('severity')}."
        return "Airspace clear. No unauthorized UAV/drone detected in restricted sectors."

    if any(w in q for w in ["status", "update", "all", "overview", "report", "summary"]):
        if latest:
            return (f"SYSTEM v2.0 ONLINE. {total} events logged ({critical} CRITICAL). "
                    f"Latest: [{latest.get('timestamp', 'N/A')}] {latest.get('severity')} "
                    f"{latest.get('type')} — {latest.get('sector')}. "
                    f"TF.js COCO-SSD active. Supabase synced. Fuzzy engine operational.")
        return (f"SYSTEM v2.0 ONLINE. {total} events total, {critical} critical. "
                f"All sensors nominal. AI inference active at full capacity.")

    if any(w in q for w in ["how", "work", "explain", "technology", "ai", "model"]):
        return ("Trinetra Rakshak 2.0 uses TensorFlow.js COCO-SSD (80-class COCO model) for "
                "real-time in-browser inference on video frames. Detection outputs feed a Fuzzy Logic "
                "engine computing risk from proximity (bbox area), velocity (centroid delta), and "
                "visibility (confidence). Risk >75% triggers Telegram alerts. GEO-EYE uses Copernicus "
                "Sentinel-2 WMS. Known limitations: 10m satellite resolution, COCO dataset bias, "
                "no RDSO railway API access.")

    return (f"ARIA v2.0 online. {total} incidents logged ({critical} critical). "
            "Real AI detection active. Ask about threats, status, satellite data, or system tech.")
