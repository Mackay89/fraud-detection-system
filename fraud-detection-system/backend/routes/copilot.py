from flask import Blueprint, request, jsonify
import os, logging, json, urllib.request, urllib.error

logger = logging.getLogger(__name__)
copilot_bp = Blueprint("copilot", __name__)

API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL   = "openai/gpt-oss-20b:free"

@copilot_bp.route("", methods=["POST", "OPTIONS"])
def copilot():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        return jsonify({"reply": "OPENROUTER_API_KEY not set. Get free key at openrouter.ai"}), 503
    data     = request.get_json()
    user_msg = data.get("message", "").strip()
    history  = data.get("history", [])
    context  = data.get("context", "No transactions yet.")
    if not user_msg:
        return jsonify({"reply": "Empty message."}), 400
    system = f"""You are an expert AI Fraud Detection Copilot for FraudShield. Help analysts understand fraud patterns and risk scores. Be concise and direct. Plain text only.\n\nRecent transactions:\n{context}"""
    messages = [{"role": "system", "content": system}]
    for h in history[:-1]:
        if h.get("role") in ("user","assistant") and h.get("content"):
            messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": user_msg})
    payload = json.dumps({"model": MODEL, "messages": messages, "max_tokens": 1024}).encode()
    req = urllib.request.Request(API_URL, data=payload,
        headers={"Content-Type":"application/json","Authorization":f"Bearer {api_key}","HTTP-Referer":"http://localhost:3000","X-Title":"FraudShield"},
        method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode())
            return jsonify({"reply": result["choices"][0]["message"]["content"]})
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        return jsonify({"reply": f"API error {e.code}: {body[:200]}"}), 500
    except Exception as e:
        return jsonify({"reply": f"Error: {str(e)}"}), 500
