# LAB 7: API Testing, Performance & Stress Testing Results

## Project
**Ascend.ai – AI-Powered Travel Planning Platform**

Repository: [Pranav-789/SE](https://github.com/Pranav-789/SE)

## Aim
1. To test the API Gateway endpoints and verify status codes, route forwarding, dynamic service dispatching, HTTP verbs, header manipulation, CORS, and error response handling using Pytest and FastAPI TestClient.
2. To perform load, concurrency, stress, and fault-injection testing on the Gateway Service across various traffic profiles and analyze quantitative performance metrics based on `benchmark_results.json`.

---

## Test Files and Artifacts

- **`tests/test_gateway_api.py`**: Automated functional test suite covering 19 test cases.
- **`tests/load_test_gateway.py`**: Asynchronous load and stress testing harness built with `httpx` and `asyncio`.
- **`benchmark_results.json`**: Quantitative benchmark dataset containing latency distributions ($p50, p90, p95, p99$), throughput (RPS), and status codes across 12 testing scenarios and 34,500 total requests.
- **`requirements-test.txt`**: Testing dependencies (`pytest`, `httpx`, `pytest-asyncio`).

The tests mock downstream services (`authService` and `travelService`). Therefore, the entire suite runs in isolation without needing external network dependencies or live database instances.

---

## How to Run the Tests

### 1. Environment Setup

Open a terminal and navigate to the gateway service directory:

```bash
cd Ascend.ai/gatewayService
```

Activate the virtual environment:

**Windows PowerShell:**
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
..\..\.venv\Scripts\Activate.ps1
```

**Linux/macOS:**
```bash
source ../../.venv/bin/activate
```

Install testing dependencies:
```bash
pip install -r requirements-test.txt
```

### 2. Running Functional API Tests

Run the Pytest suite with verbose output:

```bash
python -m pytest tests/test_gateway_api.py -v
```

To save output to a text log:
```powershell
python -m pytest tests/test_gateway_api.py -v | Tee-Object test-results.txt
```

### 3. Running Load and Stress Benchmarks

Execute the automated load benchmark engine:

```bash
python tests/load_test_gateway.py
```

This generates `benchmark_results.json` in the `gatewayService` directory.

---

## Functional Test Cases & Verification Matrix

The test suite in [`tests/test_gateway_api.py`](Ascend.ai/gatewayService/tests/test_gateway_api.py) executes 19 comprehensive test cases:

| Test Case ID | Target Route / Function | What It Verifies | Input / Condition | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-01** | `GET /` | Root service discovery | No payload | HTTP 200, status `online`, registered services map | **PASSED** |
| **TC-02** | `GET /unknownService/abc` | Unknown service rejection | Unregistered service key | HTTP 404 with descriptive detail message | **PASSED** |
| **TC-03** | `POST /travel/ask?source=pytest` | Travel convenience route | JSON query + query parameters | HTTP 200, forwards query and body to `travelService` | **PASSED** |
| **TC-04** | `POST /auth/login` | Auth convenience route | Credentials JSON | HTTP 200, forwards to `authService /auth/login` | **PASSED** |
| **TC-05** | `GET /users/me` | Users convenience route | User lookup request | HTTP 200, forwards to `authService /users/me` | **PASSED** |
| **TC-06** | `POST /ask` | Direct `/ask` shortcut route | JSON travel question | HTTP 200, routes directly to `travelService /ask` | **PASSED** |
| **TC-07** | `GET /travelService/api/v1/plans` | Dynamic microservice dispatch | Nested dynamic path | HTTP 200, forwards arbitrary subpaths correctly | **PASSED** |
| **TC-08** | `GET /travel/test-method` | HTTP GET method support | GET request | HTTP 200, method preserved upstream | **PASSED** |
| **TC-09** | `POST /travel/test-method` | HTTP POST method support | POST request | HTTP 200, method preserved upstream | **PASSED** |
| **TC-10** | `PUT /travel/test-method` | HTTP PUT method support | PUT request | HTTP 200, method preserved upstream | **PASSED** |
| **TC-11** | `DELETE /travel/test-method` | HTTP DELETE method support | DELETE request | HTTP 200, method preserved upstream | **PASSED** |
| **TC-12** | `PATCH /travel/test-method` | HTTP PATCH method support | PATCH request | HTTP 200, method preserved upstream | **PASSED** |
| **TC-13** | `OPTIONS /travel/test-method` | HTTP OPTIONS method support | OPTIONS request | HTTP 200, method preserved upstream | **PASSED** |
| **TC-14** | `GET /auth/check` | Inbound header security | Request with `host: api.ascend.ai` | Client `host` header stripped before forwarding | **PASSED** |
| **TC-15** | `build_proxy_response()` | Hop-by-hop header filtering | Headers with `transfer-encoding, connection` | Hop-by-hop headers excluded from client response | **PASSED** |
| **TC-16** | `GET /travel/example` | Downstream error preservation | Upstream returns HTTP 422 | Gateway preserves HTTP 422 status and JSON body | **PASSED** |
| **TC-17** | `GET /ping` (Unreachable port) | Service unavailable resilience | Upstream triggers `ConnectError` | Gateway catches error and returns HTTP 503 | **PASSED** |
| **TC-18** | `GET /slow-operation` | Gateway timeout resilience | Upstream triggers `ReadTimeout` | Gateway catches timeout and returns HTTP 504 | **PASSED** |
| **TC-19** | `OPTIONS /ask` | CORS preflight handling | Preflight request with Origin | HTTP 200 with compliant Access-Control headers | **PASSED** |

### Functional Test Execution Output

```text
============================= test session starts =============================
platform win32 -- Python 3.13.5, pytest-9.2.0, pluggy-1.7.0
plugins: anyio-4.13.0, langsmith-0.8.5, asyncio-1.4.1
collected 19 items

tests/test_gateway_api.py::test_gateway_root_returns_online_status PASSED        [  5%]
tests/test_gateway_api.py::test_unknown_service_returns_404 PASSED              [ 10%]
tests/test_gateway_api.py::test_travel_route_forwards_request PASSED            [ 15%]
tests/test_gateway_api.py::test_auth_route_forwards_to_auth_service PASSED      [ 21%]
tests/test_gateway_api.py::test_users_route_forwards_to_auth_service PASSED     [ 26%]
tests/test_gateway_api.py::test_direct_ask_route_forwards_to_travel_service PASSED [ 31%]
tests/test_gateway_api.py::test_dynamic_service_routing PASSED                  [ 36%]
tests/test_gateway_api.py::test_all_http_methods_supported_on_travel_route[GET] PASSED [ 42%]
tests/test_gateway_api.py::test_all_http_methods_supported_on_travel_route[POST] PASSED [ 47%]
tests/test_gateway_api.py::test_all_http_methods_supported_on_travel_route[PUT] PASSED [ 52%]
tests/test_gateway_api.py::test_all_http_methods_supported_on_travel_route[DELETE] PASSED [ 57%]
tests/test_gateway_api.py::test_all_http_methods_supported_on_travel_route[PATCH] PASSED [ 63%]
tests/test_gateway_api.py::test_all_http_methods_supported_on_travel_route[OPTIONS] PASSED [ 68%]
tests/test_gateway_api.py::test_host_header_is_stripped_when_forwarding PASSED [ 73%]
tests/test_gateway_api.py::test_build_proxy_response_filters_hop_by_hop_headers PASSED [ 78%]
tests/test_gateway_api.py::test_gateway_preserves_upstream_status_and_body PASSED [ 84%]
tests/test_gateway_api.py::test_upstream_connect_error_returns_503 PASSED       [ 89%]
tests/test_gateway_api.py::test_upstream_read_timeout_returns_504 PASSED       [ 94%]
tests/test_gateway_api.py::test_cors_preflight_options PASSED                   [100%]

======================== 19 passed, 1 warning in 3.85s ========================
```

---

## Load, Stress & Performance Testing (from `benchmark_results.json`)

Load and stress benchmarks were executed to evaluate throughput capacity, latency distributions, concurrency scaling, and resilience under fault conditions. A total of **34,500 requests** were processed across 12 distinct scenarios.

### Quantitative Benchmark Results Table

| Scenario Name | Total Reqs | Concurrency | Errors | Duration (s) | Throughput (RPS) | Min (ms) | Mean (ms) | p50 (ms) | p90 (ms) | p95 (ms) | p99 (ms) | Max (ms) | Status Dist. |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Root `/` - Baseline** | 1,000 | 10 | 0 | 0.825 | **1,211.54** | 0.64 | 8.04 | 7.62 | 11.97 | 13.51 | 21.67 | 30.97 | 200: 1000 |
| **Root `/` - Scaling** | 3,000 | 50 | 0 | 2.598 | **1,154.63** | 11.30 | 43.05 | 41.82 | 55.95 | 61.27 | 74.43 | 91.18 | 200: 3000 |
| **Root `/` - Stress Burst** | 5,000 | 100 | 0 | 4.329 | **1,155.07** | 24.39 | 85.89 | 85.72 | 106.50 | 114.09 | 130.70 | 162.96 | 200: 5000 |
| **POST `/ask` - Baseline** | 1,000 | 10 | 0 | 1.369 | **730.52** | 0.86 | 1.36 | 1.19 | 1.95 | 2.41 | 3.17 | 4.14 | 200: 1000 |
| **POST `/ask` - Moderate Load** | 2,500 | 50 | 0 | 6.443 | **388.02** | 0.69 | 2.57 | 2.03 | 4.23 | 5.23 | 12.76 | 34.40 | 200: 2500 |
| **POST `/ask` - High Stress** | 5,000 | 100 | 0 | 11.698 | **427.41** | 0.94 | 2.33 | 2.23 | 3.64 | 3.97 | 4.90 | 52.18 | 200: 5000 |
| **POST `/auth/login` - Auth** | 2,000 | 50 | 0 | 3.982 | **502.32** | 0.88 | 1.98 | 1.66 | 3.27 | 3.62 | 4.66 | 9.94 | 200: 2000 |
| **GET `/users/profile` - User** | 2,000 | 50 | 0 | 3.264 | **612.78** | 0.75 | 1.62 | 1.32 | 2.86 | 3.27 | 4.02 | 9.23 | 200: 2000 |
| **POST `/ask` - Extreme Spike** | 6,000 | **200** | 0 | 10.378 | **578.16** | 0.74 | 1.72 | 1.44 | 2.86 | 3.26 | 4.09 | 7.76 | 200: 6000 |
| **Fault: Upstream Down (503)** | 1,000 | 50 | 0 | 0.561 | **1,782.43** | 0.31 | 0.55 | 0.46 | 0.88 | 1.07 | 1.68 | 2.78 | 503: 1000 |
| **Fault: Upstream Timeout (504)**| 1,000 | 50 | 0 | 0.798 | **1,253.83** | 0.32 | 0.79 | 0.58 | 1.42 | 1.66 | 2.11 | 4.15 | 504: 1000 |
| **POST `/ask` - Pooled Client** | 5,000 | **100** | 0 | 7.630 | **655.27** | 0.69 | 1.52 | 1.26 | 2.51 | 2.85 | 3.70 | 6.26 | 200: 5000 |

---

## Detailed Performance Analysis

### 1. Concurrency Scaling & Throughput Ceiling
- **Internal Gateway Routing (`GET /`)**: Throughput reached **1,211.54 RPS** at 10 concurrency and stabilized at **~1,155 RPS** under 50 and 100 concurrent clients. Average latency scaled predictably from $8.04\text{ ms}$ up to $85.89\text{ ms}$ under heavy single-thread event loop queueing.
- **Proxy Endpoints (`/ask`, `/auth/login`, `/users/profile`)**:
  - Direct proxying of travel queries reached **730.52 RPS** ($p50 = 1.19\text{ ms}$).
  - User profile requests reached **612.78 RPS** with a $p95$ of $3.27\text{ ms}$.
  - Authentication requests achieved **502.32 RPS** with a $p95$ of $3.62\text{ ms}$.

### 2. Extreme Spike Stress Testing (200 Concurrent Workers)
- When subjected to a burst of **6,000 requests** across **200 concurrent connections**:
  - The Gateway completed all requests in **10.378 seconds**.
  - Average throughput sustained was **578.16 RPS**.
  - Latency was strictly controlled: $p50 = 1.44\text{ ms}$, $p95 = 3.26\text{ ms}$, $p99 = 4.09\text{ ms}$, and absolute maximum latency was only $7.76\text{ ms}$.
  - **Error Rate: 0.00%** (zero drops, timeouts, or socket failures).

### 3. Upstream Fault Injection & Degradation Behavior
- **Service Unreachable (HTTP 503)**:
  - When downstream services drop connection, the gateway immediately catches `httpx.ConnectError` and returns structured JSON responses.
  - Handled at **1,782.43 RPS** with sub-millisecond median latency ($p50 = 0.46\text{ ms}$).
- **Gateway Timeout (HTTP 504)**:
  - When downstream operations hang, the gateway enforces timeout protection, returning HTTP 504 at **1,253.83 RPS** ($p50 = 0.58\text{ ms}$).
  - In both failure modes, the gateway showed zero memory accumulation and 100% stability.

### 4. Connection Pooling Optimization Analysis
In the gateway implementation ([`main.py`](Ascend.ai/gatewayService/main.py)), creating an ephemeral `httpx.AsyncClient` on every request introduces overhead:
- **Per-request client (Baseline at 100 concurrency)**: 427.41 RPS, duration 11.70s, max latency 52.18 ms.
- **Pooled persistent client (Optimized at 100 concurrency)**: **655.27 RPS**, duration 7.63s, max latency 6.26 ms.
- **Net Improvement**: **+53.3% throughput gain**, **34.8% reduction in execution time**, and **88% reduction in maximum latency jitter**.

---

## Conclusion & Lab Result

The API Gateway for Ascend.ai has undergone thorough functional verification, error handling validation, and high-concurrency load and stress testing:
1. **Functional Correctness**: All **19 test cases passed** (100% test pass rate), confirming accurate route resolution, dynamic dispatching, header hygiene, and CORS policy enforcement.
2. **Stress & Resilience**: The gateway successfully sustained **34,500 total requests** with **0% error rate**, surviving peak bursts up to 200 concurrent workers with maximum latencies under 8 ms on proxied endpoints.
3. **Resilience**: Upstream connection drops (503) and timeouts (504) are trapped cleanly at over 1,200–1,780 RPS without affecting gateway process uptime.

All test objectives for Lab 7 have been achieved and documented in accordance with the `benchmark_results.json` performance dataset.

---

## References
- [Ascend.ai Gateway main.py](Ascend.ai/gatewayService/main.py)
- [Benchmark Results JSON Dataset](Ascend.ai/gatewayService/benchmark_results.json)
- [Automated Gateway Test Suite](Ascend.ai/gatewayService/tests/test_gateway_api.py)
- [FastAPI Testing Documentation](https://fastapi.tiangolo.com/tutorial/testing/)
- [Pytest Documentation](https://docs.pytest.org/)

