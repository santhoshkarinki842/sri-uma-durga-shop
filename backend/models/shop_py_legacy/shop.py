import uuid
from datetime import datetime, timezone
from typing import List, Literal, Optional

from pydantic import BaseModel, Field

Category = Literal["sweets", "hot"]
OrderStatus = Literal["placed", "shipped", "out_for_delivery", "delivered", "cancelled"]
PaymentMethod = Literal["phonepe", "cod"]
PaymentStatus = Literal["pending", "paid"]


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


# ---------- Items ----------
class ItemBase(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    category: Category
    description: str = ""
    price: float = Field(gt=0)
    unit: str = "250 g"
    image_url: str = ""
    available: bool = True


class Item(ItemBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))


# ---------- Settings ----------
class DeliverySlab(BaseModel):
    max_km: float = Field(gt=0)
    fee: float = Field(ge=0)


class ShopSettings(BaseModel):
    shop_name: str = "Sri Uma Durga Sweets & Hot"
    tagline: str = "Traditional Andhra sweets & crispy hot snacks, made fresh every day"
    phones: List[str] = ["9642278354", "9640250842"]
    whatsapp: str = "9642278354"
    address: str = "Katakoteswaram, Nidadavolu Mandal, East Godavari District, Andhra Pradesh 534305"
    upi_ids: List[str] = []
    slabs: List[DeliverySlab] = [
        DeliverySlab(max_km=3, fee=20),
        DeliverySlab(max_km=6, fee=40),
        DeliverySlab(max_km=10, fee=60),
    ]
    far_min_order: float = 2500
    far_fee: float = 100


# ---------- Quote ----------
class QuoteRequest(BaseModel):
    distance_km: float = Field(ge=0)
    subtotal: float = Field(ge=0)


class QuoteResponse(BaseModel):
    deliverable: bool
    delivery_fee: float
    message: str


# ---------- Orders ----------
class OrderLineIn(BaseModel):
    item_id: str
    qty: int = Field(ge=1, le=100)


class OrderCreate(BaseModel):
    customer_name: str = Field(min_length=2, max_length=80)
    phone: str = Field(pattern=r"^[6-9]\d{9}$")
    address: str = Field(min_length=5, max_length=300)
    distance_km: float = Field(ge=0, le=500)
    payment_method: PaymentMethod
    transaction_id: str = ""
    items: List[OrderLineIn] = Field(min_length=1)


class OrderLine(BaseModel):
    item_id: str
    name: str
    unit: str
    price: float
    qty: int
    line_total: float


class StatusEvent(BaseModel):
    status: OrderStatus
    at: datetime


class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str
    customer_name: str
    phone: str
    address: str
    distance_km: float
    items: List[OrderLine]
    subtotal: float
    delivery_fee: float
    total: float
    payment_method: PaymentMethod
    payment_status: PaymentStatus = "pending"
    transaction_id: str = ""
    status: OrderStatus = "placed"
    status_history: List[StatusEvent] = []
    admin_note: str = ""
    created_at: datetime = Field(default_factory=now_utc)


class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    payment_status: Optional[PaymentStatus] = None
    payment_method: Optional[PaymentMethod] = None
    admin_note: Optional[str] = None


# ---------- Auth ----------
class LoginRequest(BaseModel):
    username: str
    password: str


class AdminMe(BaseModel):
    username: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


class OkResponse(BaseModel):
    ok: bool = True
