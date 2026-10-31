{
    "status_checks": [IndexModel([("timestamp", DESCENDING)], name="timestamp_desc")],
    "items": [IndexModel([("id", ASCENDING)], name="id", unique=True)],
    "admins": [IndexModel([("username", ASCENDING)], name="username", unique=True)],
    "settings": [IndexModel([("_key", ASCENDING)], name="key", unique=True)],
    "orders": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("order_number", ASCENDING)], name="order_number", unique=True),
        IndexModel([("phone", ASCENDING), ("created_at", DESCENDING)], name="phone_created"),
        IndexModel([("status", ASCENDING), ("created_at", DESCENDING)], name="status_created"),
    ],
}