export interface AskRequest {
  query?: string;
  question?: string;
  prompt?: string;
  message?: string;
  user_id?: string;
  thread_id?: string;
  auto_approve?: boolean;
  approved?: boolean | null;
  feedback?: string;
}

export interface AskResponse {
  status: "success" | "waiting_for_approval" | "error";
  thread_id: string;
  response: string;
  final_response?: string | null;
  itinerary?: string | null;
  supervisor_reasoning?: string | null;
  selected_agents: string[];
  flight_results?: string | null;
  hotel_results?: string | null;
  weather_results?: string | null;
  budget_results?: string | null;
  llm_calls: number;
  waiting_for_approval: boolean;
  approval_request?: string | null;
}

export interface TravelSessionHistoryItem {
  id: number;
  query: string;
  thread_id: string;
  date: string;
  status: string;
}
