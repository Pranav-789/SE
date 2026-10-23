# SE_ASSIGNMENT Workspace

The entire multi-agent travel planning project and related services have been moved and integrated into [Ascend.ai](./Ascend.ai/).

---

## 📂 Structure Overview

```text
SE_ASSIGNMENT/
└── Ascend.ai/
    ├── ascend-ai/          # Next.js 16 full-stack frontend with AI Travel Agent in Dashboard
    ├── backend/            # FastAPI User Auth & Session Service with integrated /travel router (Port 8000)
    ├── gatewayService/     # Central API Gateway with microservice reverse proxying (Port 8080)
    ├── travelService/      # Autonomous Multi-Agent Travel Planner using LangGraph + FastMCP (Port 8002)
    │   ├── data/           # Flight & airport datasets (airports.csv, airlines.dat, flights.db)
    │   ├── agents.py       # Specialist agents (Supervisor, Flight, Hotel, Weather, Budget, Itinerary)
    │   ├── graph.py        # LangGraph state machine with interrupts & guardrails
    │   ├── mcp_client.py   # Multi-server FastMCP client (AviationStack, Tavily, OpenWeather)
    │   ├── app.py          # FastAPI service endpoint (/ask)
    │   └── frontend.py     # Streamlit interface
    ├── client/             # Standalone React + Vite travel planning client (Port 5173)
    ├── start-services.bat  # Launcher script for starting services
    └── README.md           # Master documentation for Ascend.ai
```

---

## 🚀 Running the Project

To launch all services or run individual components, open the [Ascend.ai](./Ascend.ai/) folder and run:

```bash
cd Ascend.ai
start-services.bat
```

Or see [Ascend.ai/README.md](./Ascend.ai/README.md) for full documentation and API endpoint specifications.
