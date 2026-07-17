"""In-memory data store. Reset with reset_store() (used by tests)."""

PRODUCTS = []
CART = {}   # product_id -> quantity
ORDERS = []

_CATALOG = [
    {"id": 1, "name": "Wireless Mouse", "description": "Ergonomic 2.4GHz wireless mouse",
     "price": 24.99, "stock": 50, "category": "electronics"},
    {"id": 2, "name": "Mechanical Keyboard", "description": "RGB backlit mechanical keyboard",
     "price": 89.99, "stock": 30, "category": "electronics"},
    {"id": 3, "name": "Laptop Stand", "description": "Adjustable aluminium laptop stand",
     "price": 39.99, "stock": 20, "category": "accessories"},
    {"id": 4, "name": "USB-C Hub", "description": "7-in-1 USB-C hub with HDMI",
     "price": 49.99, "stock": 40, "category": "accessories"},
    {"id": 5, "name": "Noise Cancelling Headphones", "description": "Over-ear Bluetooth headphones",
     "price": 199.99, "stock": 15, "category": "audio"},
    {"id": 6, "name": "Webcam 1080p", "description": "Full HD webcam with microphone",
     "price": 59.99, "stock": 25, "category": "electronics"},
    {"id": 7, "name": "Desk Mat", "description": "Extended desk mat 90x40cm",
     "price": 19.99, "stock": 60, "category": "accessories"},
    {"id": 8, "name": "Portable SSD 1TB", "description": "USB 3.2 portable solid state drive",
     "price": 109.99, "stock": 18, "category": "storage"},
]


def reset_store():
    PRODUCTS.clear()
    PRODUCTS.extend({**p} for p in _CATALOG)
    CART.clear()
    ORDERS.clear()


reset_store()
