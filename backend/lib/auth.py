"""Admin auth: PBKDF2 password hashes + JWT in an httpOnly cookie."""

import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException, Request

from lib.db import db

COOKIE_NAME = "sud_admin"
JWT_SECRET = os.environ.get("JWT_SECRET", "change-me-sri-uma-durga")
TOKEN_DAYS = 7


def hash_password(password: str, salt: str | None = None) -> str:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 200_000).hex()
    return f"{salt}${digest}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, _ = stored.split("$", 1)
    except ValueError:
        return False
    return hmac.compare_digest(hash_password(password, salt), stored)


def make_token(username: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(days=TOKEN_DAYS)
    return jwt.encode({"sub": username, "exp": exp}, JWT_SECRET, algorithm="HS256")


async def require_admin(request: Request) -> str:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Not logged in")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Session expired")
    username = payload.get("sub")
    if not username or not await db.admins.find_one({"username": username}):
        raise HTTPException(status_code=401, detail="Not authorised")
    return username
