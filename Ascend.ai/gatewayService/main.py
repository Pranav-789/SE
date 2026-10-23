import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI(
    title="Ascend.ai API Gateway",
    description="Central API Gateway routing requests to Auth, User, and Travel Planning Microservices.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

services = {
    "authService": os.getenv("AUTH_SERVICE_URL", "http://localhost:8000"),
    "travelService": os.getenv("TRAVEL_SERVICE_URL", "http://localhost:8002"),
}

DEFAULT_TIMEOUT = float(os.getenv("GATEWAY_TIMEOUT", "120.0"))


async def forward_request(
    service_url: str,
    method: str,
    path: str,
    body=None,
    headers=None,
    params=None,
):
    clean_path = path if path.startswith("/") else f"/{path}"
    url = f"{service_url.rstrip('/')}{clean_path}"

    async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
        try:
            response = await client.request(
                method,
                url,
                content=body,
                headers=headers,
                params=params,
            )
            return response
        except httpx.ConnectError:
            raise HTTPException(
                status_code=503,
                detail=f"Unable to connect to target service at {service_url}. Ensure the service is running.",
            )
        except httpx.ReadTimeout:
            raise HTTPException(
                status_code=504,
                detail=f"Gateway timeout: Target service at {service_url} took longer than {DEFAULT_TIMEOUT}s to respond.",
            )


def build_proxy_response(response: httpx.Response) -> Response:
    proxy_response = Response(status_code=response.status_code, content=response.content)
    excluded_headers = {"content-encoding", "content-length", "transfer-encoding", "connection"}
    for key, value in response.headers.multi_items():
        if key.lower() not in excluded_headers:
            proxy_response.headers.append(key, value)
    return proxy_response


@app.get("/")
def gateway_root():
    return JSONResponse(
        status_code=200,
        content={
            "name": "Ascend.ai API Gateway",
            "status": "online",
            "registered_services": services,
            "routes": {
                "authService": "/authService/{path}",
                "travelService": "/travelService/{path}",
                "convenience_auth": "/auth/*",
                "convenience_users": "/users/*",
                "convenience_travel": "/travel/*",
                "direct_ask": "/ask",
            },
        },
    )


# Shorthand route for Travel Service /ask
@app.api_route("/ask", methods=["GET", "POST", "OPTIONS"])
async def route_ask(request: Request):
    service_url = services["travelService"]
    body = await request.body()
    headers = dict(request.headers)
    headers.pop("host", None)
    response = await forward_request(service_url, request.method, "/ask", body, headers, params=request.query_params)
    return build_proxy_response(response)


# Shorthand route for /travel/* -> travelService/*
@app.api_route("/travel/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def route_travel(path: str, request: Request):
    service_url = services["travelService"]
    body = await request.body()
    headers = dict(request.headers)
    headers.pop("host", None)
    # Forward /travel/ask to /ask or as given
    target_path = f"/{path}"
    response = await forward_request(service_url, request.method, target_path, body, headers, params=request.query_params)
    return build_proxy_response(response)


# Shorthand route for /auth/* -> authService/auth/*
@app.api_route("/auth/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def route_auth(path: str, request: Request):
    service_url = services["authService"]
    body = await request.body()
    headers = dict(request.headers)
    headers.pop("host", None)
    response = await forward_request(service_url, request.method, f"/auth/{path}", body, headers, params=request.query_params)
    return build_proxy_response(response)


# Shorthand route for /users/* -> authService/users/*
@app.api_route("/users/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def route_users(path: str, request: Request):
    service_url = services["authService"]
    body = await request.body()
    headers = dict(request.headers)
    headers.pop("host", None)
    response = await forward_request(service_url, request.method, f"/users/{path}", body, headers, params=request.query_params)
    return build_proxy_response(response)


# Dynamic microservice routing: /{service}/{path:path}
@app.api_route("/{service}/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def gateway(service: str, path: str, request: Request):
    if service not in services:
        raise HTTPException(status_code=404, detail=f"Service '{service}' not found in registered services: {list(services.keys())}")

    service_url = services[service]
    body = await request.body()
    headers = dict(request.headers)
    headers.pop("host", None)
    response = await forward_request(service_url, request.method, f"/{path}", body, headers, params=request.query_params)
    return build_proxy_response(response)


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run("main:app", host="127.0.0.1", port=port, reload=True)
