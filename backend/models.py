from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class Incident(db.Model):
    __tablename__ = 'incidents'
    
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    type = db.Column(db.String(50), nullable=False) # INTRUSION, WILDLIFE, DRONE, MINING
    sector = db.Column(db.String(50), nullable=False)
    severity = db.Column(db.String(20), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(20), default="PENDING")
    
    def to_dict(self):
        return {
            "id": f"INC-{1000 + self.id}",
            "db_id": self.id,
            "timestamp": self.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "type": self.type,
            "sector": self.sector,
            "severity": self.severity,
            "description": self.description,
            "status": self.status
        }

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False) # Will store SHA-256 string
    role = db.Column(db.String(20), default="OFFICER")
