@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo         Ascend.ai Multi-Agent Platform Launcher
echo ========================================================
echo.

:: Detect Python executable
set "PYTHON_EXE=python"
if exist "%~dp0..\.venv\Scripts\python.exe" (
    set "PYTHON_EXE=%~dp0..\.venv\Scripts\python.exe"
) else if exist "%~dp0.venv\Scripts\python.exe" (
    set "PYTHON_EXE=%~dp0.venv\Scripts\python.exe"
)

echo Using Python: !PYTHON_EXE!
echo.
echo Choose an option to start services:
echo [1] Start All Services (Docker DBs, Gateway, TravelService, Backend, Next.js)
echo [2] Start Travel Multi-Agent Service only (Port 8002)
echo [3] Start API Gateway only (Port 8080)
echo [4] Start Backend Auth Service only (Port 8000)
echo [5] Start Next.js Frontend only (Port 3000)
echo [6] Start Standalone Travel Planner Client only (Port 5173)
echo [7] Start Docker Databases only (PostgreSQL :5434 & Redis :6379)
echo.

set /p opt="Enter choice [1-7]: "

if "%opt%"=="1" (
    echo Starting Docker databases (PostgreSQL & Redis)...
    cd /d "%~dp0"
    docker compose up -d
    timeout /t 2 /nobreak >nul

    echo Starting TravelService on Port 8002...
    start "TravelService (Port 8002)" cmd /k "cd /d "%~dp0travelService" && "!PYTHON_EXE!" app.py"
    
    timeout /t 2 /nobreak >nul
    echo Starting API Gateway on Port 8080...
    start "GatewayService (Port 8080)" cmd /k "cd /d "%~dp0gatewayService" && "!PYTHON_EXE!" main.py"
    
    timeout /t 2 /nobreak >nul
    echo Starting Backend on Port 8000...
    start "Backend (Port 8000)" cmd /k "cd /d "%~dp0backend" && "!PYTHON_EXE!" -m uvicorn app.main:app --reload --port 8000"
    
    timeout /t 2 /nobreak >nul
    echo Starting Next.js Frontend on Port 3000...
    start "Next.js Frontend (Port 3000)" cmd /k "cd /d "%~dp0ascend-ai" && npm run dev"
    
    echo All services initiated in separate windows!
)

if "%opt%"=="2" (
    cd /d "%~dp0travelService"
    "!PYTHON_EXE!" app.py
)

if "%opt%"=="3" (
    cd /d "%~dp0gatewayService"
    "!PYTHON_EXE!" main.py
)

if "%opt%"=="4" (
    cd /d "%~dp0backend"
    "!PYTHON_EXE!" -m uvicorn app.main:app --reload --port 8000
)

if "%opt%"=="5" (
    cd /d "%~dp0ascend-ai"
    npm run dev
)

if "%opt%"=="6" (
    cd /d "%~dp0client"
    npm run dev
)

if "%opt%"=="7" (
    cd /d "%~dp0"
    docker compose up -d
    docker ps
)

pause
