"""
Real SQLite database models for FraudShield.
Replaces in-memory storage with persistent SQLite (no Docker needed).
"""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class Transaction(db.Model):
    __tablename__ = 'transactions'
    id              = db.Column(db.Integer, primary_key=True)
    amount          = db.Column(db.Float, nullable=False)
    time_of_day     = db.Column(db.Integer)
    transaction_type= db.Column(db.Integer)
    merchant_category=db.Column(db.Integer)
    distance_from_home=db.Column(db.Float)
    num_transactions_today=db.Column(db.Integer)
    avg_amount_last_7d=db.Column(db.Float)
    is_foreign      = db.Column(db.Integer, default=0)
    new_device      = db.Column(db.Integer, default=0)
    is_bot_pattern  = db.Column(db.Integer, default=0)
    identity_risk   = db.Column(db.Integer, default=0)
    channel_risk    = db.Column(db.Integer, default=0)
    fraud_probability=db.Column(db.Float)
    is_fraud        = db.Column(db.Boolean, default=False)
    risk_level      = db.Column(db.String(20))
    fraud_category  = db.Column(db.String(100))
    fraud_detail    = db.Column(db.String(200))
    ip_address      = db.Column(db.String(50))
    device_fingerprint=db.Column(db.String(64))
    user_id         = db.Column(db.String(100))
    session_id      = db.Column(db.String(100))
    created_at      = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'amount': self.amount,
            'transaction_type': self.transaction_type,
            'merchant_category': self.merchant_category,
            'distance_from_home': self.distance_from_home,
            'is_fraud': self.is_fraud, 'fraud': self.is_fraud,
            'confidence': self.fraud_probability,
            'risk_level': self.risk_level,
            'fraud_category': self.fraud_category,
            'fraud_detail': self.fraud_detail,
            'ip_address': self.ip_address,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat(),
            'timestamp': self.created_at.isoformat(),
            'transaction_id': self.id
        }

class Case(db.Model):
    __tablename__ = 'cases'
    id          = db.Column(db.Integer, primary_key=True)
    case_ref    = db.Column(db.String(20), unique=True)
    title       = db.Column(db.String(200), nullable=False)
    category    = db.Column(db.String(100))
    severity    = db.Column(db.String(20), default='HIGH')
    status      = db.Column(db.String(20), default='OPEN')
    amount      = db.Column(db.Float, default=0)
    description = db.Column(db.Text)
    assigned_to = db.Column(db.String(100))
    timeline    = db.Column(db.Text, default='[]')
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at  = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.case_ref, 'title': self.title,
            'category': self.category, 'severity': self.severity,
            'status': self.status, 'amount': self.amount,
            'description': self.description,
            'assigned_to': self.assigned_to,
            'timeline': json.loads(self.timeline or '[]'),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Alert(db.Model):
    __tablename__ = 'alerts'
    id           = db.Column(db.Integer, primary_key=True)
    type         = db.Column(db.String(50))
    severity     = db.Column(db.String(20), default='HIGH')
    message      = db.Column(db.String(500))
    amount       = db.Column(db.Float, default=0)
    category     = db.Column(db.String(100))
    source       = db.Column(db.String(50), default='SYSTEM')
    acknowledged = db.Column(db.Boolean, default=False)
    ack_by       = db.Column(db.String(100))
    transaction_id=db.Column(db.Integer, db.ForeignKey('transactions.id'), nullable=True)
    created_at   = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'type': self.type,
            'severity': self.severity, 'message': self.message,
            'amount': self.amount, 'category': self.category,
            'source': self.source, 'acknowledged': self.acknowledged,
            'ts': self.created_at.isoformat()
        }

class Evidence(db.Model):
    __tablename__ = 'evidence'
    id           = db.Column(db.Integer, primary_key=True)
    evidence_ref = db.Column(db.String(20), unique=True)
    case_id      = db.Column(db.String(20))
    type         = db.Column(db.String(50))
    description  = db.Column(db.Text)
    data_hash    = db.Column(db.String(64))
    chain_hash   = db.Column(db.String(64))
    collected_by = db.Column(db.String(100))
    verified     = db.Column(db.Boolean, default=True)
    collected_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.evidence_ref, 'case_id': self.case_id,
            'type': self.type, 'description': self.description,
            'data_hash': self.data_hash, 'chain_hash': self.chain_hash,
            'collected_by': self.collected_by, 'verified': self.verified,
            'collected_at': self.collected_at.isoformat(),
            'compliance': ['PCI-DSS','POPIA','ISO27001']
        }

class ATMIncident(db.Model):
    __tablename__ = 'atm_incidents'
    id          = db.Column(db.Integer, primary_key=True)
    atm_id      = db.Column(db.String(20))
    location    = db.Column(db.String(200))
    type        = db.Column(db.String(50))
    severity    = db.Column(db.String(20))
    description = db.Column(db.Text)
    threat_score= db.Column(db.Integer, default=0)
    status      = db.Column(db.String(20), default='OPEN')
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': f'INC-{self.id}', 'atm_id': self.atm_id,
            'location': self.location, 'type': self.type,
            'severity': self.severity, 'description': self.description,
            'threat_score': self.threat_score, 'status': self.status,
            'created_at': self.created_at.isoformat()
        }

class InvestigationNote(db.Model):
    __tablename__ = 'investigation_notes'
    id          = db.Column(db.Integer, primary_key=True)
    case_id     = db.Column(db.String(20))
    analyst     = db.Column(db.String(100))
    notes       = db.Column(db.Text)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'case_id': self.case_id,
            'analyst': self.analyst, 'notes': self.notes,
            'created_at': self.created_at.isoformat()
        }

def init_db(app):
    db.init_app(app)
    with app.app_context():
        db.create_all()
        print("[DB] Tables created successfully")
