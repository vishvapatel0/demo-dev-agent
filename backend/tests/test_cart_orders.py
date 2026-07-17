import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.store import reset_store

client = TestClient(app)


@pytest.fixture(autouse=True)
def fresh_store():
    reset_store()


def test_cart_starts_empty():
    resp = client.get("/api/cart")
    assert resp.status_code == 200
    assert resp.json() == {"items": [], "total": 0.0}


def test_add_item_to_cart():
    resp = client.post("/api/cart/items", json={"product_id": 1, "quantity": 2})
    assert resp.status_code == 201
    assert resp.json() == {"product_id": 1, "quantity": 2}


def test_add_unknown_product_returns_404():
    resp = client.post("/api/cart/items", json={"product_id": 999})
    assert resp.status_code == 404


def test_remove_item_from_cart():
    client.post("/api/cart/items", json={"product_id": 1})
    resp = client.delete("/api/cart/items/1")
    assert resp.status_code == 200
    assert client.get("/api/cart").json()["items"] == []


def test_single_item_total():
    client.post("/api/cart/items", json={"product_id": 7, "quantity": 1})
    resp = client.get("/api/cart")
    assert resp.json()["total"] == 19.99


def test_checkout_creates_order_and_clears_cart():
    client.post("/api/cart/items", json={"product_id": 1, "quantity": 1})
    resp = client.post("/api/orders")
    assert resp.status_code == 201
    order = resp.json()
    assert order["id"] == 1
    assert order["status"] == "confirmed"
    assert client.get("/api/cart").json()["items"] == []


def test_checkout_empty_cart_returns_400():
    resp = client.post("/api/orders")
    assert resp.status_code == 400


def test_multi_quantity_item_total():
    client.post("/api/cart/items", json={"product_id": 1, "quantity": 3})
    resp = client.get("/api/cart")
    assert resp.json()["total"] == 74.97


def test_multi_quantity_multi_item_total():
    client.post("/api/cart/items", json={"product_id": 1, "quantity": 3})
    client.post("/api/cart/items", json={"product_id": 7, "quantity": 2})
    resp = client.get("/api/cart")
    assert resp.json()["total"] == 114.95


def test_checkout_order_total_accounts_for_quantity():
    client.post("/api/cart/items", json={"product_id": 1, "quantity": 3})
    resp = client.post("/api/orders")
    assert resp.status_code == 201
    order = resp.json()
    assert order["total"] == 74.97
    assert order["items"][0]["quantity"] == 3


def test_add_to_cart_beyond_stock_returns_400():
    # product 5 (Noise Cancelling Headphones) has 15 in stock
    resp = client.post("/api/cart/items", json={"product_id": 5, "quantity": 500})
    assert resp.status_code == 400
    assert "15" in resp.json()["detail"]
    assert client.get("/api/cart").json()["items"] == []


def test_add_to_cart_up_to_stock_is_allowed():
    resp = client.post("/api/cart/items", json={"product_id": 5, "quantity": 15})
    assert resp.status_code == 201
    assert resp.json()["quantity"] == 15


def test_add_to_cart_accumulates_and_rejects_when_exceeding_stock():
    client.post("/api/cart/items", json={"product_id": 5, "quantity": 10})
    resp = client.post("/api/cart/items", json={"product_id": 5, "quantity": 10})
    assert resp.status_code == 400
    # first addition should be preserved, second (rejected) one not added
    assert client.get("/api/cart").json()["items"][0]["quantity"] == 10


def test_checkout_decrements_stock():
    client.post("/api/cart/items", json={"product_id": 5, "quantity": 5})
    resp = client.post("/api/orders")
    assert resp.status_code == 201
    product = client.get("/api/products/5").json()
    assert product["stock"] == 10


def test_second_order_exceeding_remaining_stock_is_rejected():
    # first order takes 10 of the 15 in stock, leaving 5
    client.post("/api/cart/items", json={"product_id": 5, "quantity": 10})
    resp1 = client.post("/api/orders")
    assert resp1.status_code == 201

    # adding more than the remaining 5 in stock to the cart is rejected
    resp2 = client.post("/api/cart/items", json={"product_id": 5, "quantity": 6})
    assert resp2.status_code == 400

    # stock should be unaffected
    product = client.get("/api/products/5").json()
    assert product["stock"] == 5


def test_update_cart_item_sets_quantity():
    client.post("/api/cart/items", json={"product_id": 1, "quantity": 2})
    resp = client.put("/api/cart/items/1", json={"quantity": 5})
    assert resp.status_code == 200
    assert resp.json() == {"product_id": 1, "quantity": 5}
    assert client.get("/api/cart").json()["items"][0]["quantity"] == 5


def test_update_cart_item_can_decrease_quantity():
    client.post("/api/cart/items", json={"product_id": 1, "quantity": 5})
    resp = client.put("/api/cart/items/1", json={"quantity": 1})
    assert resp.status_code == 200
    assert client.get("/api/cart").json()["items"][0]["quantity"] == 1


def test_update_cart_item_not_in_cart_returns_404():
    resp = client.put("/api/cart/items/1", json={"quantity": 1})
    assert resp.status_code == 404


def test_update_cart_item_rejects_zero_quantity():
    client.post("/api/cart/items", json={"product_id": 1, "quantity": 2})
    resp = client.put("/api/cart/items/1", json={"quantity": 0})
    assert resp.status_code == 422
    assert client.get("/api/cart").json()["items"][0]["quantity"] == 2


def test_update_cart_item_beyond_stock_returns_400():
    client.post("/api/cart/items", json={"product_id": 5, "quantity": 2})
    resp = client.put("/api/cart/items/5", json={"quantity": 500})
    assert resp.status_code == 400
    assert client.get("/api/cart").json()["items"][0]["quantity"] == 2


def test_checkout_rejects_when_stock_reduced_after_add_to_cart():
    # simulate stock shrinking between adding to cart and checking out
    from app.store import PRODUCTS

    client.post("/api/cart/items", json={"product_id": 5, "quantity": 15})
    for product in PRODUCTS:
        if product["id"] == 5:
            product["stock"] = 5

    resp = client.post("/api/orders")
    assert resp.status_code == 400
    assert client.get("/api/cart").json()["items"] != []
