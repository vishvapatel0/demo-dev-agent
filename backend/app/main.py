from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .store import CART, ORDERS, PRODUCTS

SORT_OPTIONS = {
    "price_asc": lambda p: p["price"],
    "price_desc": lambda p: -p["price"],
}


def _filter_and_sort_products(
    products: list,
    min_price: Optional[float],
    max_price: Optional[float],
    sort: Optional[str],
):
    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(
            status_code=400,
            detail="min_price cannot be greater than max_price",
        )

    results = products
    if min_price is not None:
        results = [p for p in results if p["price"] >= min_price]
    if max_price is not None:
        results = [p for p in results if p["price"] <= max_price]

    if sort is not None:
        if sort not in SORT_OPTIONS:
            raise HTTPException(
                status_code=400,
                detail=f"invalid sort option: {sort}",
            )
        results = sorted(results, key=SORT_OPTIONS[sort])

    return results


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
def list_products(
    min_price: Optional[float] = Query(default=None, ge=0),
    max_price: Optional[float] = Query(default=None, ge=0),
    sort: Optional[str] = None,
):
    return _filter_and_sort_products(PRODUCTS, min_price, max_price, sort)


@app.get("/api/products/search")
def search_products(
    q: str = "",
    min_price: Optional[float] = Query(default=None, ge=0),
    max_price: Optional[float] = Query(default=None, ge=0),
    sort: Optional[str] = None,
):
    q = q.lower()
    matches = [
        p for p in PRODUCTS
        if q in p["name"].lower() or q in p["description"].lower()
    ]
    return _filter_and_sort_products(matches, min_price, max_price, sort)


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
