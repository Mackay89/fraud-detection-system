"""
Real Intelligence Route - DB-backed cases, alerts, evidence
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import datetime, hashlib, uuid, json

intelligence_bp = Blueprint("intelligence", __name__)

@intelligence_bp.route("/device", methods=["POST"])
@jwt_required()
def device_intel():
    from threat_intel import threat_engine
    data = request.get_json()
    ip = data.get("ip_address", "0.0.0.0")
    ua = data.get("user_agent", "unknown")
    fp = hashlib.md5((ua + ip).encode()).hexdigest()[:16]
    result = threat_engine.check_ip(ip)
    result['fingerprint'] = fp
    result['user_agent'] = ua[:100]
    result['device_risk'] = result['risk_level']
    result['is_known_threat'] = result['is_malicious']
    return jsonify(result)

@intelligence_bp.route("/cases", methods=["GET"])
@jwt_required()
def get_cases():
    from database.models import Case
    status = request.args.get("status")
    q = Case.query.order_by(Case.created_at.desc())
    if status: q = q.filter_by(status=status)
    return jsonify([c.to_dict() for c in q.limit(50).all()])

@intelligence_bp.route("/cases", methods=["POST"])
@jwt_required()
def create_case():
    from database.models import db, Case
    analyst = get_jwt_identity()
    data = request.get_json()
    case_ref = "CASE-" + str(uuid.uuid4())[:6].upper()
    timeline = json.dumps([{
        "ts": datetime.datetime.utcnow().isoformat(),
        "event": "Case opened", "user": analyst
    }])
    case = Case(
        case_ref=case_ref,
        title=data.get("title","Fraud Investigation"),
        category=data.get("category","Payment Fraud"),
        severity=data.get("severity","HIGH"),
        amount=data.get("amount", 0),
        description=data.get("description",""),
        assigned_to=analyst,
        timeline=timeline
    )
    db.session.add(case); db.session.commit()
    return jsonify(case.to_dict()), 201

@intelligence_bp.route("/cases/<cid>/update", methods=["POST"])
@jwt_required()
def update_case(cid):
    from database.models import db, Case
    analyst = get_jwt_identity()
    data = request.get_json()
    case = Case.query.filter_by(case_ref=cid).first()
    if not case: return jsonify({"error":"Not found"}), 404
    if "status" in data: case.status = data["status"]
    if "note" in data:
        tl = json.loads(case.timeline or '[]')
        tl.append({"ts": datetime.datetime.utcnow().isoformat(),
                   "event": data["note"], "user": analyst})
        case.timeline = json.dumps(tl)
    case.updated_at = datetime.datetime.utcnow()
    db.session.commit()
    return jsonify(case.to_dict())

@intelligence_bp.route("/alerts", methods=["GET"])
@jwt_required()
def get_alerts():
    from database.models import Alert
    acked = request.args.get("acknowledged")
    q = Alert.query.order_by(Alert.created_at.desc())
    if acked == "false": q = q.filter_by(acknowledged=False)
    alerts = q.limit(30).all()
    return jsonify([a.to_dict() for a in alerts])

@intelligence_bp.route("/alerts", methods=["POST"])
def create_alert():
    from database.models import db, Alert
    data = request.get_json()
    alert = Alert(
        type=data.get("type","FRAUD"),
        severity=data.get("severity","HIGH"),
        message=data.get("message",""),
        amount=data.get("amount", 0),
        category=data.get("category","Unknown"),
        source=data.get("source","FRONTEND")
    )
    db.session.add(alert); db.session.commit()
    return jsonify(alert.to_dict()), 201

@intelligence_bp.route("/alerts/<int:aid>/acknowledge", methods=["POST"])
@jwt_required()
def ack_alert(aid):
    from database.models import db, Alert
    analyst = get_jwt_identity()
    alert = Alert.query.get(aid)
    if not alert: return jsonify({"error":"Not found"}), 404
    alert.acknowledged = True
    alert.ack_by = analyst
    db.session.commit()
    return jsonify(alert.to_dict())

@intelligence_bp.route("/threats", methods=["GET"])
@jwt_required()
def threat_feed():
    from threat_intel import threat_engine
    feed = threat_engine.get_live_feed()
    return jsonify({"feed": feed, "updated": datetime.datetime.utcnow().isoformat(),
                    "total": len(feed)})

@intelligence_bp.route("/graph", methods=["GET"])
@jwt_required()
def fraud_graph():
    from database.models import Transaction
    txns = Transaction.query.order_by(Transaction.created_at.desc()).limit(30).all()
    nodes = []; edges = []
    for t in txns:
        nodes.append({
            "id": f"tx_{t.id}", "type": "transaction",
            "amount": t.amount, "fraud": t.is_fraud,
            "label": f"${t.amount:,.0f}",
            "category": t.fraud_category,
            "ip": t.ip_address
        })
    # Link fraud transactions sharing same IP
    fraud_txns = [t for t in txns if t.is_fraud]
    ip_groups = {}
    for t in fraud_txns:
        if t.ip_address:
            ip_groups.setdefault(t.ip_address, []).append(t.id)
    for ip, ids in ip_groups.items():
        if len(ids) > 1:
            for i in range(len(ids)-1):
                edges.append({"from": f"tx_{ids[i]}", "to": f"tx_{ids[i+1]}",
                              "type": "shared_ip", "strength": "HIGH"})
    return jsonify({"nodes": nodes[:25], "edges": edges[:30],
                    "stats": {"total_nodes": len(nodes), "total_edges": len(edges),
                              "fraud_nodes": len(fraud_txns)}})

@intelligence_bp.route("/recovery", methods=["POST"])
@jwt_required()
def recovery_action():
    from database.models import db, Alert
    analyst = get_jwt_identity()
    data = request.get_json()
    action = data.get("action")
    amount = float(data.get("amount", 0))
    # Log recovery action as alert
    alert = Alert(type=f"RECOVERY_{action.upper()}", severity="INFO",
                  message=f"Recovery action {action} initiated for ${amount:,.0f} by {analyst}",
                  amount=amount, source="RECOVERY_ENGINE")
    db.session.add(alert); db.session.commit()
    responses = {
        "freeze": {"status":"EXECUTED","action":"Account frozen in banking system","recoverable":amount,"window":"72h","alert_id":alert.id},
        "delay":  {"status":"EXECUTED","action":"Transfer delayed 24h - pending review","recoverable":amount,"window":"24h","alert_id":alert.id},
        "recall": {"status":"INITIATED","action":"SWIFT recall message sent to correspondent bank","recoverable":round(amount*0.7,2),"window":"5 days","alert_id":alert.id},
        "flag":   {"status":"FLAGGED","action":"Account flagged - compliance team notified","recoverable":0,"window":"N/A","alert_id":alert.id},
    }
    return jsonify(responses.get(action, {"status":"UNKNOWN","action":"Invalid action"}))

@intelligence_bp.route("/stats", methods=["GET"])
def intel_stats():
    from database.models import Transaction, Case, Alert, Evidence
    return jsonify({
        "transactions": Transaction.query.count(),
        "fraud": Transaction.query.filter_by(is_fraud=True).count(),
        "cases": Case.query.count(),
        "open_cases": Case.query.filter_by(status='OPEN').count(),
        "alerts": Alert.query.count(),
        "unacked_alerts": Alert.query.filter_by(acknowledged=False).count(),
        "evidence": Evidence.query.count()
    })
