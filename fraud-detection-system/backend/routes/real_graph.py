"""
Real Graph & Criminal Network Analysis
- Uses actual transaction DB for link analysis
- Detects fraud rings based on shared attributes
- Community detection algorithm
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import datetime, collections

graph_bp = Blueprint("graph", __name__)

def detect_communities(nodes, edges):
    """Simple community detection using connected components"""
    adj = collections.defaultdict(set)
    for e in edges:
        adj[e["from"]].add(e["to"])
        adj[e["to"]].add(e["from"])
    visited = set()
    communities = []
    for node in nodes:
        nid = node["id"]
        if nid not in visited and node.get("fraud"):
            community = []
            stack = [nid]
            while stack:
                n = stack.pop()
                if n not in visited:
                    visited.add(n)
                    community.append(n)
                    stack.extend(adj[n] - visited)
            if len(community) > 1:
                communities.append(community)
    return communities

@graph_bp.route("/network", methods=["GET"])
@jwt_required()
def fraud_network():
    from database.models import Transaction
    txns = Transaction.query.order_by(Transaction.created_at.desc()).limit(50).all()
    nodes = []
    edges = []

    for t in txns:
        nodes.append({
            "id": f"tx_{t.id}",
            "type": "transaction",
            "verdict": "fraud" if t.is_fraud else "legit",
            "amount": t.amount,
            "label": f"${t.amount:,.0f}",
            "risk": t.risk_level,
            "category": t.fraud_category,
            "ip": t.ip_address,
            "device": t.device_fingerprint,
            "ts": t.created_at.isoformat()
        })

    # Link by shared IP
    fraud_txns = [t for t in txns if t.is_fraud]
    ip_groups = collections.defaultdict(list)
    device_groups = collections.defaultdict(list)
    for t in fraud_txns:
        if t.ip_address and t.ip_address != "127.0.0.1":
            ip_groups[t.ip_address].append(t.id)
        if t.device_fingerprint:
            device_groups[t.device_fingerprint].append(t.id)

    for ip, ids in ip_groups.items():
        if len(ids) > 1:
            for i in range(len(ids)-1):
                edges.append({
                    "from": f"tx_{ids[i]}", "to": f"tx_{ids[i+1]}",
                    "type": "shared_ip", "strength": "HIGH",
                    "label": f"Shared IP: {ip[:15]}..."
                })

    for dev, ids in device_groups.items():
        if len(ids) > 1:
            for i in range(len(ids)-1):
                edges.append({
                    "from": f"tx_{ids[i]}", "to": f"tx_{ids[i+1]}",
                    "type": "shared_device", "strength": "CRITICAL",
                    "label": f"Same device: {dev}"
                })

    # Amount similarity links
    for i, t1 in enumerate(fraud_txns):
        for t2 in fraud_txns[i+1:i+4]:
            if abs(t1.amount - t2.amount) < t1.amount * 0.05:  # within 5%
                edges.append({
                    "from": f"tx_{t1.id}", "to": f"tx_{t2.id}",
                    "type": "amount_match", "strength": "MEDIUM",
                    "label": f"Similar amount: ${t1.amount:,.0f}"
                })

    communities = detect_communities(nodes, edges)
    return jsonify({
        "nodes": nodes[:30],
        "edges": edges[:40],
        "communities": communities,
        "stats": {
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "fraud_nodes": len(fraud_txns),
            "communities_detected": len(communities),
            "shared_ip_links": len([e for e in edges if e["type"]=="shared_ip"]),
            "shared_device_links": len([e for e in edges if e["type"]=="shared_device"])
        }
    })

@graph_bp.route("/rings", methods=["GET"])
@jwt_required()
def detect_rings():
    from database.models import Transaction
    fraud_txns = Transaction.query.filter_by(is_fraud=True).order_by(
        Transaction.created_at.desc()).limit(100).all()

    rings = []
    ip_groups = collections.defaultdict(list)
    device_groups = collections.defaultdict(list)
    category_groups = collections.defaultdict(list)

    for t in fraud_txns:
        if t.ip_address and t.ip_address != "127.0.0.1":
            ip_groups[t.ip_address].append(t)
        if t.device_fingerprint:
            device_groups[t.device_fingerprint].append(t)
        if t.fraud_category:
            category_groups[t.fraud_category].append(t)

    ring_id = 1
    for ip, txns in ip_groups.items():
        if len(txns) >= 2:
            rings.append({
                "id": f"RING-{ring_id:03d}",
                "type": "IP-Based Fraud Ring",
                "link_type": "Shared IP Address",
                "shared_attribute": ip,
                "members": len(txns),
                "total_amount": sum(t.amount for t in txns),
                "categories": list(set(t.fraud_category for t in txns if t.fraud_category)),
                "risk": "CRITICAL",
                "first_seen": min(t.created_at for t in txns).isoformat(),
                "last_seen": max(t.created_at for t in txns).isoformat(),
                "description": f"Coordinated fraud from IP {ip} — {len(txns)} transactions totaling ${sum(t.amount for t in txns):,.0f}"
            })
            ring_id += 1

    for dev, txns in device_groups.items():
        if len(txns) >= 2:
            rings.append({
                "id": f"RING-{ring_id:03d}",
                "type": "Device-Based Fraud Ring",
                "link_type": "Shared Device Fingerprint",
                "shared_attribute": dev,
                "members": len(txns),
                "total_amount": sum(t.amount for t in txns),
                "categories": list(set(t.fraud_category for t in txns if t.fraud_category)),
                "risk": "CRITICAL",
                "first_seen": min(t.created_at for t in txns).isoformat(),
                "last_seen": max(t.created_at for t in txns).isoformat(),
                "description": f"Same device used for {len(txns)} fraud transactions — likely stolen device or malware"
            })
            ring_id += 1

    for cat, txns in category_groups.items():
        if len(txns) >= 3:
            rings.append({
                "id": f"RING-{ring_id:03d}",
                "type": f"{cat} Pattern",
                "link_type": "Fraud Category Cluster",
                "shared_attribute": cat,
                "members": len(txns),
                "total_amount": sum(t.amount for t in txns),
                "categories": [cat],
                "risk": "HIGH",
                "first_seen": min(t.created_at for t in txns).isoformat(),
                "last_seen": max(t.created_at for t in txns).isoformat(),
                "description": f"Cluster of {len(txns)} {cat} incidents — possible coordinated campaign"
            })
            ring_id += 1

    return jsonify({
        "rings": sorted(rings, key=lambda r: r["total_amount"], reverse=True),
        "total": len(rings),
        "total_fraud_amount": sum(r["total_amount"] for r in rings)
    })

@graph_bp.route("/entities", methods=["GET"])
@jwt_required()
def linked_entities():
    from database.models import Transaction
    fraud_txns = Transaction.query.filter_by(is_fraud=True).all()
    entities = []
    ip_map = collections.defaultdict(list)
    for t in fraud_txns:
        if t.ip_address:
            ip_map[t.ip_address].append(t.id)
    for ip, tx_ids in ip_map.items():
        entities.append({
            "type": "IP_ADDRESS",
            "value": ip,
            "linked_transactions": tx_ids,
            "risk_score": min(100, len(tx_ids)*20),
            "label": f"IP: {ip}"
        })
    return jsonify({"entities": entities[:20], "total": len(entities)})
