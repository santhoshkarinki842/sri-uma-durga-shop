"""Idempotent first-run data: default admin, shop settings, starter menu."""

from lib.auth import hash_password
from lib.db import db
from models.shop import Item, ShopSettings

SWEET_IMG = "https://images.unsplash.com/photo-1758910536889-43ce7b3199fd?crop=entropy&cs=srgb&fm=jpg&q=70&w=800"
SWEET_IMG2 = "https://images.unsplash.com/photo-1646578515903-67873a5398f9?crop=entropy&cs=srgb&fm=jpg&q=70&w=800"
HOT_IMG = "https://images.unsplash.com/photo-1601050690597-df0568f70950?crop=entropy&cs=srgb&fm=jpg&q=70&w=800"
HOT_IMG2 = "https://images.unsplash.com/photo-1589786742305-f24d19eedbe5?crop=entropy&cs=srgb&fm=jpg&q=70&w=800"

STARTER_ITEMS = [
    ("Kakinada Kaja", "sweets", "Layered, syrup-soaked crispy kaja", 180, "500 g", SWEET_IMG2),
    ("Pootharekulu", "sweets", "Paper-thin rice sheets with jaggery & ghee", 300, "10 pcs", SWEET_IMG),
    ("Bobbatlu", "sweets", "Soft puran poli with chana dal & jaggery", 150, "5 pcs", SWEET_IMG2),
    ("Gulab Jamun", "sweets", "Melt-in-mouth khoya jamuns in rose syrup", 120, "500 g", SWEET_IMG),
    ("Boondi Laddu", "sweets", "Pure ghee boondi laddu with cashews", 200, "500 g", SWEET_IMG2),
    ("Sunnundalu", "sweets", "Roasted urad dal & jaggery laddus", 250, "500 g", SWEET_IMG),
    ("Chekkalu", "hot", "Crispy rice crackers with chana dal & curry leaves", 140, "500 g", HOT_IMG2),
    ("Jantikalu / Murukku", "hot", "Classic crunchy spiral murukku", 130, "500 g", HOT_IMG2),
    ("Ribbon Pakoda", "hot", "Spicy gram flour ribbons", 130, "500 g", HOT_IMG2),
    ("Karapusa", "hot", "Thin spicy sev, Andhra style", 120, "500 g", HOT_IMG2),
    ("Boondi Mixture", "hot", "Spicy mixture with peanuts & curry leaves", 150, "500 g", HOT_IMG),
    ("Samosa", "hot", "Hot potato samosas, made fresh", 60, "6 pcs", HOT_IMG),
]


async def bootstrap() -> None:
    if not await db.admins.find_one({"username": "admin"}):
        await db.admins.insert_one({"username": "admin", "password_hash": hash_password("admin123")})
    if not await db.settings.find_one({"_key": "shop"}):
        await db.settings.insert_one({"_key": "shop", **ShopSettings().model_dump()})
    if await db.items.count_documents({}) == 0:
        await db.items.insert_many(
            [
                Item(name=n, category=c, description=d, price=p, unit=u, image_url=img).model_dump()
                for n, c, d, p, u, img in STARTER_ITEMS
            ]
        )
