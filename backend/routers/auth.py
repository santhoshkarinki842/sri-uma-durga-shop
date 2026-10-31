from fastapi import APIRouter, Depends, HTTPException, Response

from lib.auth import COOKIE_NAME, TOKEN_DAYS, hash_password, make_token, require_admin, verify_password
from lib.db import db
from models.shop import AdminMe, ChangePasswordRequest, LoginRequest, OkResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=AdminMe)
async def login(body: LoginRequest, response: Response):
    admin = await db.admins.find_one({"username": body.username.strip()})
    if not admin or not verify_password(body.password, admin["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid user ID or password")
    response.set_cookie(
        COOKIE_NAME,
        make_token(admin["username"]),
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=TOKEN_DAYS * 86400,
        path="/",
    )
    return AdminMe(username=admin["username"])


@router.post("/logout", response_model=OkResponse)
async def logout(response: Response):
    response.delete_cookie(COOKIE_NAME, path="/")
    return OkResponse()


@router.get("/me", response_model=AdminMe)
async def me(username: str = Depends(require_admin)):
    return AdminMe(username=username)


@router.post("/change-password", response_model=OkResponse)
async def change_password(body: ChangePasswordRequest, username: str = Depends(require_admin)):
    admin = await db.admins.find_one({"username": username})
    if not admin or not verify_password(body.current_password, admin["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is wrong")
    await db.admins.update_one({"username": username}, {"$set": {"password_hash": hash_password(body.new_password)}})
    return OkResponse()
