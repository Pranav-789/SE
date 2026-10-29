# LAB 1: Selection of SDLC Model for the Project

## 1. Aim

To study different Software Development Life Cycle (SDLC) models and select the most suitable SDLC model for the **Ascend.ai AI-Powered Travel Planning Platform**.

## 2. Project Overview

**Project Name:** Ascend.ai – AI-Powered Travel Planning Platform

Ascend.ai is a modular web application that helps users plan trips through an AI-powered multi-agent system. It combines a web interface, authentication, backend microservices, an API gateway, and a travel-planning service that coordinates specialized AI agents.

The major components documented in the project repository are:

- **Next.js frontend (ascend-ai):** Provides the main dashboard and integrated travel-planning interface.
- **React + Vite client (client):** Provides a standalone travel-planning interface with an agent-pipeline visualizer.
- **Authentication backend (backend):** Uses FastAPI for user authentication, JWT-based sessions, HTTP-only cookies, and related account functionality.
- **API gateway (gatewayService):** Routes requests to backend services and handles shared concerns such as CORS and long-running requests.
- **Travel-planning service (travelService):** Uses LangGraph to coordinate specialist agents for flights, hotels, weather, budgeting, and itinerary synthesis.
- **External integrations:** Uses MCP-based integrations for services such as AviationStack, Tavily, and OpenWeather.
- **Data and persistence:** Uses PostgreSQL for application/session persistence, Redis for rate limiting, and local flight-related datasets as configured.

The project contains multiple connected components, so development requires coordination, integration testing, and ongoing refinement.

## 3. Objectives

1. Understand the major SDLC models and their characteristics.
2. Identify the development requirements and challenges of Ascend.ai.
3. Compare suitable SDLC models against the needs of the project.
4. Select an appropriate SDLC model and justify the selection.
5. Define the development phases and deliverables for the selected model.

## 4. Overview of SDLC

The Software Development Life Cycle (SDLC) is a structured process used to plan, design, develop, test, deploy, and maintain software. It helps teams manage project scope, quality, time, and resources.

Common SDLC models include:

- **Waterfall Model:** Development progresses through sequential phases, with each phase generally completed before the next begins.
- **V-Model:** Associates development activities with corresponding verification and validation activities.
- **Iterative Model:** Builds the software through repeated cycles, refining the solution with each iteration.
- **Spiral Model:** Uses repeated development cycles with explicit risk analysis, making it useful for projects with substantial risks.
- **Agile Model:** Develops software incrementally in short iterations, incorporating feedback and continuous testing.

## 5. Requirements and Characteristics of Ascend.ai

The project has the following development characteristics:

1. **Multiple services:** The frontend, authentication backend, API gateway, and travel-planning service must work together.
2. **Evolving AI behaviour:** Agent prompts, routing logic, guardrails, and itinerary generation may need repeated evaluation and refinement.
3. **External dependencies:** Flight, hotel-search, and weather integrations may change in availability, response format, or behaviour.
4. **Security requirements:** Authentication, session handling, cookie configuration, and rate limiting need testing and review.
5. **Integration requirements:** API contracts, service URLs, timeouts, data formats, and error handling must remain consistent across services.
6. **Incremental feature development:** Features can be implemented and tested separately before being integrated into the complete platform.
7. **Continuous testing:** Unit, integration, API, security, and end-to-end testing should accompany development.

These characteristics favour a model that supports incremental delivery and adaptation to feedback.

## 6. Comparison of SDLC Models

| Criterion | Waterfall | V-Model | Iterative | Agile |
|---|---|---|---|---|
| Handling changing requirements | Low | Low to moderate | High | High |
| Incremental feature delivery | Limited | Limited | Yes | Yes |
| Feedback during development | Usually later | Mainly through planned verification | At each iteration | Frequent |
| Testing approach | Often follows implementation phases | Planned alongside development phases | Repeated each iteration | Continuous throughout iterations |
| Suitability for AI experimentation | Limited | Moderate | Good | Very good |
| Suitability for multiple integrated services | Possible, but changes can be costly | Possible with strong upfront planning | Good | Very good |

**Observation:** Waterfall and V-Model can work well when requirements and interfaces are stable. Ascend.ai has several integrated services and AI components that benefit from repeated experimentation, testing, and feedback. Agile is therefore the stronger fit.

## 7. Selected SDLC Model: Agile

The **Agile SDLC Model** is selected for Ascend.ai.

Agile divides development into small, manageable iterations. Each iteration includes planning, design, implementation, testing, and review. The team can deliver a working increment, gather feedback, and adjust the backlog for the next iteration.

A Scrum-inspired workflow can be used, with a product backlog, short sprints, sprint reviews, and retrospectives. These practices are proposed for the project; they do not imply that the repository already follows a formal Scrum process.

### Why Agile is suitable

- **Adaptability:** Agent behaviour and external integrations can be refined as their limitations become clear.
- **Incremental development:** Authentication, gateway routing, travel agents, and frontend features can be delivered in stages.
- **Early testing:** Service interfaces and critical workflows can be tested before the entire platform is complete.
- **Continuous feedback:** User feedback can guide improvements to the travel-planning workflow and interface.
- **Risk reduction:** Integration problems and unreliable external-service behaviour can be identified earlier.
- **Parallel development:** Team members can work on separate services using agreed API contracts.
- **Continuous improvement:** Each sprint can address defects, performance, usability, and security findings.

## 8. Proposed Agile Development Plan

The following is a suggested plan for organizing future or ongoing development. Sprint duration and sequencing can be adjusted to the team's schedule.

| Sprint | Main activities | Expected deliverables |
|---|---|---|
| Sprint 1: Requirements and architecture | Identify user stories, define scope, document service responsibilities and API contracts | Requirements and architecture documentation |
| Sprint 2: Authentication and data layer | Develop or refine registration, login, session handling, and persistence | Tested authentication and data-access workflows |
| Sprint 3: API gateway and service integration | Configure routing, request/response handling, timeouts, and error propagation | Integrated gateway and backend services |
| Sprint 4: AI travel-planning workflow | Implement or refine supervisor routing, specialist agents, guardrails, and itinerary synthesis | Working multi-agent travel-planning flow |
| Sprint 5: Frontend integration | Connect the main dashboard to backend APIs and improve status/error feedback | End-to-end travel-planning user flow |
| Sprint 6: Testing and release preparation | Run unit, integration, security, and end-to-end tests; fix defects and document deployment | Tested release candidate and test report |

### Activities within each sprint

1. **Sprint planning:** Select high-priority user stories and define acceptance criteria.
2. **Design:** Agree on service contracts, data structures, and expected behaviour.
3. **Implementation:** Develop features in small, reviewable changes.
4. **Testing:** Run relevant automated and manual tests.
5. **Review:** Demonstrate the working increment and collect feedback.
6. **Retrospective:** Identify process improvements for the next sprint.

## 9. Testing Strategy

Testing should be performed throughout development rather than postponed until the final release.

- **Unit testing:** Test individual functions, agent logic, validation rules, and utility modules.
- **API testing:** Verify request formats, responses, status codes, authentication, and error handling.
- **Integration testing:** Verify communication among the frontend, gateway, authentication backend, and travel service.
- **AI workflow testing:** Evaluate routing decisions, guardrails, agent outputs, and itinerary quality against representative test cases.
- **External integration testing:** Test successful responses, timeouts, invalid credentials, rate limits, and fallback behaviour where supported.
- **Security testing:** Check access control, cookie settings, token handling, rate limiting, and protection of secrets.
- **End-to-end testing:** Verify that a user can authenticate, submit a travel request, and receive the expected workflow result.

Mock responses should be used where practical so that automated tests do not depend on the availability or cost of external APIs.

## 10. Advantages of Agile for Ascend.ai

1. Supports changes in requirements and AI-agent behaviour.
2. Enables early delivery of useful features.
3. Encourages frequent testing and feedback.
4. Makes it easier to isolate and debug problems across services.
5. Allows work to be divided among team members by component.
6. Reduces the risk of discovering major integration problems only at the end.
7. Supports continuous improvement of reliability, usability, and maintainability.

## 11. Limitations and Mitigation

| Potential limitation | Mitigation |
|---|---|
| Frequent changes can increase scope | Maintain a prioritized backlog and define sprint goals |
| Microservices can develop incompatible interfaces | Document API contracts and run integration tests |
| AI outputs can be inconsistent | Use representative evaluation cases, guardrails, and regression tests |
| External APIs may fail or change | Add timeouts, error handling, mocks, and fallbacks where appropriate |
| Short iterations may create documentation gaps | Update architecture, setup instructions, and API documentation during each sprint |
| Security issues may be missed during rapid development | Include security checks and code review in the definition of done |

## 12. Expected Outcome

By adopting an Agile approach, Ascend.ai can be developed and improved in small, testable increments. The team can integrate its services progressively, evaluate the multi-agent travel-planning workflow, respond to feedback, and address defects before they affect the entire application.

The expected outcome is a more maintainable, testable, and adaptable platform, with each iteration producing a verifiable improvement.

## 13. Conclusion

After considering the characteristics of Ascend.ai and comparing common SDLC models, **Agile is selected as the most suitable SDLC model**. The project's modular microservice architecture, evolving AI workflows, external integrations, and need for continuous testing make iterative development particularly valuable.

Agile will allow the team to plan, implement, test, review, and improve individual components while progressively integrating them into a complete AI-powered travel-planning platform.

## 14. Reference

- Project repository: [Pranav-789/SE](https://github.com/Pranav-789/SE)
- Project documentation: [Ascend.ai README](https://github.com/Pranav-789/SE/blob/main/Ascend.ai/README.md)
