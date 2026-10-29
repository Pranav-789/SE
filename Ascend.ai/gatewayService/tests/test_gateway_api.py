import json

import httpx
from fastapi.testclient import TestClient

import main


client = TestClient(main.app)


def test_gateway_root_returns_online_status():
    """The root endpoint should expose gateway status and registered routes."""
    response = client.get("/")

    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Ascend.ai API Gateway"
    assert body["status"] == "online"
    assert "authService" in body["registered_services"]
    assert "travelService" in body["registered_services"]


def test_unknown_service_returns_404():
    """Requests to an unregistered service should be rejected."""
    response = client.get("/unknownService/some-endpoint")

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_travel_route_forwards_request(monkeypatch):
    """The /travel/* convenience route should forward to the travel service."""
    captured = {}

    async def fake_forward_request(service_url, method, path, body=None,
                                   headers=None, params=None):
        captured.update(
            service_url=service_url,
            method=method,
            path=path,
            body=body,
            params=params,
        )
        return httpx.Response(
            status_code=200,
            json={"status": "success", "response": "Test itinerary"},
        )

    monkeypatch.setattr(main, "forward_request", fake_forward_request)

    response = client.post(
        "/travel/ask?source=pytest",
        json={"query": "Plan a short trip to Pune"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert captured["service_url"] == main.services["travelService"]
    assert captured["method"] == "POST"
    assert captured["path"] == "/ask"
    assert json.loads(captured["body"].decode("utf-8")) == {
        "query": "Plan a short trip to Pune"
    }
    assert captured["params"]["source"] == "pytest"


def test_auth_route_forwards_to_auth_service(monkeypatch):
    """The /auth/* convenience route should target the authentication service."""
    captured = {}

    async def fake_forward_request(service_url, method, path, body=None,
                                   headers=None, params=None):
        captured.update(
            service_url=service_url,
            method=method,
            path=path,
        )
        return httpx.Response(
            status_code=200,
            json={"message": "Mock login endpoint reached"},
        )

    monkeypatch.setattr(main, "forward_request", fake_forward_request)

    response = client.post("/auth/login", json={"email": "test@example.com"})

    assert response.status_code == 200
    assert response.json()["message"] == "Mock login endpoint reached"
    assert captured["service_url"] == main.services["authService"]
    assert captured["method"] == "POST"
    assert captured["path"] == "/auth/login"


def test_gateway_preserves_upstream_status_and_body(monkeypatch):
    """The gateway should return the downstream response status and content."""
    async def fake_forward_request(*args, **kwargs):
        return httpx.Response(
            status_code=422,
            json={"detail": "Invalid input"},
            headers={"content-type": "application/json"},
        )

    monkeypatch.setattr(main, "forward_request", fake_forward_request)

    response = client.get("/travel/example")

    assert response.status_code == 422
    assert response.json() == {"detail": "Invalid input"}
