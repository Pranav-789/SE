# LAB 4: UML Diagrams

## Project: Ascend.ai – AI-Powered Travel Planning Platform

**Repository:** [Pranav-789/SE](https://github.com/Pranav-789/SE)

## Aim

To draw the **Use-Case Diagram** and **Activity Diagram** for the Ascend.ai project.

## 1. Use-Case Diagram

The diagram shows how a user interacts with Ascend.ai to sign in, submit a travel-planning request, view information, and review the generated itinerary. External travel-information services provide data to the system.

```mermaid
flowchart LR
    User([User])
    Admin([Developer / Administrator])
    Flight[Flight Information Service]
    Hotel[Hotel Search Service]
    Weather[Weather Service]

    subgraph System["Ascend.ai Platform"]
        Login((Sign in))
        Request((Submit travel request))
        Flights((View flight information))
        Hotels((View hotel information))
        Forecast((View weather information))
        Budget((Review budget))
        Itinerary((Generate itinerary))
        Review((Approve or revise plan))
        Manage((Configure and maintain services))
    end

    User --> Login
    User --> Request
    User --> Flights
    User --> Hotels
    User --> Forecast
    User --> Budget
    User --> Itinerary
    User --> Review

    Flight --> Flights
    Hotel --> Hotels
    Weather --> Forecast
    Admin --> Manage

    Request -.-> Itinerary
    Flights -.-> Itinerary
    Hotels -.-> Itinerary
    Forecast -.-> Itinerary
    Budget -.-> Itinerary
```

**Actors**
- **User:** Signs in, submits travel queries, and reviews the travel plan.
- **Developer/Administrator:** Configures and maintains application services.
- **External services:** Provide flight, hotel-search, and weather data.

## 2. Activity Diagram

The activity diagram describes the main flow from submitting a travel request to receiving and reviewing the generated plan.

```mermaid
flowchart TD
    Start([Start]) --> Open[Open Ascend.ai]
    Open --> Auth{User authenticated?}
    Auth -- No --> Login[Sign in]
    Login --> Valid{Login successful?}
    Valid -- No --> Error[Show login error]
    Error --> Login
    Valid -- Yes --> Enter
    Auth -- Yes --> Enter[Enter travel requirements]
    Enter --> Submit[Submit travel request]
    Submit --> Supervisor[Supervisor checks and routes request]
    Supervisor --> Flight[Retrieve flight information]
    Supervisor --> Hotel[Search hotel information]
    Supervisor --> Weather[Retrieve weather information]
    Flight --> Budget[Analyze budget and available results]
    Hotel --> Budget
    Weather --> Budget
    Budget --> Plan[Generate proposed itinerary]
    Plan --> Review[User reviews proposed plan]
    Review --> Decision{Approve plan?}
    Decision -- Yes --> Result[Display final travel plan]
    Decision -- No --> Revise[User requests changes]
    Revise --> Supervisor
    Result --> End([End])
```

## Conclusion

The use-case diagram identifies the main users and their interactions with Ascend.ai. The activity diagram shows the key workflow for creating and reviewing an AI-generated travel plan.

**Note:** These diagrams are based on the features described in the repository README. They are high-level UML-style diagrams written in Mermaid syntax so they can be rendered in GitHub Markdown.
