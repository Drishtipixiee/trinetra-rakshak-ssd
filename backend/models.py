from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()


class Incident(db.Model):
    __tablename__ = 'incidents'

    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    type = db.Column(db.String(50), nullable=False)       # PERSON, VEHICLE, DRONE, WILDLIFE, MINING
    sector = db.Column(db.String(50), nullable=False)
    severity = db.Column(db.String(20), nullable=False)   # CRITICAL, WARNING, ALL-CLEAR
    description = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(20), default='ACTIVE')   # ACTIVE, RESOLVED, DISMISSED
    risk_score = db.Column(db.Integer, default=50)        # 0-100

    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'type': self.type,
            'sector': self.sector,
            'severity': self.severity,
            'description': self.description,
            'status': self.status,
            'risk_score': self.risk_score,
        }


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(30), default='OFFICER')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class LoginAudit(db.Model):
    __tablename__ = 'login_audit'

    id = db.Column(db.Integer, primary_key=True)
    officer_id = db.Column(db.String(80), nullable=False)
    ip = db.Column(db.String(45), default='0.0.0.0')
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    success = db.Column(db.Boolean, default=True)
