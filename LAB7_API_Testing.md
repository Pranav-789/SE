# LAB 7: API Testing Results

## Project
**Ascend.ai – AI-Powered Travel Planning Platform**

Repository: [Pranav-789/SE](https://github.com/Pranav-789/SE)

## Aim
To test the API Gateway endpoints and verify status codes, route forwarding, and response handling using Pytest and FastAPI TestClient.

## Test files
- `tests/test_gateway_api.py`: automated tests for the API Gateway.
- `requirements-test.txt`: testing dependencies.

The tests mock downstream services. Therefore, the tests can run without starting the authentication or travel-planning services and without making real API calls.

## How to run the tests

Open a terminal in the repository and move to the gateway service folder:

```bash
cd Ascend.ai/gatewayService
```

Create and activate a virtual environment (recommended):

**Windows PowerShell**
```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**Linux/macOS**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install the gateway and testing dependencies:

```bash
pip install -r requirements.txt
pip install -r requirements-test.txt
```

If the gateway does not have a `requirements.txt` file, install the dependencies directly:

```bash
pip install fastapi httpx uvicorn pytest
```

Run the tests from the `gatewayService` directory:

```bash
python -m pytest -v
```

To save the terminal output to a text file:

**Windows PowerShell**
```powershell
python -m pytest -v | Tee-Object test-results.txt
```

**Linux/macOS**
```bash
python -m pytest -v | tee test-results.txt
```

## Test cases

| Test case | What it verifies | Expected result |
|---|---|---|
| TC-01 | Gateway root endpoint | HTTP 200 and online status |
| TC-02 | Unknown service route | HTTP 404 |
| TC-03 | Travel convenience route | Request forwarded to the travel service path |
| TC-04 | Authentication convenience route | Request forwarded to the authentication service |
| TC-05 | Upstream response handling | Gateway preserves downstream status and body |

## Screenshots to submit

After running the tests locally:

1. Take a screenshot of the terminal showing `python -m pytest -v` and all tests passing.
2. If any tests fail, fix the issue and rerun the tests before capturing the final screenshot.
3. Optionally, take a screenshot of the test file in your editor.
4. Attach the screenshots to your lab submission or place them in a `screenshots/` folder in the repository.

**Important:** Do not claim that tests passed until you have run them and observed the output. The automated tests mock downstream services, so they test the gateway's behaviour and routing logic, not the live AI workflow or external provider availability.

## Result
The API Gateway is tested for its root status, unknown-service handling, request forwarding, and downstream response handling. Record the actual test result and attach the terminal screenshot after running the test suite.

## Reference
- [Ascend.ai README](https://github.com/Pranav-789/SE/blob/main/Ascend.ai/README.md)
- [FastAPI Testing Documentation](https://fastapi.tiangolo.com/tutorial/testing/)
- [Pytest Documentation](https://docs.pytest.org/)
