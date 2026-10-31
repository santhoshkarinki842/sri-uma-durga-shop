from fastapi import APIRouter, Depends, HTTPException

from lib.auth import require_admin
from lib.db import db
from models.shop import QuoteRequest, QuoteResponse, ShopSettings

router = APIRouter(tags=["settings"])


async def load_settings() -> ShopSettings:
    doc = await db.settings.find_one({"_key": "shop"}, {"_id": 0, "_key": 0})
    return ShopSettings(**doc) if doc else ShopSettings()


def compute_delivery(settings: ShopSettings, distance_km: float, subtotal: float) -> QuoteResponse:
    slabs = sorted(settings.slabs, key=lambda s: s.max_km)
    for slab in slabs:
        if distance_km <= slab.max_km:
            return QuoteResponse(
                deliverable=True, delivery_fee=slab.fee, message=f"Delivery within {slab.max_km:g} km: ₹{slab.fee:g}"
            )
    limit = slabs[-1].max_km if slabs else 0
    if subtotal >= settings.far_min_order:
        return QuoteResponse(
            deliverable=True,
            delivery_fee=settings.far_fee,
            message=f"Long-distance delivery (above {limit:g} km): ₹{settings.far_fee:g}",
        )
    short = settings.far_min_order - subtotal
    return QuoteResponse(
        deliverable=False,
        delivery_fee=0,
        message=f"Above {limit:g} km we deliver only for orders of ₹{settings.far_min_order:g} or more. Add ₹{short:g} more.",
    )


@router.get("/settings", response_model=ShopSettings)
async def get_settings():
    return await load_settings()


@router.put("/settings", response_model=ShopSettings, dependencies=[Depends(require_admin)])
async def update_settings(body: ShopSettings):
    if not body.slabs:
        raise HTTPException(status_code=400, detail="At least one delivery slab is required")
    body.slabs = sorted(body.slabs, key=lambda s: s.max_km)
    await db.settings.update_one({"_key": "shop"}, {"$set": body.model_dump()}, upsert=True)
    return body


@router.post("/delivery/quote", response_model=QuoteResponse)
async def quote(body: QuoteRequest):
    return compute_delivery(await load_settings(), body.distance_km, body.subtotal)
