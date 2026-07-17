from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .store import CART, ORDERS, PRODUCTS

app = FastAPI(title="ShopLite API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class CartItemIn(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1)


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=1)


def _find_product(product_id: int):
    for product in PRODUCTS:
        if product["id"] == product_id:
            return product
    return None


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/products")
def list_products():
    return PRODUCTS


@app.get("/api/products/search")
def search_products(q: str = ""):
    q = q.lower()
    return [
        p for p in PRODUCTS
        if q in p["name"].lower() or q in p["description"].lower()
    ]


@app.get("/api/products/{product_id}")
def get_product(product_id: int):
    product = _find_product(product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="product not found")
    return product


@app.get("/api/cart")
def view_cart():
    items = []
    total = 0.0
    for product_id, quantity in CART.items():
        product = _find_product(product_id)
        if product is None:
            continue
        items.append({
            "product_id": product_id,
            "name": product["name"],
            "price": product["price"],
            "quantity": quantity,
        })
        total += product["price"] * quantity
    return {"items": items, "total": round(total, 2)}


@app.post("/api/cart/items", status_code=201)
def add_to_cart(item: CartItemIn):
    product = _find_product(item.product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="product not found")
    requested_quantity = CART.get(item.product_id, 0) + item.quantity
    if requested_quantity > product["stock"]:
        raise HTTPException(
            status_code=400,
            detail=(
                f"only {product['stock']} unit(s) of '{product['name']}' "
                f"in stock, cannot add {requested_quantity}"
            ),
        )
    CART[item.product_id] = requested_quantity
    return {"product_id": item.product_id, "quantity": CART[item.product_id]}


@app.put("/api/cart/items/{product_id}")
def update_cart_item(product_id: int, item: CartItemUpdate):
    if product_id not in CART:
        raise HTTPException(status_code=404, detail="item not in cart")
    product = _find_product(product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="product not found")
    if item.quantity > product["stock"]:
        raise HTTPException(
            status_code=400,
            detail=(
                f"only {product['stock']} unit(s) of '{product['name']}' "
                f"in stock, cannot set quantity to {item.quantity}"
            ),
        )
    CART[product_id] = item.quantity
    return {"product_id": product_id, "quantity": CART[product_id]}


@app.delete("/api/cart/items/{product_id}")
def remove_from_cart(product_id: int):
    if product_id not in CART:
        raise HTTPException(status_code=404, detail="item not in cart")
    del CART[product_id]
    return {"removed": product_id}


@app.post("/api/orders", status_code=201)
def checkout():
    if not CART:
        raise HTTPException(status_code=400, detail="cart is empty")
    for product_id, quantity in CART.items():
        product = _find_product(product_id)
        if product is None:
            raise HTTPException(status_code=404, detail="product not found")
        if quantity > product["stock"]:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"only {product['stock']} unit(s) of '{product['name']}' "
                    f"in stock, cannot order {quantity}"
                ),
            )
    cart_view = view_cart()
    for product_id, quantity in CART.items():
        product = _find_product(product_id)
        product["stock"] -= quantity
    order = {
        "id": len(ORDERS) + 1,
        "items": cart_view["items"],
        "total": cart_view["total"],
        "status": "confirmed",
    }
    ORDERS.append(order)
    CART.clear()
    return order


@app.get("/api/orders")
def list_orders():
    return ORDERS
