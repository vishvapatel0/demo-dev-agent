from app import app


def test_version():
    client = app.test_client()
    response = client.get("/version")
    assert response.status_code == 200
    assert response.get_json() == {"version": "1.0.0"}
