import os
import uuid
import hashlib
from datetime import datetime, timedelta, timezone

import jwt
from passlib.context import CryptContext

JWT_SECRET = os.getenv("JWT_SECRET")
ACCESS_TTL_MINUTES = int(os.getenv("ACCESS_TTL_MINUTES", "15"))
REFRESH_TTL_DAYS = int(os.getenv("REFRESH_TTL_DAYS", "14"))

pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)



def create_access_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=ACCESS_TTL_MINUTES)).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def create_refresh_token() -> str:
    return uuid.uuid4().hex + uuid.uuid4().hex


def refresh_expires_at() -> datetime:
    return datetime.utcnow() + timedelta(days=REFRESH_TTL_DAYS)


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
