from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import hashlib

auth_bp = Blueprint("auth", __name__)

USERS = {
    "admin": hashlib.sha256("admin123".encode()).hexdigest(),
    "analyst": hashlib.sha256("analyst456".encode()).hexdigest(),
}
ROLES = {"admin": "admin", "analyst": "viewer"}

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body required"}), 400
    username = data.get("username", "").strip()
    password = data.get("password", "")
    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400
    hashed = hashlib.sha256(password.encode()).hexdigest()
    if USERS.get(username) != hashed:
        return jsonify({"error": "Invalid credentials"}), 401
    token = create_access_token(identity=username,
        additional_claims={"role": ROLES.get(username, "viewer")})
    return jsonify({"access_token": token, "username": username,
        "role": ROLES.get(username, "viewer")})

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    return jsonify({"username": get_jwt_identity()})