import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.store import reset_store

client = TestClient(app)


@pytest.fixture(autouse=True)
def fresh_store():
    reset_store()


def test_health():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_list_products():
    resp = client.get("/api/products")
    assert resp.status_code == 200
    products = resp.json()
    assert len(products) == 8
    assert products[0]["name"] == "Wireless Mouse"


def test_get_product_by_id():
    resp = client.get("/api/products/2")
    assert resp.status_code == 200
    assert resp.json()["name"] == "Mechanical Keyboard"


def test_get_missing_product_returns_404():
    resp = client.get("/api/products/999")
    assert resp.status_code == 404


def test_search_matches_exact_name_fragment():
    resp = client.get("/api/products/search", params={"q": "Laptop"})
    assert resp.status_code == 200
    names = [p["name"] for p in resp.json()]
    assert "Laptop Stand" in names
