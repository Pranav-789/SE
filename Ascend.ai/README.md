# 🚀 Ascend AI Platform

**Integrated AI Platform: Multi-Agent AI Systems, Microservices Gateway & Full-Stack Authentication**

Ascend AI is a modular, multi-service AI application combining **LangGraph Autonomous Multi-Agent Workflows (MCP-powered)**, **FastAPI Microservices API Gateway**, **JWT & Cookie-Based User Authentication**, and modern **Next.js & React interfaces**.

---

## 🏗️ Architecture Overview

```text
                               +-----------------------------+
                               |      Client Interfaces      |
                               +--------------+--------------+
                                              |
                   +--------------------------+--------------------------+
                   |                                                     |
                   v                                                     v
        +----------------------+                              +----------------------+
        |   Next.js Web App    |                              |   Standalone Client  |
        |  (ascend-ai : 3000)  |                              |    (client : 5173)   |
        +----------+-----------+                              +----------+-----------+
                   |                                                     |
                   +--------------------------+--------------------------+
                                              |
                                              v
                               +-----------------------------+
                               |     FastAPI API Gateway     |
                               |    (gatewayService : 8080)  |
                               +--------------+--------------+
                                              |
                       +----------------------+----------------------+
                       |                                             |
                       v                                             v
        +-----------------------------+               +-----------------------------+
        |   Auth & User Microservice  |               |  Travel Planning Agent Svc  |
        |       (backend : 8000)      |               |    (travelService : 8002)   |
        +--------------+--------------+               +--------------+--------------+
                       |                                             |
          +------------+------------+                  +-------------+-------------+
          |                         |                  |             |             |
          v                         v                  v             v             v
     PostgreSQL                   Redis          AviationStack     Tavily      OpenWeather
    (User DB)                 (Rate Limits)       (Flight MCP)    (Hotel MCP)  (Weather MCP)
```

---

## 📂 Repository Structure

```text
Ascend.ai/
├── ascend-ai/          # Next.js 16 full-stack frontend with Shadcn UI & Auth
├── backend/            # FastAPI user authentication & account service (Port 8000)
├── gatewayService/     # Central API Gateway with microservice reverse proxying (Port 8080)
├── travelService/      # Autonomous Multi-Agent Travel Planner using LangGraph + MCP (Port 8002)
│   ├── data/           # Local flight & airport databases (airports.csv, airlines.dat, flights.db)
│   ├── agents.py       # Specialist agents (Supervisor, Flight, Hotel, Weather, Budget, Itinerary)
│   ├── graph.py        # LangGraph state machine with interrupts & guardrails
│   ├── mcp_client.py   # Multi-server MCP client (AviationStack, Tavily, OpenWeather)
│   ├── app.py          # FastAPI microservice for LangGraph (/ask endpoint)
│   └── frontend.py     # Streamlit interface
├── client/             # Standalone React + Vite client for the Travel Planning UI (Port 5173)
└── README.md           # Master documentation
```

---

## ✨ Integrated Features

### 1. 🤖 LangGraph Multi-Agent Travel Planning System (`travelService`)
* **Supervisor Agent**: Intelligent query routing, input guardrails, and specialist orchestration.
* **Flight Specialist**: AviationStack FastMCP integration with fallback to local SQLite flight database.
* **Hotel Specialist**: Real-time accommodation discovery powered by Tavily Search MCP.
* **Weather Specialist**: Live weather forecasts and climate insights via OpenWeatherMap MCP.
* **Budget Analyst**: Cost optimization, currency breakdown, and budget compliance.
* **Itinerary Synthesis**: Cohesive day-by-day travel plan creation.
* **Human-in-the-Loop (HITL)**: Safe draft inspection with approve/revise interactive feedback cycle.
* **PostgreSQL Session Memory**: Thread persistence for multi-turn planning.

### 2. 🛡️ Secure API Gateway (`gatewayService`)
* Routes requests transparently to `authService` (:8000) and `travelService` (:8002).
* Long-running execution timeout handling (120s) for multi-agent LLM reasoning chains.
* Centralized CORS and header propagation.

### 3. 🔐 User Authentication & Sessions (`backend`)
* Secure JWT Authentication with HTTP-only cookies.
* Redis-based rate limiting per IP and user ID.
* Email verification and password resets.
* Enriched `/travel/ask` endpoint automatically tagging sessions to authenticated users.

### 4. 💻 Next.js & React Frontends
* **`ascend-ai`**: Next.js 16 dashboard with authentication and integrated AI Travel Agent tab.
* **`client`**: Standalone lightweight React + Vite interface with live agent pipeline visualizer and endpoint toggles.
* **`frontend.py`**: Streamlit interactive demo.

---

## 🚀 Quick Start Guide

### Prerequisites
* Python 3.11+
* Node.js 18+ & npm
* PostgreSQL (optional for LangGraph memory checkpoints)
* Redis (optional for backend rate limiting)

---

### Step 1: Configure Environment Variables

#### In `Ascend.ai/travelService/.env`:
```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-20b
TAVILY_API_KEY=your_tavily_api_key
OPENWEATHER_API_KEY=your_openweather_api_key
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/ascend
PORT=8002
```

#### In `Ascend.ai/backend/.env`:
```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5434/ascend
SECRET_KEY=ascend-ai-secret-key-super-secure-jwt-token-2026
ALGORITHM=HS256
REDIS_URL=redis://localhost:6379
TRAVEL_SERVICE_URL=http://localhost:8002
```

#### In `Ascend.ai/ascend-ai/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GATEWAY_URL=http://localhost:8080
NEXT_PUBLIC_TRAVEL_URL=http://localhost:8002
```

---

### Step 2: Run the Services

#### 1. Travel Planning Multi-Agent Service (Port 8002)
```bash
cd Ascend.ai/travelService
pip install -r requirements.txt
python app.py
```
*Health check:* `http://localhost:8002/health-check`

#### 2. Central API Gateway (Port 8080)
```bash
cd Ascend.ai/gatewayService
pip install fastapi uvicorn httpx
python main.py
```
*Health check:* `http://localhost:8080/`

#### 3. Auth & User Backend (Port 8000)
```bash
cd Ascend.ai/backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
*Health check:* `http://localhost:8000/`

#### 4. Next.js Frontend (Port 3000)
```bash
cd Ascend.ai/ascend-ai
npm install
npm run dev
```
*Access at:* `http://localhost:3000`

#### 5. (Optional) Standalone Travel Planner Client (Port 5173)
```bash
cd Ascend.ai/client
npm install
npm run dev
```
*Access at:* `http://localhost:5173`

---

## 📡 API Endpoints Summary

| Endpoint | Method | Service | Description |
| :--- | :--- | :--- | :--- |
| `http://localhost:8080/travelService/ask` | `POST` | Gateway | Ask or resume trip query via Gateway |
| `http://localhost:8080/travel/ask` | `POST` | Gateway | Shorthand route to Travel Agent |
| `http://localhost:8002/ask` | `POST` | Travel Service | Direct LangGraph Multi-Agent execution |
| `http://localhost:8000/travel/ask` | `POST` | Backend | Enriched endpoint tying query to logged-in user |
| `http://localhost:8000/auth/login` | `POST` | Backend | User login & cookie issuance |
| `http://localhost:8080/authService/auth/login` | `POST` | Gateway | User login routed through Gateway |

---

## 📄 License
This project is licensed under the MIT License.
