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
