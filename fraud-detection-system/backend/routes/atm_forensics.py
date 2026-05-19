from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import datetime, random, hashlib

atm_bp = Blueprint("atm", __name__)

# Simulated ATM fleet
ATM_FLEET = [
    {"id":"ATM-JHB-001","location":"Sandton City Mall","lat":-26.1076,"lng":28.0567,"status":"ONLINE","risk":"LOW"},
    {"id":"ATM-JHB-002","location":"OR Tambo Airport","lat":-26.1367,"lng":28.2411,"status":"ALERT","risk":"HIGH"},
    {"id":"ATM-JHB-003","location":"Soweto Plaza","lat":-26.2674,"lng":27.8585,"status":"ONLINE","risk":"MEDIUM"},
    {"id":"ATM-CPT-001","location":"V&A Waterfront","lat":-33.9025,"lng":18.4219,"status":"ONLINE","risk":"LOW"},
    {"id":"ATM-CPT-002","location":"Cape Town CBD","lat":-33.9249,"lng":18.4241,"status":"TAMPERED","risk":"CRITICAL"},
    {"id":"ATM-DBN-001","location":"Gateway Theatre","lat":-29.7302,"lng":31.0569,"status":"ONLINE","risk":"LOW"},
    {"id":"ATM-PRE-001","location":"Brooklyn Mall","lat":-25.7779,"lng":28.2293,"status":"MAINTENANCE","risk":"MEDIUM"},
    {"id":"ATM-JHB-004","location":"Rosebank Mall","lat":-26.1462,"lng":28.0436,"status":"ALERT","risk":"HIGH"},
]

TAMPER_EVENTS = [
    {"atm_id":"ATM-CPT-002","type":"CARD_SKIMMER","confidence":97,"detected_at":"2026-05-09T02:14:33","description":"Card skimmer device detected on card reader slot. Unusual overlay thickness: +3.2mm","action":"TAKEN_OFFLINE"},
    {"atm_id":"ATM-JHB-002","type":"HIDDEN_CAMERA","confidence":89,"detected_at":"2026-05-09T01:45:12","description":"Suspicious micro-camera detected above keypad. PIN interception risk HIGH","action":"ENGINEER_DISPATCHED"},
    {"atm_id":"ATM-JHB-004","type":"CASH_TRAP","confidence":76,"detected_at":"2026-05-09T03:22:41","description":"Foreign object detected in cash dispenser slot. Possible cash trapping device","action":"UNDER_REVIEW"},
    {"atm_id":"ATM-JHB-001","type":"KEYPAD_OVERLAY","confidence":62,"detected_at":"2026-05-08T22:11:05","description":"Keypad tactile response anomaly detected. Possible overlay device","action":"MONITORING"},
]

atm_incidents = []
incident_id = [5000]

@atm_bp.route("/fleet", methods=["GET"])
@jwt_required()
def get_fleet():
    fleet = []
    for atm in ATM_FLEET:
        a = atm.copy()
        a["last_transaction"] = datetime.datetime.utcnow().isoformat()
        a["daily_transactions"] = random.randint(50, 300)
        a["cash_level"] = random.randint(20, 95)
        a["uptime"] = f"{random.randint(95,100)}.{random.randint(0,9)}%"
        a["tamper_alerts"] = len([t for t in TAMPER_EVENTS if t["atm_id"] == atm["id"]])
        fleet.append(a)
    return jsonify({"fleet": fleet, "total": len(fleet),
                    "online": len([a for a in ATM_FLEET if a["status"]=="ONLINE"]),
                    "alerts": len([a for a in ATM_FLEET if a["status"]=="ALERT"]),
                    "tampered": len([a for a in ATM_FLEET if a["status"]=="TAMPERED"])})

@atm_bp.route("/tamper-events", methods=["GET"])
@jwt_required()
def get_tamper_events():
    return jsonify({"events": TAMPER_EVENTS, "total": len(TAMPER_EVENTS),
                    "critical": len([e for e in TAMPER_EVENTS if e["confidence"] > 90])})

@atm_bp.route("/scan/<atm_id>", methods=["POST"])
@jwt_required()
def scan_atm(atm_id):
    atm = next((a for a in ATM_FLEET if a["id"] == atm_id), None)
    if not atm:
        return jsonify({"error": "ATM not found"}), 404
    score = random.randint(5, 95)
    threats = []
    if score > 70:
        threats.append({"type": "PHYSICAL_ANOMALY", "confidence": score, "detail": "Card reader thickness anomaly detected"})
    if score > 80:
        threats.append({"type": "SENSOR_ALERT", "confidence": score-10, "detail": "Internal tamper sensor triggered"})
    result = {
        "atm_id": atm_id, "location": atm["location"],
        "scan_time": datetime.datetime.utcnow().isoformat(),
        "threat_score": score,
        "risk_level": "CRITICAL" if score>85 else "HIGH" if score>65 else "MEDIUM" if score>40 else "LOW",
        "threats_detected": threats,
        "sensors": {
            "card_reader": {"status": "ANOMALY" if score>70 else "NORMAL", "thickness_mm": round(3.0 + (score/100)*2, 2)},
            "keypad": {"status": "ANOMALY" if score>75 else "NORMAL", "overlay_detected": score>75},
            "camera": {"status": "NORMAL", "obstruction": False},
            "cash_slot": {"status": "ANOMALY" if score>80 else "NORMAL", "foreign_object": score>80},
            "enclosure": {"status": "TAMPERED" if score>85 else "SEALED", "seal_intact": score<=85}
        },
        "recommendation": "TAKE OFFLINE IMMEDIATELY" if score>85 else "DISPATCH ENGINEER" if score>65 else "MONITOR CLOSELY" if score>40 else "NO ACTION REQUIRED"
    }
    return jsonify(result)

@atm_bp.route("/incidents", methods=["GET"])
@jwt_required()
def get_incidents():
    return jsonify(atm_incidents[-20:])

@atm_bp.route("/incidents", methods=["POST"])
@jwt_required()
def create_incident():
    data = request.get_json()
    incident = {
        "id": f"INC-{incident_id[0]}",
        "atm_id": data.get("atm_id"),
        "type": data.get("type", "TAMPER_DETECTED"),
        "severity": data.get("severity", "HIGH"),
        "description": data.get("description", ""),
        "status": "OPEN",
        "created_at": datetime.datetime.utcnow().isoformat()
    }
    atm_incidents.append(incident)
    incident_id[0] += 1
    return jsonify(incident), 201

@atm_bp.route("/alerts/stream", methods=["GET"])
@jwt_required()
def alert_stream():
    alerts = []
    for event in TAMPER_EVENTS:
        if event["confidence"] > 85:
            alerts.append({
                "id": hashlib.md5(event["atm_id"].encode()).hexdigest()[:8],
                "atm_id": event["atm_id"],
                "type": event["type"],
                "severity": "CRITICAL" if event["confidence"]>90 else "HIGH",
                "message": f"{event['type']} detected at {event['atm_id']}",
                "confidence": event["confidence"],
                "ts": event["detected_at"]
            })
    return jsonify({"alerts": alerts, "count": len(alerts)})
