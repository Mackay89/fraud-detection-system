from flask import Flask, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import logging, os, sys

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

socketio = SocketIO()

def create_app():
    app = Flask(__name__)
    app.config["JWT_SECRET_KEY"] = "fraudshield-enterprise-2026"
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 7200
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fraudshield.db")
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    CORS(app, origins="*", allow_headers=["Content-Type","Authorization"], methods=["GET","POST","PUT","DELETE","OPTIONS"])
    JWTManager(app)
    socketio.init_app(app, cors_allowed_origins="*", async_mode="eventlet")
    from database.models import db
    db.init_app(app)
    with app.app_context():
        db.create_all()
        logger.info(f"SQLite DB ready: {db_path}")
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from routes.auth              import auth_bp
    from routes.real_predict      import predict_bp
    from routes.real_intelligence import intelligence_bp
    from routes.real_evidence     import evidence_bp
    from routes.real_atm          import atm_bp
    from routes.real_graph        import graph_bp
    from routes.real_behavioral   import behavioral_bp
    from routes.copilot           import copilot_bp
    from routes.telecom_forensics import telecom_bp
    app.register_blueprint(auth_bp,          url_prefix="/auth")
    app.register_blueprint(predict_bp,       url_prefix="/predict")
    app.register_blueprint(intelligence_bp,  url_prefix="/intel")
    app.register_blueprint(evidence_bp,      url_prefix="/evidence")
    app.register_blueprint(atm_bp,           url_prefix="/atm")
    app.register_blueprint(graph_bp,         url_prefix="/graph")
    app.register_blueprint(behavioral_bp,    url_prefix="/behavioral")
    app.register_blueprint(copilot_bp,       url_prefix="/copilot")
    app.register_blueprint(telecom_bp,       url_prefix="/telecom")
    @app.route("/health", methods=["GET"])
    def health():
        from database.models import Transaction, Case, Alert, Evidence
        try:
            stats = {"transactions": Transaction.query.count(), "fraud": Transaction.query.filter_by(is_fraud=True).count(), "cases": Case.query.count(), "open_cases": Case.query.filter_by(status="OPEN").count(), "alerts": Alert.query.filter_by(acknowledged=False).count(), "evidence": Evidence.query.count()}
        except Exception as e:
            stats = {"error": str(e)}
        return jsonify({"status": "ok", "service": "FraudShield Enterprise v4.0", "stats": stats})
    @app.errorhandler(404)
    def not_found(e): return jsonify({"error": "Not found"}), 404
    @app.errorhandler(500)
    def internal(e): return jsonify({"error": "Internal server error", "detail": str(e)}), 500
    return app

app = create_app()

if __name__ == "__main__":
    print("FraudShield Enterprise v4.0 starting on port 5000")
    socketio.run(app, host="0.0.0.0", port=5000, debug=False)
