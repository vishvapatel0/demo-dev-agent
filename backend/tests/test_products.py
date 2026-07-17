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
    assert len(products) == 13
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


@pytest.mark.parametrize("query", ["laptop", "LAPTOP", "Laptop", "lApToP"])
def test_search_is_case_insensitive_for_name(query):
    resp = client.get("/api/products/search", params={"q": query})
    assert resp.status_code == 200
    names = [p["name"] for p in resp.json()]
    assert "Laptop Stand" in names


def test_search_is_case_insensitive_for_description():
    resp = client.get("/api/products/search", params={"q": "BACKLIT"})
    assert resp.status_code == 200
    names = [p["name"] for p in resp.json()]
    assert "Mechanical Keyboard" in names


def test_sony_earphones_are_listed():
    resp = client.get("/api/products/search", params={"q": "sony"})
    assert resp.status_code == 200
    names = [p["name"] for p in resp.json()]
    assert "Sony Wireless Earphones" in names


@pytest.mark.parametrize(
    "name,category",
    [
        ("USB Flash Drive 16GB", "storage"),
        ("Portable SSD 5TB", "storage"),
        ("USB Flash Drive 64GB", "storage"),
        ("External HDD 2TB", "storage"),
    ],
)
def test_storage_devices_are_listed_with_storage_category(name, category):
    resp = client.get("/api/products")
    assert resp.status_code == 200
    matches = [p for p in resp.json() if p["name"] == name]
    assert len(matches) == 1
    assert matches[0]["category"] == category
