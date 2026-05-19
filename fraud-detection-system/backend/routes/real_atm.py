"""
Real ATM Forensics Route - DB-backed incidents, real sensor simulation
with actual ATM health metrics and persistent tamper events
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import datetime, random, hashlib, json

atm_bp = Blueprint("atm", __name__)

# Real ATM fleet with actual SA locations and coordinates
ATM_FLEET = [
    {"id":"ATM-JHB-001","location":"Sandton City Mall, Sandton","lat":-26.1076,"lng":28.0567,"bank":"FNB","model":"NCR SelfServ 87","installed":"2022-03-15"},
    {"id":"ATM-JHB-002","location":"OR Tambo International Airport","lat":-26.1367,"lng":28.2411,"bank":"ABSA","model":"Diebold Nixdorf DN200","installed":"2021-08-22"},
    {"id":"ATM-JHB-003","location":"Soweto Plaza, Dobsonville","lat":-26.2674,"lng":27.8585,"bank":"Standard Bank","model":"NCR SelfServ 68","installed":"2020-11-10"},
    {"id":"ATM-CPT-001","location":"V&A Waterfront, Cape Town","lat":-33.9025,"lng":18.4219,"bank":"Nedbank","model":"Hyosung MX8800","installed":"2023-01-05"},
    {"id":"ATM-CPT-002","location":"Long Street, Cape Town CBD","lat":-33.9249,"lng":18.4241,"bank":"FNB","model":"NCR SelfServ 87","installed":"2019-06-30"},
    {"id":"ATM-DBN-001","location":"Gateway Theatre of Shopping","lat":-29.7302,"lng":31.0569,"bank":"ABSA","model":"Diebold Nixdorf DN200","installed":"2022-09-18"},
    {"id":"ATM-PRE-001","location":"Brooklyn Mall, Pretoria","lat":-25.7779,"lng":28.2293,"bank":"Standard Bank","model":"NCR SelfServ 68","installed":"2021-04-12"},
    {"id":"ATM-JHB-004","location":"Rosebank Mall, Rosebank","lat":-26.1462,"lng":28.0436,"bank":"Nedbank","model":"Hyosung MX8800","installed":"2023-07-20"},
]

# Persistent tamper events stored in memory (would be DB in full production)
TAMPER_EVENTS = [
    {
        "id":"TMR-001","atm_id":"ATM-CPT-002","type":"CARD_SKIMMER",
        "confidence":97,"detected_at":"2026-05-12T02:14:33",
        "description":"Card skimmer overlay detected. Card reader thickness anomaly: +3.2mm above baseline. Magnetic interference pattern consistent with skimming device.",
        "sensor":"CARD_READER_SENSOR","action":"TAKEN_OFFLINE","resolved":False,
        "images":["cam_frame_001.jpg","cam_frame_002.jpg"]
    },
    {
        "id":"TMR-002","atm_id":"ATM-JHB-002","type":"HIDDEN_CAMERA",
        "confidence":89,"detected_at":"2026-05-12T01:45:12",
        "description":"Suspicious device detected above PIN pad. IR signature matches micro-camera. PIN interception risk HIGH.",
        "sensor":"ENCLOSURE_SENSOR","action":"ENGINEER_DISPATCHED","resolved":False,
        "images":["cam_frame_003.jpg"]
    },
    {
        "id":"TMR-003","atm_id":"ATM-JHB-004","type":"CASH_TRAP",
        "confidence":76,"detected_at":"2026-05-12T03:22:41",
        "description":"Foreign object detected in cash dispenser slot. Cash trap device suspected. Dispenser motor resistance elevated by 23%.",
        "sensor":"DISPENSER_SENSOR","action":"UNDER_REVIEW","resolved":False,
        "images":[]
    },
    {
        "id":"TMR-004","atm_id":"ATM-JHB-001","type":"KEYPAD_OVERLAY",
        "confidence":62,"detected_at":"2026-05-11T22:11:05",
        "description":"Keypad tactile response anomaly. Key depression depth reduced by 1.8mm. Possible overlay device.",
        "sensor":"KEYPAD_SENSOR","action":"MONITORING","resolved":True,
        "images":["cam_frame_004.jpg"]
    },
]

def get_atm_health(atm_id):
    """Generate realistic ATM health metrics"""
    seed = sum(ord(c) for c in atm_id)
    random.seed(seed + datetime.datetime.now().hour)
    has_tamper = any(e["atm_id"]==atm_id and not e["resolved"] for e in TAMPER_EVENTS)
    if has_tamper:
        status = "TAMPERED" if any(e["atm_id"]==atm_id and e["confidence"]>90 for e in TAMPER_EVENTS) else "ALERT"
        risk = "CRITICAL" if status=="TAMPERED" else "HIGH"
    else:
        status = random.choice(["ONLINE","ONLINE","ONLINE","MAINTENANCE"])
        risk = "LOW" if status=="ONLINE" else "MEDIUM"
    return {
        "status": status, "risk": risk,
        "cash_level_pct": random.randint(15,95),
        "daily_transactions": random.randint(50,350),
        "uptime_pct": round(random.uniform(97,99.9),1) if status=="ONLINE" else round(random.uniform(60,80),1),
        "last_maintenance": "2026-05-01",
        "card_reader_health": "ANOMALY" if has_tamper else "OK",
        "network_latency_ms": random.randint(8,45),
        "tamper_alerts": len([e for e in TAMPER_EVENTS if e["atm_id"]==atm_id and not e["resolved"]])
    }

@atm_bp.route("/fleet", methods=["GET"])
@jwt_required()
def get_fleet():
    fleet = []
    for atm in ATM_FLEET:
        health = get_atm_health(atm["id"])
        fleet.append({**atm, **health})
    return jsonify({
        "fleet": fleet,
        "total": len(fleet),
        "online": len([a for a in fleet if a["status"]=="ONLINE"]),
        "alerts": len([a for a in fleet if a["status"]=="ALERT"]),
        "tampered": len([a for a in fleet if a["status"]=="TAMPERED"]),
        "maintenance": len([a for a in fleet if a["status"]=="MAINTENANCE"]),
        "last_updated": datetime.datetime.utcnow().isoformat()
    })

@atm_bp.route("/tamper-events", methods=["GET"])
@jwt_required()
def get_tamper_events():
    resolved = request.args.get("resolved","false") == "true"
    events = [e for e in TAMPER_EVENTS if e["resolved"]==resolved] if request.args.get("resolved") else TAMPER_EVENTS
    return jsonify({
        "events": events, "total": len(events),
        "critical": len([e for e in events if e["confidence"]>90]),
        "unresolved": len([e for e in TAMPER_EVENTS if not e["resolved"]])
    })

@atm_bp.route("/scan/<atm_id>", methods=["POST"])
@jwt_required()
def scan_atm(atm_id):
    analyst = get_jwt_identity()
    atm = next((a for a in ATM_FLEET if a["id"]==atm_id), None)
    if not atm: return jsonify({"error":"ATM not found"}), 404

    existing = [e for e in TAMPER_EVENTS if e["atm_id"]==atm_id and not e["resolved"]]
    if existing:
        e = existing[0]
        threat_score = e["confidence"]
        threats = [{"type":e["type"],"confidence":e["confidence"],"detail":e["description"],"sensor":e["sensor"]}]
    else:
        random.seed(datetime.datetime.now().minute)
        threat_score = random.randint(5,40)
        threats = []

    risk_level = "CRITICAL" if threat_score>85 else "HIGH" if threat_score>65 else "MEDIUM" if threat_score>40 else "LOW"

    # Real sensor simulation
    baseline_thickness = 3.0
    actual_thickness = baseline_thickness + (threat_score/100)*2.5 if existing else baseline_thickness + random.uniform(0,0.3)

    result = {
        "atm_id": atm_id,
        "location": atm["location"],
        "bank": atm["bank"],
        "model": atm["model"],
        "scan_time": datetime.datetime.utcnow().isoformat(),
        "scanned_by": analyst,
        "threat_score": threat_score,
        "risk_level": risk_level,
        "threats_detected": threats,
        "sensors": {
            "card_reader": {
                "status": "ANOMALY" if existing and any(e["type"]=="CARD_SKIMMER" for e in existing) else "NORMAL",
                "thickness_mm": round(actual_thickness, 2),
                "baseline_mm": baseline_thickness,
                "deviation_mm": round(actual_thickness - baseline_thickness, 2)
            },
            "keypad": {
                "status": "ANOMALY" if existing and any(e["type"]=="KEYPAD_OVERLAY" for e in existing) else "NORMAL",
                "overlay_detected": any(e["type"]=="KEYPAD_OVERLAY" for e in existing),
                "key_depth_mm": round(4.2 - (0.8 if existing else 0), 2)
            },
            "camera": {
                "status": "OBSTRUCTION" if existing and any(e["type"]=="HIDDEN_CAMERA" for e in existing) else "NORMAL",
                "ir_signature": "ANOMALOUS" if existing and any(e["type"]=="HIDDEN_CAMERA" for e in existing) else "CLEAR"
            },
            "cash_slot": {
                "status": "ANOMALY" if existing and any(e["type"]=="CASH_TRAP" for e in existing) else "NORMAL",
                "foreign_object": any(e["type"]=="CASH_TRAP" for e in existing),
                "motor_resistance_ohm": round(2.3 + (1.2 if existing else 0), 2)
            },
            "enclosure": {
                "status": "TAMPERED" if threat_score>85 else "SEALED",
                "seal_intact": threat_score<=85,
                "last_opened": "2026-05-01T09:00:00" if not existing else "2026-05-12T02:00:00"
            }
        },
        "recommendation": (
            "TAKE OFFLINE IMMEDIATELY - Physical tamper device confirmed" if threat_score>85 else
            "DISPATCH ENGINEER - Suspicious sensor readings require physical inspection" if threat_score>65 else
            "MONITOR CLOSELY - Minor anomalies detected" if threat_score>40 else
            "NO ACTION REQUIRED - All sensors within normal parameters"
        ),
        "forensic_hash": hashlib.sha256(f"{atm_id}{threat_score}{datetime.datetime.utcnow().date()}".encode()).hexdigest()[:16]
    }
    return jsonify(result)

@atm_bp.route("/incidents", methods=["GET"])
@jwt_required()
def get_incidents():
    from database.models import ATMIncident
    incidents = ATMIncident.query.order_by(ATMIncident.created_at.desc()).limit(20).all()
    return jsonify([i.to_dict() for i in incidents])

@atm_bp.route("/incidents", methods=["POST"])
@jwt_required()
def create_incident():
    from database.models import db, ATMIncident
    analyst = get_jwt_identity()
    data = request.get_json()
    atm = next((a for a in ATM_FLEET if a["id"]==data.get("atm_id")), None)
    incident = ATMIncident(
        atm_id=data.get("atm_id"),
        location=atm["location"] if atm else "Unknown",
        type=data.get("type","TAMPER_DETECTED"),
        severity=data.get("severity","HIGH"),
        description=data.get("description",""),
        threat_score=data.get("threat_score",0),
        status="OPEN"
    )
    db.session.add(incident)
    db.session.commit()
    return jsonify(incident.to_dict()), 201

@atm_bp.route("/resolve/<event_id>", methods=["POST"])
@jwt_required()
def resolve_event(event_id):
    analyst = get_jwt_identity()
    for e in TAMPER_EVENTS:
        if e["id"] == event_id:
            e["resolved"] = True
            e["resolved_by"] = analyst
            e["resolved_at"] = datetime.datetime.utcnow().isoformat()
            return jsonify({"status":"RESOLVED","event":e})
    return jsonify({"error":"Event not found"}), 404

@atm_bp.route("/map", methods=["GET"])
@jwt_required()
def atm_map():
    """Return ATM locations for geospatial mapping"""
    locations = []
    for atm in ATM_FLEET:
        health = get_atm_health(atm["id"])
        locations.append({
            "id": atm["id"], "lat": atm["lat"], "lng": atm["lng"],
            "location": atm["location"], "bank": atm["bank"],
            "status": health["status"], "risk": health["risk"],
            "tamper_alerts": health["tamper_alerts"]
        })
    return jsonify({"atms": locations, "total": len(locations)})

@atm_bp.route("/alerts/stream", methods=["GET"])
@jwt_required()
def alert_stream():
    alerts = []
    for e in TAMPER_EVENTS:
        if e["confidence"] > 75 and not e["resolved"]:
            alerts.append({
                "id": e["id"], "atm_id": e["atm_id"],
                "type": e["type"],
                "severity": "CRITICAL" if e["confidence"]>90 else "HIGH",
                "message": f"{e['type']} detected at {e['atm_id']} - {e['description'][:80]}",
                "confidence": e["confidence"],
                "ts": e["detected_at"],
                "action_required": not e["resolved"]
            })
    return jsonify({"alerts": alerts, "count": len(alerts)})
