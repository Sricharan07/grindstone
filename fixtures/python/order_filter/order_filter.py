def eligible_orders(orders: list[dict], minimum: int) -> list[int]:
    """Return paid order IDs whose total meets the minimum."""
    return [order["id"] for order in orders if order["status"] == "paid" and order["total"] > minimum]
