from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import datetime

graph_bp = Blueprint("graph", __name__)

@graph_bp.route("/network", methods=["GET"])
@jwt_required()
def fraud_network():
    from routes.predict import transactions
    nodes = []
    edges = []
    seen = {}
    for t in transactions[-50:]:
        nid = f"tx_{t['id']}"
        node_type = "fraud" if t["is_fraud"] else "legit"
        nodes.append({
            "id": nid, "type": "transaction",
            "verdict": node_type,
            "amount": t["amount"],
            "label": f"${t['amount']:,.0f}",
            "risk": t.get("risk_level","LOW"),
            "ts": t["created_at"]
        })
        # Link fraud transactions to shared risk attributes
        for prev in transactions[-50:]:
            if prev["id"] == t["id"]: continue
            if t["is_fraud"] and prev["is_fraud"]:
                if abs(t["amount"] - prev["amount"]) < 100:
                    edges.append({"from": f"tx_{prev['id']}", "to": nid, "type": "amount_match", "strength": "HIGH"})
                if t["transaction_type"] == prev["transaction_type"]:
                    edges.append({"from": f"tx_{prev['id']}", "to": nid, "type": "type_match", "strength": "MEDIUM"})

    # Add entity nodes
    fraud_txs = [t for t in transactions[-50:] if t["is_fraud"]]
    if fraud_txs:
        nodes.append({"id":"entity_suspect_1","type":"suspect","label":"Suspect Account","verdict":"fraud"})
        for t in fraud_txs[:3]:
            edges.append({"from":"entity_suspect_1","to":f"tx_{t['id']}","type":"account_link","strength":"HIGH"})

    return jsonify({
        "nodes": nodes[:30], "edges": edges[:40],
        "stats": {
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "fraud_nodes": len([n for n in nodes if n.get("verdict")=="fraud"]),
            "clusters": max(1, len(fraud_txs)//3)
        }
    })

@graph_bp.route("/rings", methods=["GET"])
@jwt_required()
def detect_rings():
    from routes.predict import transactions
    fraud_txs = [t for t in transactions if t["is_fraud"]]
    rings = []
    if len(fraud_txs) >= 3:
        rings.append({
            "id": "RING-001",
            "type": "ATM Fraud Ring",
            "members": len(fraud_txs),
            "total_amount": sum(t["amount"] for t in fraud_txs),
            "risk": "CRITICAL",
            "detected_at": datetime.datetime.utcnow().isoformat(),
            "description": f"Coordinated fraud pattern detected across {len(fraud_txs)} transactions"
        })
    return jsonify({"rings": rings, "total": len(rings)})
