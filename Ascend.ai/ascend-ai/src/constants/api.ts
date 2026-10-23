export const API = {
    BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    GATEWAY_URL: process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8080",
    TRAVEL_DIRECT_URL: process.env.NEXT_PUBLIC_TRAVEL_URL || "http://localhost:8002",
    AUTH: "/auth",
    USERS: "/users",
    TRAVEL: "/travel",
} as const;