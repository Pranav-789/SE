import gzip
import json

import httpx
import pytest
from fastapi.testclient import TestClient

import main

client = TestClient(main.app)


# ============================================================================
# 1. ROOT & SERVICE DISCOVERY TESTS
# ============================================================================

def test_gateway_root_returns_online_status():
    """The root endpoint should expose gateway status, registered services, and routes."""
    response = client.get("/")

    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Ascend.ai API Gateway"
    assert body["status"] == "online"
    assert "authService" in body["registered_services"]
    assert "travelService" in body["registered_services"]
    assert "routes" in body
    assert body["routes"]["direct_ask"] == "/ask"
    assert body["routes"]["convenience_travel"] == "/travel/*"
    assert body["routes"]["convenience_auth"] == "/auth/*"
    assert body["routes"]["convenience_users"] == "/users/*"


def test_unknown_service_returns_404():
    """Requests to an unregistered service must be rejected with 404 Not Found."""
    response = client.get("/unknownService/some-endpoint")

    assert response.status_code == 404
    detail = response.json()["detail"].lower()
    assert "not found in registered services" in detail


# ============================================================================
# 2. ROUTING & DISPATCH TESTS
# ============================================================================

def test_travel_route_forwards_request(monkeypatch):
    """The /travel/* convenience route should forward correctly to the travel service."""
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


def test_users_route_forwards_to_auth_service(monkeypatch):
    """The /users/* convenience route should forward to the authService /users/* endpoint."""
    captured = {}

    async def fake_forward_request(service_url, method, path, body=None,
                                   headers=None, params=None):
        captured.update(service_url=service_url, method=method, path=path)
        return httpx.Response(
            status_code=200,
            json={"id": 42, "email": "traveler@ascend.ai", "name": "Jane"},
        )

    monkeypatch.setattr(main, "forward_request", fake_forward_request)

    response = client.get("/users/me")

    assert response.status_code == 200
    assert response.json()["email"] == "traveler@ascend.ai"
    assert captured["service_url"] == main.services["authService"]
    assert captured["method"] == "GET"
    assert captured["path"] == "/users/me"


def test_direct_ask_route_forwards_to_travel_service(monkeypatch):
    """The /ask shortcut route should forward directly to /ask on the travelService."""
    captured = {}

    async def fake_forward_request(service_url, method, path, body=None,
                                   headers=None, params=None):
        captured.update(service_url=service_url, method=method, path=path, body=body)
        return httpx.Response(
            status_code=200,
            json={"answer": "Top 3 attractions in Tokyo"},
        )

    monkeypatch.setattr(main, "forward_request", fake_forward_request)

    payload = {"query": "Top 3 attractions in Tokyo"}
    response = client.post("/ask", json=payload)

    assert response.status_code == 200
    assert response.json()["answer"] == "Top 3 attractions in Tokyo"
    assert captured["service_url"] == main.services["travelService"]
    assert captured["method"] == "POST"
    assert captured["path"] == "/ask"
    assert json.loads(captured["body"].decode("utf-8")) == payload


def test_dynamic_service_routing(monkeypatch):
    """The dynamic /{service}/{path:path} route should forward arbitrary paths."""
    captured = {}

    async def fake_forward_request(service_url, method, path, body=None,
                                   headers=None, params=None):
        captured.update(service_url=service_url, method=method, path=path)
        return httpx.Response(status_code=200, json={"status": "dispatched"})

    monkeypatch.setattr(main, "forward_request", fake_forward_request)

    response = client.get("/travelService/api/v1/plans/detail/999")

    assert response.status_code == 200
    assert captured["service_url"] == main.services["travelService"]
    assert captured["path"] == "/api/v1/plans/detail/999"


# ============================================================================
# 3. HTTP METHODS & HEADER BEHAVIOR TESTS
# ============================================================================

@pytest.mark.parametrize("method", ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
def test_all_http_methods_supported_on_travel_route(monkeypatch, method):
    """Gateway routes should support GET, POST, PUT, DELETE, PATCH, and OPTIONS."""
    captured = {}

    async def fake_forward_request(service_url, req_method, path, body=None,
                                   headers=None, params=None):
        captured["method"] = req_method
        return httpx.Response(status_code=200, json={"method": req_method})

    monkeypatch.setattr(main, "forward_request", fake_forward_request)

    req_func = getattr(client, method.lower())
    response = req_func("/travel/test-method")

    assert response.status_code == 200
    assert captured["method"] == method


def test_host_header_is_stripped_when_forwarding(monkeypatch):
    """The gateway should strip the client's 'host' header before forwarding upstream."""
    captured = {}

    async def fake_forward_request(service_url, method, path, body=None,
                                   headers=None, params=None):
        captured["headers"] = headers
        return httpx.Response(status_code=200, json={"ok": True})

    monkeypatch.setattr(main, "forward_request", fake_forward_request)

    response = client.get("/auth/check", headers={"host": "api.ascend.ai", "x-custom-api-key": "secret123"})

    assert response.status_code == 200
    assert "host" not in captured["headers"]
    assert captured["headers"].get("x-custom-api-key") == "secret123"


def test_build_proxy_response_filters_hop_by_hop_headers():
    """Hop-by-hop headers must be excluded from the response sent back to the client."""
    compressed_body = gzip.compress(b'{"ok": true}')
    raw_headers = [
        ("content-type", "application/json"),
        ("content-encoding", "gzip"),
        ("content-length", str(len(compressed_body))),
        ("transfer-encoding", "chunked"),
        ("connection", "keep-alive"),
        ("x-custom-trace-id", "trace-abc-123"),
    ]
    mock_upstream_response = httpx.Response(
        status_code=200,
        content=compressed_body,
        headers=raw_headers,
    )

    proxy_resp = main.build_proxy_response(mock_upstream_response)

    assert proxy_resp.status_code == 200
    assert proxy_resp.headers.get("content-type") == "application/json"
    assert proxy_resp.headers.get("x-custom-trace-id") == "trace-abc-123"
    assert "content-encoding" not in proxy_resp.headers
    assert "transfer-encoding" not in proxy_resp.headers
    assert "connection" not in proxy_resp.headers
    # Starlette sets content-length based on the actual decompressed proxy content
    assert proxy_resp.headers.get("content-length") == str(len(proxy_resp.body))


# ============================================================================
# 4. ERROR HANDLING & RESILIENCE TESTS
# ============================================================================

def test_gateway_preserves_upstream_status_and_body(monkeypatch):
    """The gateway should preserve and return downstream response status codes and body."""
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


@pytest.mark.asyncio
async def test_upstream_connect_error_returns_503():
    """When upstream service is unreachable, forward_request should raise 503 Service Unavailable."""
    with pytest.raises(main.HTTPException) as exc_info:
        await main.forward_request("http://127.0.0.1:59999", "GET", "/ping")

    assert exc_info.value.status_code == 503
    assert "Unable to connect to target service" in exc_info.value.detail


@pytest.mark.asyncio
async def test_upstream_read_timeout_returns_504(monkeypatch):
    """When upstream service exceeds timeout threshold, forward_request should raise 504 Gateway Timeout."""
    async def fake_request(*args, **kwargs):
        raise httpx.ReadTimeout("Request timed out after waiting for upstream")

    monkeypatch.setattr(httpx.AsyncClient, "request", fake_request)

    with pytest.raises(main.HTTPException) as exc_info:
        await main.forward_request("http://localhost:8000", "GET", "/slow-operation")

    assert exc_info.value.status_code == 504
    assert "Gateway timeout" in exc_info.value.detail


# ============================================================================
# 5. CORS PREFLIGHT TESTS
# ============================================================================

def test_cors_preflight_options():
    """CORS preflight request should return 200 with appropriate Access-Control headers."""
    response = client.options(
        "/ask",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type,Authorization",
        },
    )

    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"
    assert response.headers.get("access-control-allow-credentials") == "true"
    assert "POST" in response.headers.get("access-control-allow-methods", "")
