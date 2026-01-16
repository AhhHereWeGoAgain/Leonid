import os
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

import jwt  # PyJWT
from jwt import ExpiredSignatureError, InvalidTokenError

logger = logging.getLogger("auth")
bearer = HTTPBearer(auto_error=False)

JWT_SECRET = os.getenv("JWT_SECRET", "")
JWT_ALG = os.getenv("JWT_ALG", "HS256")
AUTH_DEBUG = os.getenv("AUTH_DEBUG", "1") == "1"  # на проде поставь 0


def _mask_token(token: str) -> str:
    if not token:
        return ""
    return token[:12] + "..." + token[-6:] if len(token) > 20 else token[:8] + "..."


def _fail(
    request: Request,
    code: str,
    message: str,
    extra: Optional[Dict[str, Any]] = None,
) -> None:
    info = {
        "code": code,
        "message": message,
        "path": str(request.url.path),
        "method": request.method,
        "ip": request.client.host if request.client else None,
    }
    if extra:
        info.update(extra)

    logger.warning("AUTH_FAIL %s", info)

    if AUTH_DEBUG:
        raise HTTPException(status_code=401, detail=info)
    raise HTTPException(status_code=401, detail="Unauthorized")


def decode_access_token(token: str) -> Dict[str, Any]:
    # verify_aud отключаем (аудитория нам пока не нужна)
    return jwt.decode(
        token,
        JWT_SECRET,
        algorithms=[JWT_ALG],
        options={"verify_aud": False},
    )


async def require_user(request: Request) -> Dict[str, Any]:
    if not JWT_SECRET:
        _fail(request, "server_misconfig", "JWT_SECRET is empty (env missing)")

    creds: HTTPAuthorizationCredentials | None = await bearer(request)
    if creds is None:
        _fail(request, "missing_bearer", "Missing Authorization: Bearer <token> header")

    if creds.scheme.lower() != "bearer":
        _fail(request, "bad_scheme", f"Unsupported auth scheme: {creds.scheme}")

    token = creds.credentials
    if not token:
        _fail(request, "empty_token", "Bearer token is empty")

    try:
        payload = decode_access_token(token)

        user_id = payload.get("user_id") or payload.get("sub")
        if not user_id:
            _fail(
                request,
                "no_user_in_token",
                "Token payload has no user_id/sub",
                {"token": _mask_token(token), "payload_keys": list(payload.keys())},
            )

        exp = payload.get("exp")
        if exp:
            now = int(datetime.now(timezone.utc).timestamp())
            if int(exp) < now:
                _fail(
                    request,
                    "token_expired",
                    "Token is expired",
                    {"token": _mask_token(token), "exp": exp, "now": now},
                )

        return payload

    except ExpiredSignatureError:
        _fail(request, "token_expired", "Token is expired", {"token": _mask_token(token)})
    except InvalidTokenError as e:
        _fail(request, "token_invalid", f"Token invalid: {str(e)}", {"token": _mask_token(token)})
    except Exception as e:
        _fail(request, "auth_error", f"Auth exception: {str(e)}", {"token": _mask_token(token)})
