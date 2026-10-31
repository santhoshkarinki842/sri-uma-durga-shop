from typing import List

from fastapi import APIRouter, Depends, HTTPException

from lib.auth import require_admin
from lib.db import db
from models.shop import Item, ItemBase, OkResponse

router = APIRouter(prefix="/items", tags=["items"])


@router.get("", response_model=List[Item])
async def list_items():
    docs = await db.items.find({}, {"_id": 0}).sort([("category", -1), ("name", 1)]).to_list(1000)
    return [Item(**d) for d in docs]


@router.post("", response_model=Item, dependencies=[Depends(require_admin)])
async def create_item(body: ItemBase):
    item = Item(**body.model_dump())
    await db.items.insert_one(item.model_dump())
    return item


@router.put("/{id}", response_model=Item, dependencies=[Depends(require_admin)])
async def update_item(id: str, body: ItemBase):
    res = await db.items.update_one({"id": id}, {"$set": body.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return Item(id=id, **body.model_dump())


@router.delete("/{id}", response_model=OkResponse, dependencies=[Depends(require_admin)])
async def delete_item(id: str):
    res = await db.items.delete_one({"id": id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return OkResponse()
