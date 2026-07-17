from app import app


def test_divide_route_by_zero_returns_400():
    client = app.test_client()
    response = client.get("/calc/divide?a=10&b=0")
    assert response.status_code == 400
    assert response.get_json() == {"error": "cannot divide by zero"}


def test_divide_route_returns_result():
    client = app.test_client()
    response = client.get("/calc/divide?a=10&b=2")
    assert response.status_code == 200
    assert response.get_json() == {"result": 5.0}
