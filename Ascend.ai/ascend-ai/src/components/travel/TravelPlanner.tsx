"use client";

import React, { useState, useEffect } from "react";
import {
  Compass,
  Plane,
  Building2,
  CloudSun,
  Wallet,
  CalendarCheck,
  UserCheck,
  CheckCircle2,
  Sparkles,
  Send,
  RotateCcw,
  Copy,
  Check,
  AlertCircle,
  FileText,
  Activity,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { travelService } from "@/services/travel.service";
import { AskResponse, TravelSessionHistoryItem } from "@/types/travel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const QUICK_PROMPTS = [
  {
    icon: "🌸",
    label: "7-Day Japan Budget",
    query: "Plan a 7-day Japan trip under Rs. 2 lakh. I prefer budget hotels and no overnight flights.",
  },
  {
    icon: "⛩️",
    label: "4-Day Kyoto & Nara",
    query: "Create a cultural 4-day itinerary for Kyoto and Nara focusing on traditional ryokans, historic shrines, and local ramen spots.",
  },
  {
    icon: "🏖️",
    label: "5-Day Goa Relaxed",
    query: "Plan a 5-day relaxing vacation in Goa with beachside stays, sunset viewpoints, seafood cafes, and under 50,000 INR.",
  },
  {
    icon: "🥐",
    label: "Weekend in Paris",
    query: "Plan a 3-day Paris itinerary covering the Louvre, Eiffel Tower, Montmartre, and budget-friendly boutique accommodations.",
  },
];

const AGENT_PIPELINE = [
  { id: "supervisor", name: "Supervisor", role: "Routing & Guardrails", icon: Compass, color: "text-amber-500" },
  { id: "flight_agent", name: "Flight Specialist", role: "AviationStack MCP", icon: Plane, color: "text-sky-500" },
  { id: "hotel_agent", name: "Hotel Specialist", role: "Tavily Search MCP", icon: Building2, color: "text-purple-500" },
  { id: "weather_agent", name: "Weather Specialist", role: "OpenWeather MCP", icon: CloudSun, color: "text-emerald-500" },
  { id: "budget_agent", name: "Budget Analyst", role: "Cost Estimation", icon: Wallet, color: "text-rose-500" },
  { id: "itinerary_agent", name: "Itinerary Planner", role: "Draft Synthesis", icon: CalendarCheck, color: "text-indigo-500" },
  { id: "human_approval", name: "Human Review", role: "Approval Gateway", icon: UserCheck, color: "text-orange-500" },
  { id: "final_response", name: "Final Plan", role: "Polished Delivery", icon: CheckCircle2, color: "text-teal-500" },
];

interface TravelPlannerProps {
  userId?: string;
}

export function TravelPlanner({ userId = "demo_user" }: TravelPlannerProps) {
  const [query, setQuery] = useState("");
  const [autoApprove, setAutoApprove] = useState(true);
  const [threadId, setThreadId] = useState("");
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const [activeTab, setActiveTab] = useState<"itinerary" | "flights" | "hotels" | "weather" | "budget" | "reasoning">("itinerary");
  const [result, setResult] = useState<AskResponse | null>(null);

  // HITL state
  const [approvalDecision, setApprovalDecision] = useState<"yes" | "no">("yes");
  const [feedbackText, setFeedbackText] = useState("");

  // History stored in localStorage
  const [history, setHistory] = useState<TravelSessionHistoryItem[]>([]);

  useEffect(() => {
    const newThread = `${userId}_${Math.random().toString(16).substring(2, 10)}`;
    setThreadId(newThread);
    try {
      const saved = localStorage.getItem("ascend_travel_history");
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  }, [userId]);

  const handleNewSession = () => {
    const newThread = `${userId}_${Math.random().toString(16).substring(2, 10)}`;
    setThreadId(newThread);
    setResult(null);
    setQuery("");
    setErrorMsg("");
    toast.info("Started a fresh trip planning session");
  };

  const handleAsk = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) {
      setErrorMsg("Please enter a destination or travel question first.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const data = await travelService.ask({
        query: query.trim(),
        user_id: userId,
        thread_id: threadId,
        auto_approve: autoApprove,
      });

      setResult(data);
      if (data.thread_id) setThreadId(data.thread_id);

      const newItem: TravelSessionHistoryItem = {
        id: Date.now(),
        query: query.trim(),
        thread_id: data.thread_id || threadId,
        date: new Date().toLocaleDateString(),
        status: data.status,
      };
      const updated = [newItem, ...history.filter((h) => h.query !== query.trim())].slice(0, 8);
      setHistory(updated);
      try {
        localStorage.setItem("ascend_travel_history", JSON.stringify(updated));
      } catch {}

      if (data.waiting_for_approval) {
        toast.warning("Draft itinerary ready! Human review needed.");
      } else {
        toast.success("Complete travel plan generated!");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to communicate with the travel planning agents.");
      toast.error(err.message || "Agent execution failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitApproval = async () => {
    setApproving(true);
    setErrorMsg("");

    try {
      const data = await travelService.submitApproval(
        threadId,
        approvalDecision === "yes",
        approvalDecision === "yes" ? "" : feedbackText,
        userId
      );
      setResult(data);
      if (approvalDecision === "yes") {
        toast.success("Plan approved & finalized!");
      } else {
        toast.info("Revised plan synthesized based on your feedback!");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to submit approval.");
      toast.error("Approval submission failed");
    } finally {
      setApproving(false);
    }
  };

  const copyToClipboard = (text?: string | null) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const isAgentActive = (agentId: string) => {
    if (loading) return true;
    if (!result) return false;
    if (agentId === "supervisor") return true;
    if (agentId === "human_approval" && result.waiting_for_approval) return true;
    if (agentId === "final_response" && result.final_response) return true;
    if (agentId === "itinerary_agent" && (result.itinerary || result.final_response)) return true;
    return (result.selected_agents || []).includes(agentId);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 rounded-2xl border border-blue-500/20 backdrop-blur-md shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Ascend Travel AI
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 font-medium">
                LangGraph + MCP
              </span>
            </h2>
          </div>
          <p className="text-sm text-gray-300">
            Autonomous multi-agent system coordinating AviationStack, Tavily Search & OpenWeather MCP tools.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="text-xs px-3 py-1.5 rounded-lg bg-gray-900/80 border border-gray-700/60 text-gray-300 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${loading ? "bg-amber-400 animate-ping" : "bg-emerald-400"}`} />
            Thread: <span className="font-mono text-white">{threadId ? threadId.split("_").slice(-1)[0] : "..."}</span>
          </div>

          <Button variant="outline" size="sm" onClick={handleNewSession} className="gap-1.5 border-gray-700 text-gray-200">
            <RotateCcw className="w-3.5 h-3.5" />
            New Trip
          </Button>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Suggestions:
        </span>
        {QUICK_PROMPTS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setQuery(p.query);
              setErrorMsg("");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-gray-800/80 hover:bg-gray-700 border border-gray-700 text-gray-200 transition-all hover:scale-105 whitespace-nowrap cursor-pointer"
          >
            <span>{p.icon}</span>
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Input Box */}
      <Card className="border border-gray-800 bg-gray-950/70 shadow-xl overflow-hidden backdrop-blur-sm">
        <CardContent className="p-4 space-y-3">
          <textarea
            className="w-full bg-transparent border-0 text-white placeholder-gray-500 focus:outline-none resize-none text-base font-normal leading-relaxed min-h-[90px]"
            placeholder="E.g., Plan a 7-day Japan trip under Rs. 2 lakh. I prefer budget boutique hotels, local ramen spots, and no overnight flights..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading || approving}
          />

          {errorMsg && (
            <div className="flex items-center gap-2 text-rose-400 text-sm bg-rose-950/40 p-2.5 rounded-lg border border-rose-800/50">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-gray-800/80">
            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
              />
              <span>Auto-approve draft itinerary (skip human pause)</span>
            </label>

            <Button
              onClick={() => handleAsk()}
              disabled={loading || approving || !query.trim()}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium px-6 gap-2 shadow-md cursor-pointer"
            >
              {loading ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>Agent Swarm Working...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Generate Itinerary</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Multi-Agent Pipeline Visualization */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          Autonomous Agent Execution Pipeline
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {AGENT_PIPELINE.map((agent) => {
            const active = isAgentActive(agent.id);
            const IconComponent = agent.icon;
            return (
              <div
                key={agent.id}
                className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition-all duration-300 ${
                  active
                    ? "bg-gray-800/90 border-blue-500/50 shadow-md shadow-blue-500/10 scale-[1.02]"
                    : "bg-gray-900/40 border-gray-800/60 opacity-50"
                }`}
              >
                <div className={`p-1.5 rounded-lg mb-1.5 ${active ? "bg-gray-700/60" : "bg-gray-800/40"}`}>
                  <IconComponent className={`w-4 h-4 ${active ? agent.color : "text-gray-500"}`} />
                </div>
                <div className="text-xs font-semibold text-white leading-tight truncate w-full">{agent.name}</div>
                <div className="text-[10px] text-gray-400 mt-0.5 leading-tight truncate w-full">{agent.role}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Human-in-the-Loop Review Banner */}
      {result?.waiting_for_approval && (
        <Card className="border-2 border-amber-500/60 bg-amber-950/20 shadow-2xl backdrop-blur-md overflow-hidden animate-pulse-border">
          <CardHeader className="bg-amber-500/10 border-b border-amber-500/30 py-3 px-4">
            <CardTitle className="text-base text-amber-300 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              Human-in-the-Loop: Review Draft Itinerary
            </CardTitle>
            <CardDescription className="text-xs text-amber-200/80">
              The agent swarm synthesized a draft itinerary. Please approve or provide feedback for revisions.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer">
                <input
                  type="radio"
                  name="approval_choice"
                  checked={approvalDecision === "yes"}
                  onChange={() => setApprovalDecision("yes")}
                  className="text-amber-500 focus:ring-amber-400"
                />
                <span className="font-medium text-emerald-400">Approve this plan</span>
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer">
                <input
                  type="radio"
                  name="approval_choice"
                  checked={approvalDecision === "no"}
                  onChange={() => setApprovalDecision("no")}
                  className="text-amber-500 focus:ring-amber-400"
                />
                <span className="font-medium text-amber-400">Request changes with feedback</span>
              </label>
            </div>

            {approvalDecision === "no" && (
              <textarea
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                placeholder="Specify your adjustments (e.g., 'Switch to 4-star hotels', 'Allocate more budget for dining')..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={2}
              />
            )}

            <Button
              onClick={handleSubmitApproval}
              disabled={approving}
              className="bg-amber-600 hover:bg-amber-500 text-white font-medium"
            >
              {approving ? "Synthesizing Updated Plan..." : "Submit Decision"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results View */}
      {result && (
        <Card className="border border-gray-800 bg-gray-950/80 shadow-2xl backdrop-blur-md">
          {/* Tabs bar */}
          <div className="flex items-center justify-between border-b border-gray-800 px-4 pt-2 overflow-x-auto gap-2 scrollbar-none">
            <div className="flex gap-1 overflow-x-auto scrollbar-none py-1">
              {[
                { id: "itinerary", label: "Itinerary / Final Plan", icon: CalendarCheck },
                { id: "flights", label: "Flights (AviationStack)", icon: Plane, count: result.flight_results ? "✓" : "" },
                { id: "hotels", label: "Hotels (Tavily)", icon: Building2, count: result.hotel_results ? "✓" : "" },
                { id: "weather", label: "Weather (OpenWeather)", icon: CloudSun, count: result.weather_results ? "✓" : "" },
                { id: "budget", label: "Budget Breakdown", icon: Wallet, count: result.budget_results ? "✓" : "" },
                { id: "reasoning", label: "Supervisor Logs", icon: Compass },
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isCurrent = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                      isCurrent
                        ? "border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-lg"
                        : "border-transparent text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    {tab.count && <span className="text-[10px] text-emerald-400 font-bold ml-0.5">{tab.count}</span>}
                  </button>
                );
              })}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(result.final_response || result.itinerary || result.response)}
              className="text-xs text-gray-400 hover:text-white shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? "Copied" : "Copy Plan"}</span>
            </Button>
          </div>

          <CardContent className="p-6">
            {activeTab === "itinerary" && (
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {result.final_response || result.itinerary || result.response}
                </ReactMarkdown>
              </div>
            )}

            {activeTab === "flights" && (
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {result.flight_results || "*No specific flight search data recorded for this session.*"}
                </ReactMarkdown>
              </div>
            )}

            {activeTab === "hotels" && (
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {result.hotel_results || "*No specific hotel search data recorded for this session.*"}
                </ReactMarkdown>
              </div>
            )}

            {activeTab === "weather" && (
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {result.weather_results || "*No weather forecast requested for this session.*"}
                </ReactMarkdown>
              </div>
            )}

            {activeTab === "budget" && (
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {result.budget_results || "*Budget breakdown synthesized within final itinerary.*"}
                </ReactMarkdown>
              </div>
            )}

            {activeTab === "reasoning" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
                  <h4 className="text-xs font-semibold uppercase text-amber-400 mb-2">Supervisor Routing Reasoning</h4>
                  <div className="markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {result.supervisor_reasoning || "Autonomous direct synthesis via supervisor routing."}
                    </ReactMarkdown>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <div>LLM Calls: <span className="font-mono text-white font-bold">{result.llm_calls}</span></div>
                  <div>Selected Agents: <span className="font-mono text-blue-400">{(result.selected_agents || []).join(", ") || "All"}</span></div>
                  <div>Status: <span className="font-mono text-emerald-400 uppercase">{result.status}</span></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
