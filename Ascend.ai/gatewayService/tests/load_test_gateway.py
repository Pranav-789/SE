import asyncio
import json
import os
import statistics
import sys
import time
from typing import Dict, List, Any

# Ensure gatewayService directory is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import httpx
from fastapi import FastAPI, Request, Response
import main

# Mock upstream app simulating downstream microservices (authService and travelService)
upstream_app = FastAPI()

@upstream_app.get("/travel/status")
@upstream_app.get("/status")
async def mock_status():
    return {"status": "ok", "service": "travelService"}

@upstream_app.post("/ask")
async def mock_ask(request: Request):
    data = await request.json()
    return {"status": "success", "echo_query": data.get("query", ""), "itinerary": "Day 1: Arrival, Day 2: City Tour"}

@upstream_app.post("/auth/login")
async def mock_login(request: Request):
    return {"token": "jwt-token-xyz-123", "user": {"id": 1, "role": "traveler"}}

@upstream_app.get("/users/profile")
async def mock_profile():
    return {"id": 1, "name": "Test User", "tier": "gold"}

@upstream_app.get("/slow")
async def mock_slow():
    await asyncio.sleep(0.5)
    return {"slow": True}


class GatewayLoadTester:
    def __init__(self, app):
        self.app = app

    async def execute_scenario(
        self,
        name: str,
        method: str,
        url: str,
        total_requests: int,
        concurrency: int,
        json_body: dict = None,
        headers: dict = None,
    ) -> Dict[str, Any]:
        print(f"\n>>> Running Scenario: {name} (Requests: {total_requests}, Concurrency: {concurrency})")
        queue = asyncio.Queue()
        for i in range(total_requests):
            queue.put_nowait(i)

        latencies_ms: List[float] = []
        status_codes: Dict[int, int] = {}
        errors: List[str] = []

        transport = httpx.ASGITransport(app=self.app)
        start_time = time.perf_counter()

        async def worker():
            async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
                while not queue.empty():
                    try:
                        req_idx = queue.get_nowait()
                    except asyncio.QueueEmpty:
                        break

                    req_start = time.perf_counter()
                    try:
                        resp = await client.request(
                            method=method,
                            url=url,
                            json=json_body,
                            headers=headers,
                            timeout=60.0,
                        )
                        req_duration = (time.perf_counter() - req_start) * 1000.0
                        latencies_ms.append(req_duration)
                        code = resp.status_code
                        status_codes[code] = status_codes.get(code, 0) + 1
                    except Exception as exc:
                        errors.append(str(exc))
                    finally:
                        queue.task_done()

        workers = [asyncio.create_task(worker()) for _ in range(concurrency)]
        await asyncio.gather(*workers)
        total_time = time.perf_counter() - start_time

        latencies_sorted = sorted(latencies_ms)
        p50 = statistics.median(latencies_sorted) if latencies_sorted else 0
        p90 = latencies_sorted[int(len(latencies_sorted) * 0.90)] if latencies_sorted else 0
        p95 = latencies_sorted[int(len(latencies_sorted) * 0.95)] if latencies_sorted else 0
        p99 = latencies_sorted[int(len(latencies_sorted) * 0.99)] if latencies_sorted else 0
        min_lat = min(latencies_sorted) if latencies_sorted else 0
        max_lat = max(latencies_sorted) if latencies_sorted else 0
        mean_lat = statistics.mean(latencies_sorted) if latencies_sorted else 0
        rps = len(latencies_ms) / total_time if total_time > 0 else 0

        result = {
            "scenario": name,
            "total_requests": total_requests,
            "concurrency": concurrency,
            "successful_requests": len(latencies_ms),
            "errors": len(errors),
            "total_duration_sec": round(total_time, 3),
            "rps": round(rps, 2),
            "min_ms": round(min_lat, 2),
            "mean_ms": round(mean_lat, 2),
            "p50_ms": round(p50, 2),
            "p90_ms": round(p90, 2),
            "p95_ms": round(p95, 2),
            "p99_ms": round(p99, 2),
            "max_ms": round(max_lat, 2),
            "status_distribution": status_codes,
        }
        print(f"    Completed in {result['total_duration_sec']}s | RPS: {result['rps']} | p50: {result['p50_ms']}ms | p95: {result['p95_ms']}ms | p99: {result['p99_ms']}ms | Errors: {result['errors']}")
        return result


async def run_all_benchmarks():
    tester = GatewayLoadTester(main.app)
    results = []

    # =========================================================================
    # Test Suite 1: Root / Health Check (In-Gateway processing)
    # =========================================================================
    res_root_light = await tester.execute_scenario(
        name="Root / Endpoint - Baseline",
        method="GET",
        url="/",
        total_requests=1000,
        concurrency=10,
    )
    results.append(res_root_light)

    res_root_heavy = await tester.execute_scenario(
        name="Root / Endpoint - Concurrency Scaling",
        method="GET",
        url="/",
        total_requests=3000,
        concurrency=50,
    )
    results.append(res_root_heavy)

    res_root_stress = await tester.execute_scenario(
        name="Root / Endpoint - High Stress Burst",
        method="GET",
        url="/",
        total_requests=5000,
        concurrency=100,
    )
    results.append(res_root_stress)

    # =========================================================================
    # Test Suite 2: Microservice Proxying via Mock Upstream Transport
    # =========================================================================
    upstream_transport = httpx.ASGITransport(app=upstream_app)
    
    # We patch forward_request to forward to our in-process upstream transport
    async def fast_forward_request(service_url, method, path, body=None, headers=None, params=None):
        clean_path = path if path.startswith("/") else f"/{path}"
        async with httpx.AsyncClient(transport=upstream_transport, base_url="http://mock-upstream") as client:
            resp = await client.request(method, clean_path, content=body, headers=headers, params=params)
            return resp

    original_forward = main.forward_request
    main.forward_request = fast_forward_request

    try:
        # Scenario A: Direct /ask route (POST JSON)
        res_ask_10 = await tester.execute_scenario(
            name="POST /ask - Baseline Load (Concurrency: 10)",
            method="POST",
            url="/ask",
            total_requests=1000,
            concurrency=10,
            json_body={"query": "Suggest a 3-day itinerary for Kyoto", "budget": 1500},
        )
        results.append(res_ask_10)

        res_ask_50 = await tester.execute_scenario(
            name="POST /ask - Moderate Load (Concurrency: 50)",
            method="POST",
            url="/ask",
            total_requests=2500,
            concurrency=50,
            json_body={"query": "Suggest a 3-day itinerary for Kyoto", "budget": 1500},
        )
        results.append(res_ask_50)

        res_ask_100 = await tester.execute_scenario(
            name="POST /ask - High Concurrency Stress (Concurrency: 100)",
            method="POST",
            url="/ask",
            total_requests=5000,
            concurrency=100,
            json_body={"query": "Suggest a 3-day itinerary for Kyoto", "budget": 1500},
        )
        results.append(res_ask_100)

        # Scenario B: Authentication Route /auth/login
        res_auth_50 = await tester.execute_scenario(
            name="POST /auth/login - Auth Traffic (Concurrency: 50)",
            method="POST",
            url="/auth/login",
            total_requests=2000,
            concurrency=50,
            json_body={"username": "traveler@ascend.ai", "password": "SecurePassword123!"},
        )
        results.append(res_auth_50)

        # Scenario C: Convenience Route /users/profile
        res_users_50 = await tester.execute_scenario(
            name="GET /users/profile - User Route (Concurrency: 50)",
            method="GET",
            url="/users/profile",
            total_requests=2000,
            concurrency=50,
            headers={"Authorization": "Bearer jwt-token-xyz-123"},
        )
        results.append(res_users_50)

        # Scenario D: Extreme Stress Spike (200 concurrency)
        res_spike_200 = await tester.execute_scenario(
            name="POST /ask - Extreme Spike (Concurrency: 200)",
            method="POST",
            url="/ask",
            total_requests=6000,
            concurrency=200,
            json_body={"query": "High concurrency flash sale itinerary booking"},
        )
        results.append(res_spike_200)

        # =========================================================================
        # Test Suite 3: Upstream Failure & Timeout Fault Injection Under Load
        # =========================================================================
        # Fault 1: 503 ConnectError under heavy load
        async def failing_forward_connect_error(*args, **kwargs):
            raise main.HTTPException(status_code=503, detail="Unable to connect to target service.")

        main.forward_request = failing_forward_connect_error
        res_fault_503 = await tester.execute_scenario(
            name="Fault Injection: Upstream Down (503 Service Unavailable)",
            method="GET",
            url="/travel/status",
            total_requests=1000,
            concurrency=50,
        )
        results.append(res_fault_503)

        # Fault 2: 504 Timeout under heavy load
        async def failing_forward_timeout(*args, **kwargs):
            raise main.HTTPException(status_code=504, detail="Gateway timeout: Target service took longer than 120s.")

        main.forward_request = failing_forward_timeout
        res_fault_504 = await tester.execute_scenario(
            name="Fault Injection: Upstream Timeout (504 Gateway Timeout)",
            method="POST",
            url="/ask",
            total_requests=1000,
            concurrency=50,
            json_body={"query": "Timeout test"},
        )
        results.append(res_fault_504)

        # =========================================================================
        # Test Suite 4: Architecture Comparison - Per-Request Client vs Persistent Client
        # =========================================================================
        # Persistent Client implementation
        persistent_client = httpx.AsyncClient(transport=upstream_transport, base_url="http://mock-upstream")

        async def pooled_forward_request(service_url, method, path, body=None, headers=None, params=None):
            clean_path = path if path.startswith("/") else f"/{path}"
            return await persistent_client.request(method, clean_path, content=body, headers=headers, params=params)

        main.forward_request = pooled_forward_request
        res_pooled = await tester.execute_scenario(
            name="POST /ask - Pooled Client Optimization (Concurrency: 100)",
            method="POST",
            url="/ask",
            total_requests=5000,
            concurrency=100,
            json_body={"query": "Benchmarking connection pooling efficiency"},
        )
        results.append(res_pooled)

        await persistent_client.aclose()

    finally:
        main.forward_request = original_forward

    # Save results to JSON file for reporting
    with open("benchmark_results.json", "w") as f:
        json.dump(results, f, indent=2)

    print("\n=======================================================")
    print("All load and stress test scenarios completed successfully!")
    print("Results saved to benchmark_results.json")
    print("=======================================================")

if __name__ == "__main__":
    asyncio.run(run_all_benchmarks())
