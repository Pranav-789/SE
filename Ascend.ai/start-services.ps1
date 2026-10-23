# Ascend.ai Multi-Agent Platform Launcher (PowerShell)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Detect Python in virtual environment
$PythonExe = "python"
$VenvCandidate1 = Join-Path (Split-Path -Parent $ScriptDir) ".venv\Scripts\python.exe"
$VenvCandidate2 = Join-Path $ScriptDir ".venv\Scripts\python.exe"

if (Test-Path $VenvCandidate1) {
    $PythonExe = $VenvCandidate1
} elseif (Test-Path $VenvCandidate2) {
    $PythonExe = $VenvCandidate2
}

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "         Ascend.ai Multi-Agent Platform Launcher" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Using Python: $PythonExe" -ForegroundColor Yellow
Write-Host ""
Write-Host "Choose an option to start services:" -ForegroundColor White
Write-Host "[1] Start All Services (Docker DBs, Gateway, TravelService, Backend, Next.js)"
Write-Host "[2] Start Travel Multi-Agent Service only (Port 8002)"
Write-Host "[3] Start API Gateway only (Port 8080)"
Write-Host "[4] Start Backend Auth Service only (Port 8000)"
Write-Host "[5] Start Next.js Frontend only (Port 3000)"
Write-Host "[6] Start Standalone Travel Planner Client only (Port 5173)"
Write-Host "[7] Start Docker Databases only (PostgreSQL :5434 & Redis :6379)"
Write-Host ""

$choice = Read-Host "Enter choice [1-7]"

switch ($choice) {
    "1" {
        Write-Host "Ensuring Docker databases (PostgreSQL & Redis) are active..." -ForegroundColor Cyan
        Set-Location $ScriptDir
        docker compose up -d
        Start-Sleep -Seconds 2

        Write-Host "Starting TravelService on Port 8002..." -ForegroundColor Green
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ScriptDir\travelService'; & '$PythonExe' app.py"
        Start-Sleep -Seconds 2

        Write-Host "Starting API Gateway on Port 8080..." -ForegroundColor Green
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ScriptDir\gatewayService'; & '$PythonExe' main.py"
        Start-Sleep -Seconds 2

        Write-Host "Starting Backend on Port 8000..." -ForegroundColor Green
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ScriptDir\backend'; & '$PythonExe' -m uvicorn app.main:app --reload --port 8000"
        Start-Sleep -Seconds 2

        Write-Host "Starting Next.js Frontend on Port 3000..." -ForegroundColor Green
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ScriptDir\ascend-ai'; npm run dev"

        Write-Host "`nAll services and databases launched successfully!" -ForegroundColor Cyan
    }
    "2" {
        Set-Location "$ScriptDir\travelService"
        & $PythonExe app.py
    }
    "3" {
        Set-Location "$ScriptDir\gatewayService"
        & $PythonExe main.py
    }
    "4" {
        Set-Location "$ScriptDir\backend"
        & $PythonExe -m uvicorn app.main:app --reload --port 8000
    }
    "5" {
        Set-Location "$ScriptDir\ascend-ai"
        npm run dev
    }
    "6" {
        Set-Location "$ScriptDir\client"
        npm run dev
    }
    "7" {
        Set-Location $ScriptDir
        docker compose up -d
        docker ps
    }
    Default {
        Write-Host "Invalid option selected." -ForegroundColor Red
    }
}
