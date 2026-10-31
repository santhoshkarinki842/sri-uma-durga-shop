import random
from datetime import timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from lib.auth import require_admin
from lib.db import db
from models.shop import Order, OrderCreate, OrderLine, OrderUpdate, StatusEvent, now_utc
from routers.settings import compute_delivery, load_settings

router = APIRouter(prefix="/orders", tags=["orders"])


def _to_order(doc: dict) -> Order:
    if doc.get("created_at") and doc["created_at"].tzinfo is None:
        doc["created_at"] = doc["created_at"].replace(tzinfo=timezone.utc)
    for ev in doc.get("status_history", []):
        if ev["at"].tzinfo is None:
            ev["at"] = ev["at"].replace(tzinfo=timezone.utc)
    return Order(**doc)


async def _new_order_number() -> str:
    while True:
        num = f"SUD{random.randint(100000, 999999)}"
        if not await db.orders.find_one({"order_number": num}):
            return num


@router.post("", response_model=Order)
async def create_order(body: OrderCreate):
    ids = [line.item_id for line in body.items]
    items = {d["id"]: d for d in await db.items.find({"id": {"$in": ids}, "available": True}, {"_id": 0}).to_list(1000)}
    lines: List[OrderLine] = []
    for line in body.items:
        it = items.get(line.item_id)
        if not it:
            raise HTTPException(status_code=400, detail="Some items are no longer available. Please refresh your cart.")
        lines.append(
            OrderLine(
                item_id=it["id"], name=it["name"], unit=it["unit"], price=it["price"], qty=line.qty,
                line_total=round(it["price"] * line.qty, 2),
            )
        )
    subtotal = round(sum(l.line_total for l in lines), 2)
    quote = compute_delivery(await load_settings(), body.distance_km, subtotal)
    if not quote.deliverable:
        raise HTTPException(status_code=400, detail=quote.message)
    now = now_utc()
    order = Order(
        order_number=await _new_order_number(),
        customer_name=body.customer_name.strip(),
        phone=body.phone,
        address=body.address.strip(),
        distance_km=body.distance_km,
        items=lines,
        subtotal=subtotal,
        delivery_fee=quote.delivery_fee,
        total=round(subtotal + quote.delivery_fee, 2),
        payment_method=body.payment_method,
        transaction_id=body.transaction_id.strip(),
        status_history=[StatusEvent(status="placed", at=now)],
        created_at=now,
    )
    await db.orders.insert_one(order.model_dump())
    return order


@router.get("/track", response_model=Order)
async def track_order(order_number: str = Query(...), phone: str = Query(...)):
    doc = await db.orders.find_one({"order_number": order_number.strip().upper(), "phone": phone.strip()}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="No order found with this order number and phone")
    return _to_order(doc)


@router.get("/by-phone", response_model=List[Order])
async def orders_by_phone(phone: str = Query(..., pattern=r"^[6-9]\d{9}$")):
    docs = await db.orders.find({"phone": phone}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return [_to_order(d) for d in docs]


@router.get("", response_model=List[Order], dependencies=[Depends(require_admin)])
async def list_orders(status: Optional[str] = None):
    q = {"status": status} if status else {}
    docs = await db.orders.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [_to_order(d) for d in docs]


@router.patch("/{id}", response_model=Order, dependencies=[Depends(require_admin)])
async def update_order(id: str, body: OrderUpdate):
    doc = await db.orders.find_one({"id": id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    changes = body.model_dump(exclude_none=True)
    update: dict = {"$set": changes}
    if body.status and body.status != doc["status"]:
        update["$push"] = {"status_history": StatusEvent(status=body.status, at=now_utc()).model_dump()}
        if changes:
            await db.orders.update_one({"id": id}, update)
    return _to_order(await db.orders.find_one({"id": id}, {"_id": 0}))
