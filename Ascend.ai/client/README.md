# WanderAI — Single Page React Application

A modern Single Page Application (SPA) built with React and Vite for the Multi-Agent Travel Planning System. It connects to the FastAPI backend via the single `/ask` endpoint.

---

## Features

- **Autonomous Multi-Agent Coordination**: Connects to the LangGraph backend (`/ask`) to orchestrate Supervisor, Flight, Hotel, Weather, Budget, and Itinerary agents.
- **Dual Execution Modes**:
  - ⚡ **Autonomous (Instant)**: Executes the complete multi-agent workflow and produces a finalized plan.
  - 🛡️ **Human-in-the-Loop (Interactive Review)**: Pauses at the draft itinerary, allowing users to review, request specific revisions, or approve before finalization.
- **Real-Time Agent Pipeline Tracker**: Visual flow tracking all 8 agent nodes and their active execution states.
- **Specialist Deep Dive Tabs**:
  - ✈️ **Flight Intelligence**: Recommended airports, airlines, duration, fare range, and booking guidance.
  - 🏨 **Hotels & Neighborhoods**: Curated stays categorized by budget, mid-range, and luxury with highlights.
  - ⛅ **Weather & Climate**: Real-time temperature, condition forecast, and packing tips.
  - 💰 **Budget Breakdown**: Cost estimation, daily allocations, and savings advice.
- **Rich Markdown Formatting**: Renders markdown tables, headers, and bulleted itineraries cleanly.
- **One-Click Actions**: Quick copy, configuration modal for custom backend endpoints, and session management.

---

## Getting Started

### 1. Start the FastAPI Backend

From the project root:

```bash
uvicorn app:app --reload --port 8000
```

### 2. Start the React Frontend

From the `client` directory:

```bash
npm install
npm run dev
```

Open your browser at `http://localhost:5173/`.
