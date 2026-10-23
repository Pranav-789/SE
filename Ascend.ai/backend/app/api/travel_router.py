import os
from typing import Optional, Any
from fastapi import APIRouter, Request, HTTPException, Query, Depends
from fastapi.responses import JSONResponse
import httpx

travelrouter = APIRouter(prefix="/travel", tags=["Travel Planning Multi-Agent"])

TRAVEL_SERVICE_URL = os.getenv("TRAVEL_SERVICE_URL", "http://localhost:8002")
TIMEOUT = float(os.getenv("TRAVEL_TIMEOUT", "120.0"))


async def _get_optional_user(request: Request) -> Optional[dict]:
    """Extract user info from cookie token if available, without failing if unauthenticated."""
    access_token = request.cookies.get("access_token")
    if not access_token:
        return None
    try:
        import jwt
        secret_key = os.getenv("SECRET_KEY", "your-secret-key")
        algorithm = os.getenv("ALGORITHM", "HS256")
        payload = jwt.decode(access_token, secret_key, algorithms=[algorithm])
        return payload
    except Exception:
        return None


@travelrouter.post("/ask")
async def travel_ask_post(request: Request):
    """Forward a travel planning query or approval decision to the LangGraph travelService."""
    try:
        payload = await request.json()
    except Exception:
        payload = {}

    user_info = await _get_optional_user(request)
    if user_info and user_info.get("_id") and not payload.get("user_id"):
        payload["user_id"] = user_info.get("_id")

    url = f"{TRAVEL_SERVICE_URL.rstrip('/')}/ask"
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        try:
            resp = await client.post(url, json=payload)
            return JSONResponse(status_code=resp.status_code, content=resp.json())
        except httpx.ConnectError:
            raise HTTPException(
                status_code=503,
                detail=f"Travel Planning Agent service is currently unreachable at {TRAVEL_SERVICE_URL}. Please ensure travelService is running.",
            )
        except httpx.ReadTimeout:
            raise HTTPException(
                status_code=504,
                detail=f"Travel Planning Agent timed out after {TIMEOUT}s. Complex multi-agent operations may require more time.",
            )


@travelrouter.get("/ask")
async def travel_ask_get(
    request: Request,
    query: Optional[str] = Query(None),
    thread_id: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    auto_approve: bool = Query(True),
    approved: Optional[bool] = Query(None),
    feedback: Optional[str] = Query(""),
):
    """GET query wrapper for travel agent ask endpoint."""
    user_info = await _get_optional_user(request)
    effective_user_id = user_id or (user_info.get("_id") if user_info else "demo_user")

    params = {
        "query": query or "",
        "thread_id": thread_id or "",
        "user_id": effective_user_id,
        "auto_approve": str(auto_approve).lower(),
        "feedback": feedback or "",
    }
    if approved is not None:
        params["approved"] = str(approved).lower()

    url = f"{TRAVEL_SERVICE_URL.rstrip('/')}/ask"
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        try:
            resp = await client.get(url, params=params)
            return JSONResponse(status_code=resp.status_code, content=resp.json())
        except httpx.ConnectError:
            raise HTTPException(
                status_code=503,
                detail=f"Travel Planning Agent service is unreachable at {TRAVEL_SERVICE_URL}.",
            )
        except httpx.ReadTimeout:
            raise HTTPException(
                status_code=504,
                detail=f"Travel Planning Agent timed out after {TIMEOUT}s.",
            )


@travelrouter.get("/health")
async def travel_health():
    """Check health of the travelService connection."""
    url = f"{TRAVEL_SERVICE_URL.rstrip('/')}/health-check"
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            resp = await client.get(url)
            return {
                "status": "connected",
                "service_url": TRAVEL_SERVICE_URL,
                "travel_service_status": resp.json(),
            }
        except Exception as exc:
            return {
                "status": "disconnected",
                "service_url": TRAVEL_SERVICE_URL,
                "error": str(exc),
            }
