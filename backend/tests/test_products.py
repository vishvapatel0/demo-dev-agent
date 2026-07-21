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


def test_filter_by_min_price():
    resp = client.get("/api/products", params={"min_price": 100})
    assert resp.status_code == 200
    prices = [p["price"] for p in resp.json()]
    assert prices and all(price >= 100 for price in prices)


def test_filter_by_max_price():
    resp = client.get("/api/products", params={"max_price": 20})
    assert resp.status_code == 200
    prices = [p["price"] for p in resp.json()]
    assert prices and all(price <= 20 for price in prices)


def test_filter_by_min_and_max_price_range():
    resp = client.get("/api/products", params={"min_price": 20, "max_price": 60})
    assert resp.status_code == 200
    prices = [p["price"] for p in resp.json()]
    assert prices and all(20 <= price <= 60 for price in prices)


def test_filter_with_no_matches_returns_empty_list():
    resp = client.get("/api/products", params={"min_price": 100000})
    assert resp.status_code == 200
    assert resp.json() == []


def test_filter_min_price_greater_than_max_price_is_rejected():
    resp = client.get("/api/products", params={"min_price": 50, "max_price": 10})
    assert resp.status_code == 400
    assert "min_price" in resp.json()["detail"]


def test_filter_rejects_negative_prices():
    resp = client.get("/api/products", params={"min_price": -5})
    assert resp.status_code == 422


def test_sort_price_low_to_high():
    resp = client.get("/api/products", params={"sort": "price_asc"})
    assert resp.status_code == 200
    prices = [p["price"] for p in resp.json()]
    assert prices == sorted(prices)


def test_sort_price_high_to_low():
    resp = client.get("/api/products", params={"sort": "price_desc"})
    assert resp.status_code == 200
    prices = [p["price"] for p in resp.json()]
    assert prices == sorted(prices, reverse=True)


def test_sort_with_identical_prices_keeps_all_products():
    resp = client.get("/api/products", params={"sort": "price_asc"})
    assert resp.status_code == 200
    assert len(resp.json()) == 13


def test_invalid_sort_option_is_rejected():
    resp = client.get("/api/products", params={"sort": "bogus"})
    assert resp.status_code == 400


def test_sort_and_filter_combined():
    resp = client.get(
        "/api/products", params={"min_price": 10, "max_price": 100, "sort": "price_desc"}
    )
    assert resp.status_code == 200
    prices = [p["price"] for p in resp.json()]
    assert prices == sorted(prices, reverse=True)
    assert all(10 <= price <= 100 for price in prices)


def test_search_supports_filter_and_sort():
    resp = client.get(
        "/api/products/search",
        params={"q": "usb", "min_price": 10, "sort": "price_asc"},
    )
    assert resp.status_code == 200
    prices = [p["price"] for p in resp.json()]
    assert prices and prices == sorted(prices)
    assert all(price >= 10 for price in prices)
