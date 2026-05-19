from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import datetime, random, hashlib

telecom_bp = Blueprint("telecom", __name__)

SIM_SWAP_EVENTS = [
    {"msisdn":"+27821234567","event":"SIM_SWAP","carrier":"Vodacom","risk":"CRITICAL","detected_at":"2026-05-09T01:22:11","detail":"SIM swapped 2hrs before R45,000 transfer"},
    {"msisdn":"+27831234568","event":"SIM_SWAP","carrier":"MTN","risk":"HIGH","detected_at":"2026-05-09T03:14:33","detail":"Third SIM swap in 30 days"},
    {"msisdn":"+27841234569","event":"CALL_FORWARD","carrier":"Cell C","risk":"MEDIUM","detected_at":"2026-05-08T22:05:44","detail":"OTP call forwarding detected"},
]

SCAM_CALLS = [
    {"number":"+27105551234","type":"VISHING","confidence":94,"reported":127,"last_seen":"2026-05-09T04:11:00","script":"Impersonating SARS tax refund"},
    {"number":"+27875559876","type":"VOICE_CLONING","confidence":89,"reported":43,"last_seen":"2026-05-09T02:33:00","script":"AI-cloned bank manager voice"},
    {"number":"+27115558765","type":"OTP_INTERCEPT","confidence":97,"reported":201,"last_seen":"2026-05-09T05:01:00","script":"Fake bank security alert"},
]

@telecom_bp.route("/sim-swap", methods=["GET"])
@jwt_required()
def sim_swap_events():
    return jsonify({"events": SIM_SWAP_EVENTS, "total": len(SIM_SWAP_EVENTS),
                    "critical": len([e for e in SIM_SWAP_EVENTS if e["risk"]=="CRITICAL"])})

@telecom_bp.route("/check/<msisdn>", methods=["GET"])
@jwt_required()
def check_number(msisdn):
    event = next((e for e in SIM_SWAP_EVENTS if e["msisdn"]==msisdn), None)
    scam = next((s for s in SCAM_CALLS if s["number"]==msisdn), None)
    risk = "CRITICAL" if event and event["risk"]=="CRITICAL" else "HIGH" if scam else "LOW"
    return jsonify({
        "msisdn": msisdn,
        "risk_level": risk,
        "sim_swap_detected": event is not None,
        "sim_swap_detail": event,
        "scam_reported": scam is not None,
        "scam_detail": scam,
        "carrier_check": "Vodacom" if msisdn.startswith("+2782") else "MTN" if msisdn.startswith("+2783") else "Unknown",
        "otp_interception_risk": risk in ["HIGH","CRITICAL"],
        "recommendation": "BLOCK OTP" if risk=="CRITICAL" else "MONITOR" if risk=="HIGH" else "CLEAR"
    })

@telecom_bp.route("/scam-calls", methods=["GET"])
@jwt_required()
def scam_calls():
    return jsonify({"calls": SCAM_CALLS, "total": len(SCAM_CALLS)})

@telecom_bp.route("/voice-analysis", methods=["POST"])
@jwt_required()
def voice_analysis():
    data = request.get_json()
    score = random.randint(20, 98)
    return jsonify({
        "ai_voice_probability": score,
        "voice_cloning_detected": score > 75,
        "emotional_manipulation": score > 60,
        "risk_level": "CRITICAL" if score>85 else "HIGH" if score>65 else "LOW",
        "recommendation": "REJECT CALL" if score>85 else "FLAG FOR REVIEW" if score>65 else "LEGITIMATE",
        "analysis_time_ms": random.randint(80, 200)
    })
