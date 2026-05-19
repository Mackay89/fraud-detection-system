"""
Real Predict Route - Uses SQLite persistence + real threat intel
Replaces in-memory list with database storage
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import pickle, os, datetime, sys, hashlib

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "models"))
from fraud_model_class import FraudModel

try:
    from app import socketio
    HAS_SOCKET = True
except Exception:
    HAS_SOCKET = False

predict_bp = Blueprint("predict", __name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "fraud_model.pkl")
with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)

def risk(p):
    if p < 0.3: return "LOW"
    if p < 0.6: return "MEDIUM"
    if p < 0.85: return "HIGH"
    return "CRITICAL"

def detect_fraud_type(data, prob):
    tt  = data.get("transaction_type", 0)
    bot = data.get("is_bot_pattern", 0)
    idr = data.get("identity_risk", 0)
    fo  = data.get("is_foreign", 0)
    ch  = data.get("channel_risk", 0)
    vel = data.get("num_transactions_today", 0)
    dist= data.get("distance_from_home", 0)
    amt = data.get("amount", 0)
    dev = data.get("new_device", 0)
    if bot and vel > 5:        return "AI-Driven Threat",      "Bot-driven transaction attack detected"
    if idr >= 2:               return "Identity Fraud",         "Synthetic identity / deepfake indicators"
    if tt == 3 and fo and amt > 5000: return "Transfer Fraud", "Cross-border wire transfer laundering"
    if tt == 2 and dist > 500: return "Payment Fraud",         "ATM fraud - unusual geographic location"
    if dev and fo:             return "Digital Banking Fraud",  "Account takeover / possible SIM swap"
    if ch >= 2:                return "Digital Banking Fraud",  "Credential stuffing / MFA bypass pattern"
    if fo and dist > 200:      return "Payment Fraud",          "Card-not-present cross-border transaction"
    if tt in [1,4] and vel>3:  return "Payment Fraud",          "Contactless / QR payment velocity abuse"
    return "Payment Fraud", "Suspicious transaction pattern"

def get_device_fingerprint(request_data, ip):
    raw = str(request_data.get("user_agent","")) + ip + str(request_data.get("new_device",0))
    return hashlib.md5(raw.encode()).hexdigest()[:16]

@predict_bp.route("/", methods=["POST"])
@jwt_required()
def predict():
    from database.models import db, Transaction, Alert
    analyst = get_jwt_identity()
    data = request.get_json()
    ip = request.headers.get('X-Forwarded-For', request.remote_addr or '127.0.0.1')

    try:
        features = [
            float(data["amount"]),
            float(data["time_of_day"]),
            int(data["transaction_type"]),
            int(data["merchant_category"]),
            float(data["distance_from_home"]),
            int(data["num_transactions_today"]),
            float(data["avg_amount_last_7d"]),
            int(data["is_foreign"]),
            int(data.get("new_device", 0)),
            int(data.get("is_bot_pattern", 0)),
            int(data.get("identity_risk", 0)),
            int(data.get("channel_risk", 0)),
        ]
    except (KeyError, ValueError) as e:
        return jsonify({"error": f"Invalid field: {e}"}), 400

    prob = float(model.predict_proba([features])[0][1])
    is_fraud = prob >= 0.5
    fraud_cat, fraud_detail = detect_fraud_type(data, prob) if is_fraud else ("None", "Legitimate transaction")

    # Real threat intel check
    threat_info = {}
    try:
        from threat_intel import threat_engine
        if ip and ip != '127.0.0.1':
            threat_info = threat_engine.check_ip(ip)
            if threat_info.get('is_malicious') and not is_fraud:
                prob = max(prob, 0.75)
                is_fraud = True
                fraud_cat = "Digital Banking Fraud"
                fraud_detail = f"Malicious IP detected: {threat_info.get('threat_type','Unknown threat')}"
    except Exception as e:
        pass

    # Persist to database
    txn = Transaction(
        amount=float(data["amount"]),
        time_of_day=int(data["time_of_day"]),
        transaction_type=int(data["transaction_type"]),
        merchant_category=int(data["merchant_category"]),
        distance_from_home=float(data["distance_from_home"]),
        num_transactions_today=int(data["num_transactions_today"]),
        avg_amount_last_7d=float(data["avg_amount_last_7d"]),
        is_foreign=int(data["is_foreign"]),
        new_device=int(data.get("new_device", 0)),
        is_bot_pattern=int(data.get("is_bot_pattern", 0)),
        identity_risk=int(data.get("identity_risk", 0)),
        channel_risk=int(data.get("channel_risk", 0)),
        fraud_probability=round(prob, 4),
        is_fraud=is_fraud,
        risk_level=risk(prob),
        fraud_category=fraud_cat,
        fraud_detail=fraud_detail,
        ip_address=ip,
        device_fingerprint=get_device_fingerprint(data, ip),
        user_id=analyst
    )
    db.session.add(txn)

    # Auto-create alert for fraud
    if is_fraud:
        alert = Alert(
            type='FRAUD_DETECTED',
            severity='CRITICAL' if prob > 0.85 else 'HIGH',
            message=f'Fraud detected: ${data["amount"]:,.0f} - {fraud_cat}',
            amount=float(data["amount"]),
            category=fraud_cat,
            source='ML_ENGINE',
            transaction_id=None
        )
        db.session.add(alert)

    db.session.commit()

    # Real-time WebSocket broadcast
    if HAS_SOCKET:
        try:
            payload = {"id": txn.id, "amount": float(data["amount"]), "is_fraud": is_fraud, "risk_level": risk(prob), "fraud_category": fraud_cat, "fraud_detail": fraud_detail, "verdict": "fraud" if is_fraud else "legit", "confidence": round(prob,4)}
            socketio.emit("transaction", payload, namespace="/alerts")
            if is_fraud:
                socketio.emit("fraud_alert", payload, namespace="/alerts")
        except Exception:
            pass

    result = txn.to_dict()
    result['fraud_category'] = fraud_cat
    result['fraud_detail'] = fraud_detail
    result['verdict'] = 'fraud' if is_fraud else 'legit'
    if threat_info:
        result['threat_intel'] = {
            'ip_malicious': threat_info.get('is_malicious', False),
            'ip_country': threat_info.get('geo', {}).get('country', 'Unknown'),
            'threat_type': threat_info.get('threat_type')
        }
    return jsonify(result)

@predict_bp.route("/stats", methods=["GET"])
@jwt_required()
def stats():
    from database.models import Transaction
    total = Transaction.query.count()
    fraud_count = Transaction.query.filter_by(is_fraud=True).count()
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(hours=24)
    last_24h = Transaction.query.filter(Transaction.created_at >= cutoff).count()
    last_24h_fraud = Transaction.query.filter(
        Transaction.created_at >= cutoff, Transaction.is_fraud == True).count()
    top_categories = {}
    fraud_txns = Transaction.query.filter_by(is_fraud=True).all()
    for t in fraud_txns:
        cat = t.fraud_category or 'Unknown'
        top_categories[cat] = top_categories.get(cat, 0) + 1
    return jsonify({
        "total_transactions": total,
        "fraud_count": fraud_count,
        "legit_count": total - fraud_count,
        "fraud_rate": round(fraud_count / total * 100, 1) if total else 0,
        "fraud_categories": top_categories,
        "last_24h": {"total": last_24h, "fraud": last_24h_fraud}
    })

@predict_bp.route("/history", methods=["GET"])
@jwt_required()
def history():
    from database.models import Transaction
    limit = int(request.args.get("limit", 100))
    page  = int(request.args.get("page", 1))
    verdict = request.args.get("verdict")
    q = Transaction.query.order_by(Transaction.created_at.desc())
    if verdict == 'fraud':   q = q.filter_by(is_fraud=True)
    if verdict == 'legit':   q = q.filter_by(is_fraud=False)
    txns = q.limit(limit).offset((page-1)*limit).all()
    return jsonify([t.to_dict() for t in txns])

@predict_bp.route("/stream", methods=["GET"])
@jwt_required(optional=True)
def stream():
    """Real-time transaction stream - last 20 for live dashboard"""
    from database.models import Transaction
    txns = Transaction.query.order_by(Transaction.created_at.desc()).limit(20).all()
    return jsonify({
        "transactions": [t.to_dict() for t in txns],
        "total": Transaction.query.count(),
        "fraud_total": Transaction.query.filter_by(is_fraud=True).count()
    })
