# LAB 5: UML Class and Sequence Diagrams

## Project: Ascend.ai – AI-Powered Travel Planning Platform

**Repository:** [Pranav-789/SE](https://github.com/Pranav-789/SE)

## Aim

To represent the main components and interactions of Ascend.ai using a **Class Diagram** and a **Sequence Diagram**.

## 1. Class Diagram

The class diagram below is a high-level, conceptual design based on the modules described in the repository README. It shows the main responsibilities and relationships; it does not claim that these exact class names exist in the source code.

```mermaid
classDiagram
    class User {
        +userId
        +login()
        +submitTravelRequest()
        +reviewItinerary()
    }

    class WebClient {
        +displayDashboard()
        +sendRequest()
        +displayResults()
    }

    class APIGateway {
        +routeRequest()
        +forwardResponse()
    }

    class AuthService {
        +authenticateUser()
        +manageSession()
        +verifyAccount()
    }

    class TravelService {
        +processQuery()
        +resumeSession()
    }

    class SupervisorAgent {
        +checkInput()
        +routeQuery()
        +coordinateAgents()
    }

    class FlightAgent {
        +getFlightInformation()
    }

    class HotelAgent {
        +searchAccommodation()
    }

    class WeatherAgent {
        +getWeatherInformation()
    }

    class BudgetAgent {
        +analyzeCosts()
    }

    class ItineraryAgent {
        +createItinerary()
    }

    class SessionStore {
        +saveCheckpoint()
        +loadSession()
    }

    User --> WebClient : uses
    WebClient --> APIGateway : sends HTTP requests
    APIGateway --> AuthService : routes authentication
    APIGateway --> TravelService : routes travel queries
    TravelService --> SupervisorAgent : invokes
    SupervisorAgent --> FlightAgent : coordinates
    SupervisorAgent --> HotelAgent : coordinates
    SupervisorAgent --> WeatherAgent : coordinates
    SupervisorAgent --> BudgetAgent : coordinates
    SupervisorAgent --> ItineraryAgent : coordinates
    TravelService --> SessionStore : persists session
```

### Main classes/modules

- **WebClient:** Collects travel requirements and displays results.
- **APIGateway:** Routes client requests to backend services.
- **AuthService:** Handles authentication and user sessions.
- **TravelService:** Runs the LangGraph travel-planning workflow.
- **SupervisorAgent:** Checks and routes requests to specialist agents.
- **FlightAgent, HotelAgent, WeatherAgent:** Retrieve relevant travel information.
- **BudgetAgent:** Organizes cost estimates against the user's budget.
- **ItineraryAgent:** Combines results into a proposed itinerary.
- **SessionStore:** Represents the configured persistence used to resume supported conversations.

## 2. Sequence Diagram

The sequence diagram shows the typical flow when a user submits a travel-planning request and reviews the generated itinerary.

```mermaid
sequenceDiagram
    actor User
    participant UI as Web Client
    participant GW as API Gateway
    participant Auth as Auth Backend
    participant TS as Travel Service
    participant SA as Supervisor Agent
    participant FA as Flight Agent
    participant HA as Hotel Agent
    participant WA as Weather Agent
    participant BA as Budget Agent
    participant IA as Itinerary Agent
    participant DB as Session Store

    User->>UI: Enter travel requirements
    UI->>GW: Submit travel request
    GW->>Auth: Validate authenticated request
    Auth-->>GW: Authentication/session result
    GW->>TS: Forward travel query
    TS->>DB: Load or create session
    DB-->>TS: Session state
    TS->>SA: Process query
    SA->>FA: Request flight information
    FA-->>SA: Flight results
    SA->>HA: Request accommodation information
    HA-->>SA: Hotel results
    SA->>WA: Request weather information
    WA-->>SA: Weather results
    SA->>BA: Analyze costs and budget
    BA-->>SA: Budget analysis
    SA->>IA: Generate itinerary from results
    IA-->>SA: Proposed itinerary
    SA-->>TS: Return proposed plan
    TS->>DB: Save updated session state
    TS-->>GW: Return travel plan
    GW-->>UI: Send response
    UI-->>User: Display proposed itinerary
    User->>UI: Approve or request revision
```

**Note:** The sequence is a simplified logical flow. The repository documents authentication, the gateway, LangGraph agents, and PostgreSQL session persistence; exact internal calls may vary by implementation and configuration.

## Conclusion

The class diagram summarizes the responsibilities and relationships among Ascend.ai's main modules. The sequence diagram illustrates how a travel request moves through the client, gateway, authentication layer, and multi-agent travel service to produce a proposed itinerary.

## Reference

- [Ascend.ai Project Repository and Architecture](https://github.com/Pranav-789/SE/blob/main/Ascend.ai/README.md)
