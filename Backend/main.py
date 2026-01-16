import os
import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends, Response, Cookie, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, constr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from openai import OpenAI

from app.db import engine, Base, get_db
from app.models import User, RefreshSession, Message
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    hash_refresh_token,
    refresh_expires_at,
)
from app.auth_debug import require_user


# ---------------- Logging ----------------

def setup_logging() -> None:
    log_dir = Path(os.getenv("LOG_DIR", "logs"))
    log_dir.mkdir(parents=True, exist_ok=True)

    app_log = log_dir / "app.log"
    auth_log = log_dir / "auth.log"

    level_name = os.getenv("LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)

    fmt = logging.Formatter(
        fmt="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    root = logging.getLogger()
    root.setLevel(level)

    # не плодим handlers при reload
    if root.handlers:
        return

    sh = logging.StreamHandler()
    sh.setLevel(level)
    sh.setFormatter(fmt)
    root.addHandler(sh)

    fh = RotatingFileHandler(
        app_log,
        maxBytes=5 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8",
    )
    fh.setLevel(level)
    fh.setFormatter(fmt)
    root.addHandler(fh)

    auth_handler = RotatingFileHandler(
        auth_log,
        maxBytes=5 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8",
    )
    auth_handler.setLevel(level)
    auth_handler.setFormatter(fmt)

    auth_logger = logging.getLogger("auth")
    auth_logger.setLevel(level)
    auth_logger.addHandler(auth_handler)
    auth_logger.propagate = True


setup_logging()
log = logging.getLogger("app")
auth_log = logging.getLogger("auth")


# ---------------- Env ----------------

ALLOW_ORIGINS = ["http://127.0.0.1:8080", "http://localhost:8080"]

OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")
API_KEY = os.getenv("API_KEY")
BASE_URL = os.getenv("BASE_URL")

if not API_KEY:
    raise RuntimeError("API_KEY is missing (set in Backend/.env)")
if not BASE_URL:
    raise RuntimeError("BASE_URL is missing (set in Backend/.env)")

client = OpenAI(api_key=API_KEY, base_url=BASE_URL)

COOKIE_NAME = "refresh_token"


# ---------------- App ----------------

app = FastAPI()
log.info("FASTAPI BOOTED: main.py")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------- Schemas ----------------

class RegisterIn(BaseModel):
    name: constr(min_length=2, max_length=60)
    email: EmailStr
    password: constr(min_length=8, max_length=64)


class LoginIn(BaseModel):
    email: EmailStr
    password: constr(min_length=1, max_length=128)


class ChatIn(BaseModel):
    message: constr(min_length=1, max_length=4000)


# ---------------- Startup ----------------

@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    log.info("DB ready (create_all done)")


# ---------------- Auth endpoints ----------------

@app.post("/register")
async def register(data: RegisterIn, db: AsyncSession = Depends(get_db)):
    email = str(data.email).lower().strip()

    q = await db.execute(select(User).where(User.email == email))
    if q.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="User already exists")

    user = User(
        name=data.name.strip(),
        email=email,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    auth_log.info("REGISTER ok user_id=%s email=%s", user.id, email)
    return {"success": True}


@app.post("/login")
async def login(data: LoginIn, response: Response, db: AsyncSession = Depends(get_db)):
    email = str(data.email).lower().strip()

    q = await db.execute(select(User).where(User.email == email))
    user = q.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        auth_log.warning("LOGIN fail email=%s", email)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access = create_access_token(user.id)

    refresh = create_refresh_token()
    token_hash = hash_refresh_token(refresh)

    session = RefreshSession(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=refresh_expires_at(),
    )
    db.add(session)
    await db.commit()

    response.set_cookie(
        key=COOKIE_NAME,
        value=refresh,
        httponly=True,
        secure=False,   # в проде True + https
        samesite="lax",
        max_age=14 * 24 * 3600,
        path="/",
    )

    auth_log.info("LOGIN ok user_id=%s email=%s", user.id, email)
    return {"access_token": access, "token_type": "bearer"}


@app.post("/logout")
async def logout(
    response: Response,
    refresh_token: Optional[str] = Cookie(default=None, alias=COOKIE_NAME),
    db: AsyncSession = Depends(get_db),
):
    if refresh_token:
        token_hash = hash_refresh_token(refresh_token)
        await db.execute(
            RefreshSession.__table__.delete().where(RefreshSession.token_hash == token_hash)
        )
        await db.commit()
        auth_log.info("LOGOUT ok (session removed)")

    response.delete_cookie(COOKIE_NAME, path="/")
    return {"success": True}


@app.post("/refresh")
async def refresh(
    response: Response,
    refresh_token: Optional[str] = Cookie(default=None, alias=COOKIE_NAME),
    db: AsyncSession = Depends(get_db),
):
    if not refresh_token:
        auth_log.warning("REFRESH fail: no refresh cookie")
        raise HTTPException(status_code=401, detail="No refresh cookie")

    token_hash = hash_refresh_token(refresh_token)
    q = await db.execute(select(RefreshSession).where(RefreshSession.token_hash == token_hash))
    session = q.scalar_one_or_none()

    if not session:
        auth_log.warning("REFRESH fail: invalid refresh token")
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    # приводим к UTC-aware, чтобы сравнение было корректным
    expires_at = session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    now = datetime.now(timezone.utc)

    if expires_at < now:
        await db.execute(
            RefreshSession.__table__.delete().where(RefreshSession.id == session.id)
        )
        await db.commit()
        auth_log.warning("REFRESH fail: expired (session deleted)")
        raise HTTPException(status_code=401, detail="Refresh expired")

    access = create_access_token(session.user_id)
    auth_log.info("REFRESH ok user_id=%s", session.user_id)
    return {"access_token": access, "token_type": "bearer"}


# ---------------- Chat endpoint (protected) ----------------

@app.post("/chat")
async def chat(
    data: ChatIn,
    request: Request,
    db: AsyncSession = Depends(get_db),
    token_payload=Depends(require_user),  # ✅ диагностика 401 здесь
):
    raw_user_id = token_payload.get("user_id") or token_payload.get("sub")
    if raw_user_id is None:
        raise HTTPException(
            status_code=401,
            detail={"code": "no_user_in_token", "message": "Token has no user_id/sub"},
        )

    try:
        user_id = int(raw_user_id)
    except Exception:
        raise HTTPException(
            status_code=401,
            detail={"code": "bad_user_id", "message": f"Bad user_id in token: {raw_user_id}"},
        )

    msg = data.message.strip()

    # ✅ сохраняем user message
    db.add(Message(user_id=user_id, role="user", content=msg))
    await db.commit()

    try:
        resp = client.responses.create(
            model=OPENAI_MODEL,
            input=[
                {"role": "developer", "content": "Ты AI-ассистент. Отвечай по-русски, кратко и по делу."},
                {"role": "user", "content": msg},
            ],
            store=False,
        )
    except Exception as e:
        log.exception("LLM error user_id=%s: %s", user_id, str(e))
        raise HTTPException(status_code=502, detail=f"LLM error: {str(e)}")

    reply = getattr(resp, "output_text", None) or "Пустой ответ от модели."

    # ✅ сохраняем assistant message
    db.add(Message(user_id=user_id, role="assistant", content=reply))
    await db.commit()

    return {"reply": reply}
