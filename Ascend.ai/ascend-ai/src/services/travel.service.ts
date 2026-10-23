import apiClient from "@/lib/axios";
import { API } from "@/constants/api";
import { AskRequest, AskResponse } from "@/types/travel";

export const travelService = {
  async ask(payload: AskRequest): Promise<AskResponse> {
    try {
      // Primary: Route through backend /travel/ask which injects user session
      const response = await apiClient.post<AskResponse>(`${API.TRAVEL}/ask`, payload);
      return response.data;
    } catch (err: any) {
      // Fallback 1: Try API gateway route /travelService/ask or /ask
      try {
        const gwRes = await fetch(`${API.GATEWAY_URL}/travelService/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (gwRes.ok) {
          return await gwRes.json();
        }
      } catch {}

      // Fallback 2: Try direct travel service endpoint
      try {
        const directRes = await fetch(`${API.TRAVEL_DIRECT_URL}/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (directRes.ok) {
          return await directRes.json();
        }
      } catch {}

      const msg = err.response?.data?.detail || err.message || "Failed to communicate with travel planning agent";
      throw new Error(msg);
    }
  },

  async submitApproval(threadId: string, approved: boolean, feedback: string = "", userId: string = "demo_user"): Promise<AskResponse> {
    return this.ask({
      thread_id: threadId,
      user_id: userId,
      approved,
      feedback: approved ? "" : feedback,
    });
  },

  async checkHealth(): Promise<{ status: string; url: string }> {
    try {
      const res = await apiClient.get(`${API.TRAVEL}/health`);
      return { status: res.data.status || "ok", url: API.BASE_URL };
    } catch {
      try {
        const direct = await fetch(`${API.TRAVEL_DIRECT_URL}/health-check`);
        if (direct.ok) return { status: "connected", url: API.TRAVEL_DIRECT_URL };
      } catch {}
      return { status: "disconnected", url: API.TRAVEL_DIRECT_URL };
    }
  },
};
