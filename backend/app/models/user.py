import uuid
import enum
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from passlib.hash import bcrypt
from app import db


class UserRole(enum.Enum):
    ADMIN = 'admin'
    ANALYST = 'analyst'
    SUPERVISOR = 'supervisor'


class User(db.Model):
    """User model for SOC analysts and administrators."""
    __tablename__ = 'users'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.Enum(UserRole), nullable=False, default=UserRole.ANALYST)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)

    def set_password(self, password: str):
        """Hash and set the password."""
        self.password_hash = bcrypt.hash(password)

    def check_password(self, password: str) -> bool:
        """Verify password."""
        return bcrypt.verify(password, self.password_hash)

    def to_dict(self) -> dict:
        """Serialize user to dictionary (excluding password)."""
        return {
            'id': str(self.id),
            'username': self.username,
            'email': self.email,
            'role': self.role.value,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'last_login': self.last_login.isoformat() if self.last_login else None
        }
