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
    {"id": 9, "name": "Sony Wireless Earphones", "description": "Sony in-ear Bluetooth earphones with noise isolation",
     "price": 129.99, "stock": 35, "category": "audio"},
    {"id": 10, "name": "USB Flash Drive 16GB", "description": "Compact 16GB USB 2.0 pen drive",
     "price": 6.99, "stock": 100, "category": "storage"},
    {"id": 11, "name": "Portable SSD 5TB", "description": "USB-C portable solid state drive with 5TB capacity",
     "price": 429.99, "stock": 10, "category": "storage"},
    {"id": 12, "name": "USB Flash Drive 64GB", "description": "Compact 64GB USB 3.1 pen drive",
     "price": 12.99, "stock": 80, "category": "storage"},
    {"id": 13, "name": "External HDD 2TB", "description": "USB 3.0 portable external hard drive, 2TB capacity",
     "price": 69.99, "stock": 22, "category": "storage"},
]


def reset_store():
    PRODUCTS.clear()
    PRODUCTS.extend({**p} for p in _CATALOG)
    CART.clear()
    ORDERS.clear()


reset_store()
