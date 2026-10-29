# LAB 2: Software Requirements Specification (SRS)

## Project: Ascend.ai – AI-Powered Travel Planning Platform

**Version:** 1.0  
**Prepared by:** Project Team  
**Reference:** [Project Repository](https://github.com/Pranav-789/SE)

## 1. Introduction

### 1.1 Purpose
This document defines the main functional and non-functional requirements of Ascend.ai, a web application that helps users plan trips using AI agents.

### 1.2 Scope
The system provides user authentication and an AI travel planner that can assist with flights, hotels, weather, budgets, and itinerary creation.

### 1.3 Intended Audience
This SRS is intended for developers, testers, project members, and users who need to understand the system requirements.

## 2. Overall Description

### 2.1 Product Perspective
Ascend.ai consists of a Next.js web application, a React client, a FastAPI authentication backend, an API gateway, and a LangGraph-based travel-planning service.

### 2.2 Main Features
- User registration and login.
- AI-assisted travel planning.
- Flight and hotel information discovery.
- Weather information and budget analysis.
- Day-by-day itinerary generation.
- Review and approval or revision of a proposed plan.
- Session persistence for continuing travel-planning conversations.

### 2.3 User Classes
- **Registered users:** Sign in and use travel-planning features.
- **Visitors:** Explore the application where access is permitted.
- **Administrators/developers:** Configure, maintain, and troubleshoot the services.

### 2.4 Operating Environment
- Web browser on desktop or mobile devices.
- Next.js and React frontend applications.
- Python/FastAPI backend services.
- PostgreSQL and Redis where configured.
- Internet connection for external data services.

### 2.5 Constraints and Dependencies
The system depends on external services for flight, hotel-search, weather, and AI capabilities. Some features require valid API credentials and database/service configuration.

## 3. Functional Requirements

- **FR-1: Authentication:** The system shall allow users to log in and manage authenticated sessions.
- **FR-2: Travel Request:** The system shall accept a user's travel-planning query.
- **FR-3: Flight Information:** The system shall retrieve flight information through the configured provider and use local data as a fallback where supported.
- **FR-4: Hotel Information:** The system shall search for relevant accommodation information.
- **FR-5: Weather Information:** The system shall provide weather information for the requested destination when available.
- **FR-6: Budget Analysis:** The system shall estimate and organize trip costs against the user's stated budget where sufficient data is available.
- **FR-7: Itinerary Generation:** The system shall combine relevant results into a day-by-day travel plan.
- **FR-8: Human Review:** The system shall allow users to review a proposed plan and approve or request revisions.
- **FR-9: Error Handling:** The system shall communicate when a request fails or required external information is unavailable.

## 4. External Interface Requirements

### 4.1 User Interface
The web interface shall provide authentication screens and a travel-planning interface for entering requests and viewing results.

### 4.2 Software Interfaces
The system uses Next.js, React, FastAPI, LangGraph, PostgreSQL, Redis, and configured external services such as AviationStack, Tavily, and OpenWeather.

### 4.3 Communication Interface
Frontend and backend services communicate through HTTP APIs. Requests and responses use structured data formats such as JSON where applicable.

## 5. Non-Functional Requirements

- **Performance:** The system should process requests within a reasonable time and handle long-running AI workflows.
- **Security:** Authentication credentials and session information must be handled securely; secrets must not be exposed in client-side code.
- **Reliability:** The system should handle service errors and unavailable external APIs gracefully.
- **Usability:** The interface should make it easy to submit a travel request and understand the generated plan.
- **Maintainability:** Services should remain modular so that individual components can be tested and updated.
- **Compatibility:** The application should work in modern web browsers.

## 6. Assumptions

- Users have an internet connection.
- Required API keys and service configurations are available for external integrations.
- External providers may have rate limits or temporary outages.
- The accuracy of travel information depends on the data returned by the configured providers.

## 7. Conclusion

This SRS summarizes the main requirements of Ascend.ai. It provides a basic reference for designing, developing, testing, and maintaining the AI-powered travel-planning platform.

## References

1. [Ascend.ai Project Repository](https://github.com/Pranav-789/SE)
2. [Ascend.ai README and Architecture](https://github.com/Pranav-789/SE/blob/main/Ascend.ai/README.md)
3. SRS reference template provided for Lab 2.
