import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  SlidersHorizontal,
  Copy,
  Check,
  AlertCircle,
  Clock,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  FileText
} from 'lucide-react';
import './App.css';

const QUICK_PROMPTS = [
  {
    icon: '🌸',
    label: '7-Day Japan Budget',
    query: 'Plan a 7-day Japan trip under Rs. 2 lakh. I prefer budget hotels and no overnight flights.'
  },
  {
    icon: '⛩️',
    label: '4-Day Kyoto & Nara',
    query: 'Create a cultural 4-day itinerary for Kyoto and Nara focusing on traditional ryokans, historic shrines, and local ramen spots.'
  },
  {
    icon: '🏖️',
    label: '5-Day Goa Relaxed',
    query: 'Plan a 5-day relaxing vacation in Goa with beachside stays, sunset viewpoints, seafood cafes, and under 50,000 INR.'
  },
  {
    icon: '🥐',
    label: 'Weekend in Paris',
    query: 'Plan a 3-day Paris itinerary covering the Louvre, Eiffel Tower, Montmartre, and budget-friendly boutique accommodations.'
  }
];

const AGENT_PIPELINE = [
  { id: 'supervisor', name: 'Supervisor', role: 'Routing & Guardrails', icon: Compass, color: 'var(--supervisor-color)' },
  { id: 'flight_agent', name: 'Flight Specialist', role: 'AviationStack MCP', icon: Plane, color: 'var(--flight-color)' },
  { id: 'hotel_agent', name: 'Hotel Specialist', role: 'Tavily Search MCP', icon: Building2, color: 'var(--hotel-color)' },
  { id: 'weather_agent', name: 'Weather Specialist', role: 'OpenWeather MCP', icon: CloudSun, color: 'var(--weather-color)' },
  { id: 'budget_agent', name: 'Budget Analyst', role: 'Cost Estimation', icon: Wallet, color: 'var(--budget-color)' },
  { id: 'itinerary_agent', name: 'Itinerary Planner', role: 'Draft Synthesis', icon: CalendarCheck, color: 'var(--itinerary-color)' },
  { id: 'human_approval', name: 'Human Review', role: 'Approval Gateway', icon: UserCheck, color: 'var(--approval-color)' },
  { id: 'final_response', name: 'Final Plan', role: 'Polished Delivery', icon: CheckCircle2, color: '#10b981' },
];

export default function App() {
  const [query, setQuery] = useState('');
  const [autoApprove, setAutoApprove] = useState(true);
  const [userId, setUserId] = useState('demo_user');
  const [threadId, setThreadId] = useState('');
  const [apiUrl, setApiUrl] = useState('http://localhost:8002/ask');
  
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const [activeTab, setActiveTab] = useState('itinerary');
  const [showSettings, setShowSettings] = useState(false);
  
  // Results
  const [result, setResult] = useState(null);

  // HITL state
  const [approvalDecision, setApprovalDecision] = useState('yes');
  const [feedbackText, setFeedbackText] = useState('');

  // History stored in localStorage
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('wanderai_trips');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Generate initial thread ID
  useEffect(() => {
    const newThread = `${userId}_${Math.random().toString(16).substring(2, 10)}`;
    setThreadId(newThread);
  }, []);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleNewSession = () => {
    const newThread = `${userId}_${Math.random().toString(16).substring(2, 10)}`;
    setThreadId(newThread);
    setResult(null);
    setQuery('');
    setErrorMsg('');
    triggerToast('Started a fresh session');
  };

  // Main Ask Submission
  const handleAsk = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) {
      setErrorMsg('Please enter a travel destination or question first.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const payload = {
      query: query.trim(),
      user_id: userId,
      thread_id: threadId,
      auto_approve: autoApprove,
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server responded with ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      if (data.thread_id) setThreadId(data.thread_id);

      // Save to recent history
      const newHistoryItem = {
        id: Date.now(),
        query: query.trim(),
        thread_id: data.thread_id || threadId,
        date: new Date().toLocaleDateString(),
        status: data.status,
      };
      const updatedHistory = [newHistoryItem, ...history.filter(h => h.query !== query.trim())].slice(0, 8);
      setHistory(updatedHistory);
      localStorage.setItem('wanderai_trips', JSON.stringify(updatedHistory));

      triggerToast(data.waiting_for_approval ? 'Draft created! Human review needed.' : 'Trip plan generated!');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to communicate with the travel planning agents.');
    } finally {
      setLoading(false);
    }
  };

  // HITL Approval submission
  const handleSubmitApproval = async () => {
    setApproving(true);
    setErrorMsg('');

    const payload = {
      thread_id: threadId,
      user_id: userId,
      approved: approvalDecision === 'yes',
      feedback: approvalDecision === 'yes' ? '' : feedbackText,
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server error (${response.status})`);
      }

      const data = await response.json();
      setResult(data);
      triggerToast(approvalDecision === 'yes' ? 'Plan approved & finalized!' : 'Revision generated with your feedback!');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to submit approval.');
    } finally {
      setApproving(false);
    }
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    triggerToast('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const isAgentActive = (agentId) => {
    if (loading) return true;
    if (!result) return false;
    if (agentId === 'supervisor') return true;
    if (agentId === 'human_approval' && result.waiting_for_approval) return true;
    if (agentId === 'final_response' && result.final_response) return true;
    if (agentId === 'itinerary_agent' && (result.itinerary || result.final_response)) return true;
    return (result.selected_agents || []).includes(agentId);
  };

  return (
    <div className="app-container">
      {/* App Header */}
      <header className="app-header glass-panel">
        <div className="brand-wrapper">
          <div className="brand-icon">
            <Compass size={26} />
          </div>
          <div>
            <h1 className="brand-title">
              WanderAI <span style={{ fontSize: '0.8rem', opacity: 0.7, fontWeight: 500 }}>v1.0</span>
            </h1>
            <p className="brand-subtitle">Autonomous Multi-Agent Travel Planner • LangGraph & MCP</p>
          </div>
        </div>

        <div className="header-actions">
          <div className="session-chip">
            <span className={`status-dot ${loading ? 'busy' : ''}`} />
            <span>Thread: <strong>{threadId ? threadId.split('_').slice(-1)[0] : '...'}</strong></span>
          </div>

          <button className="btn-secondary" onClick={() => setShowSettings(!showSettings)} title="Configure API & Session">
            <SlidersHorizontal size={16} />
            <span>Config</span>
          </button>

          <button className="btn-secondary" onClick={handleNewSession} title="Start fresh trip conversation">
            <RotateCcw size={16} />
            <span>New Trip</span>
          </button>
        </div>
      </header>

      {/* Hero & Quick Prompts */}
      <section className="hero-section">
        <h2 className="hero-title">
          Where will your <span className="hero-gradient-text">Agent Swarm</span> take you?
        </h2>
        <p className="hero-desc">
          Specialist AI agents coordinate live flight intelligence, real-time hotel discovery, weather forecasting, and budget optimization.
        </p>

        <div className="quick-prompts-wrapper">
          {QUICK_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              className="quick-prompt-chip"
              onClick={() => {
                setQuery(p.query);
                setErrorMsg('');
              }}
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Search Input Box */}
      <div className="search-card glass-panel glow-border">
        <div className="textarea-container">
          <textarea
            className="travel-textarea"
            placeholder="E.g., Plan a 7-day Japan trip under Rs. 2 lakh. I prefer boutique budget stays and food markets..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading || approving}
            rows={3}
          />
        </div>

        {errorMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f87171', fontSize: '0.88rem' }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="search-controls">
          <div className="mode-toggle-group">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', paddingLeft: '8px' }}>Execution Mode:</span>
            <button
              type="button"
              className={`mode-toggle-btn ${autoApprove ? 'active' : ''}`}
              onClick={() => setAutoApprove(true)}
              title="Automatically approve draft and produce final plan immediately"
            >
              <Sparkles size={14} color="#a855f7" />
              <span>Autonomous (Instant)</span>
            </button>
            <button
              type="button"
              className={`mode-toggle-btn ${!autoApprove ? 'active' : ''}`}
              onClick={() => setAutoApprove(false)}
              title="Pause at draft itinerary for your review and custom feedback"
            >
              <ShieldCheck size={14} color="#f59e0b" />
              <span>Human-in-the-Loop</span>
            </button>
          </div>

          <button
            className="btn-primary search-submit-btn"
            onClick={handleAsk}
            disabled={loading || approving || !query.trim()}
          >
            {loading ? (
              <>
                <div className="animate-spin-slow" style={{ width: 18, height: 18, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
                <span>Agents Planning...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>Launch Agents</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Agent Pipeline Tracker */}
      <div className="pipeline-section glass-panel">
        <div className="section-label">
          <Sparkles size={15} color="var(--accent-secondary)" />
          <span>Multi-Agent Swarm Pipeline</span>
        </div>

        <div className="pipeline-track">
          {AGENT_PIPELINE.map((agent) => {
            const Icon = agent.icon;
            const active = isAgentActive(agent.id);
            return (
              <div key={agent.id} className={`agent-node ${active ? 'active' : ''}`}>
                <div
                  className="agent-icon-badge"
                  style={{
                    backgroundColor: active ? agent.color : 'rgba(255,255,255,0.05)',
                    color: active ? '#ffffff' : 'var(--text-dim)',
                    boxShadow: active ? `0 0 16px ${agent.color}55` : 'none',
                  }}
                >
                  <Icon size={18} />
                </div>
                <span className="agent-name">{agent.name}</span>
                <span className="agent-status-tag">{agent.role}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Human In The Loop Approval Banner */}
      {result && result.waiting_for_approval && (
        <div className="hitl-card glass-panel">
          <div className="hitl-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="hitl-badge">
                <UserCheck size={14} />
                <span>Human Approval Gateway</span>
              </div>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Review Draft Itinerary</h3>
            </div>
            <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
              Thread: <code style={{ color: '#f59e0b' }}>{threadId}</code>
            </span>
          </div>

          <p style={{ color: '#e2e8f0', fontSize: '0.95rem', marginBottom: 14 }}>
            The agents synthesized a draft travel proposal. You can approve it as is to receive the polished itinerary, or request revisions.
          </p>

          <div className="hitl-options">
            <label className={`hitl-radio-label ${approvalDecision === 'yes' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="decision"
                value="yes"
                checked={approvalDecision === 'yes'}
                onChange={() => setApprovalDecision('yes')}
              />
              <span>✅ Approve this Draft</span>
            </label>

            <label className={`hitl-radio-label ${approvalDecision === 'revise' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="decision"
                value="revise"
                checked={approvalDecision === 'revise'}
                onChange={() => setApprovalDecision('revise')}
              />
              <span>✏️ Request Revisions</span>
            </label>
          </div>

          {approvalDecision === 'revise' && (
            <div style={{ margin: '14px 0' }}>
              <label className="form-label">Revision instructions for agents:</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="E.g., Please change the hotel area to Shinjuku and add a visit to TeamLab Planets..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button
              className={approvalDecision === 'yes' ? 'btn-accent-approve' : 'btn-accent-revise'}
              onClick={handleSubmitApproval}
              disabled={approving}
            >
              {approving ? (
                <>
                  <div className="animate-spin-slow" style={{ width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
                  <span>Finalizing Itinerary...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>{approvalDecision === 'yes' ? 'Confirm & Finalize Plan' : 'Submit Revisions'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Results View */}
      {result && (
        <div className="specialist-section glass-panel">
          {/* Supervisor Insight */}
          {result.supervisor_reasoning && (
            <div className="supervisor-card glass-panel" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Compass size={18} color="var(--accent-primary)" />
                <h4 style={{ margin: 0, fontSize: '0.98rem' }}>Supervisor Routing Strategy</h4>
              </div>
              <p className="supervisor-text">{result.supervisor_reasoning}</p>
              <div className="agents-tags-row">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', alignSelf: 'center' }}>Engaged Agents:</span>
                {(result.selected_agents || []).map((ag) => (
                  <span key={ag} className="agent-tag">
                    {ag.replace('_', ' ')}
                  </span>
                ))}
                {result.llm_calls > 0 && (
                  <span className="agent-tag" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#6ee7b7' }}>
                    {result.llm_calls} LLM Calls
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="tabs-nav">
            <button
              className={`tab-btn ${activeTab === 'itinerary' ? 'active' : ''}`}
              onClick={() => setActiveTab('itinerary')}
            >
              <CalendarCheck size={16} color="var(--itinerary-color)" />
              <span>Travel Plan & Itinerary</span>
            </button>

            {result.flight_results && (
              <button
                className={`tab-btn ${activeTab === 'flight' ? 'active' : ''}`}
                onClick={() => setActiveTab('flight')}
              >
                <Plane size={16} color="var(--flight-color)" />
                <span>Flight Intelligence</span>
              </button>
            )}

            {result.hotel_results && (
              <button
                className={`tab-btn ${activeTab === 'hotel' ? 'active' : ''}`}
                onClick={() => setActiveTab('hotel')}
              >
                <Building2 size={16} color="var(--hotel-color)" />
                <span>Hotels & Stays</span>
              </button>
            )}

            {result.weather_results && (
              <button
                className={`tab-btn ${activeTab === 'weather' ? 'active' : ''}`}
                onClick={() => setActiveTab('weather')}
              >
                <CloudSun size={16} color="var(--weather-color)" />
                <span>Weather & Packing</span>
              </button>
            )}

            {result.budget_results && (
              <button
                className={`tab-btn ${activeTab === 'budget' ? 'active' : ''}`}
                onClick={() => setActiveTab('budget')}
              >
                <Wallet size={16} color="var(--budget-color)" />
                <span>Budget Analysis</span>
              </button>
            )}
          </div>

          {/* Tab Content Display */}
          <div className="tab-content">
            {activeTab === 'itinerary' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: '1.25rem' }}>
                    {result.final_response ? '✨ Polished Travel Plan' : '📋 Draft Itinerary'}
                  </h3>
                  <div className="plan-actions">
                    <button
                      className="btn-secondary"
                      onClick={() => copyToClipboard(result.final_response || result.itinerary || result.response)}
                    >
                      {copied ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {result.final_response || result.itinerary || result.response || 'No itinerary available.'}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {activeTab === 'flight' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: '1.25rem' }}>✈️ Flight Specialist Insights</h3>
                  <button className="btn-secondary" onClick={() => copyToClipboard(result.flight_results)}>
                    <Copy size={15} /> <span>Copy</span>
                  </button>
                </div>
                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {result.flight_results || 'No flight data available.'}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {activeTab === 'hotel' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: '1.25rem' }}>🏨 Hotel & Neighborhood Recommendations</h3>
                  <button className="btn-secondary" onClick={() => copyToClipboard(result.hotel_results)}>
                    <Copy size={15} /> <span>Copy</span>
                  </button>
                </div>
                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {result.hotel_results || 'No hotel recommendations available.'}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {activeTab === 'weather' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: '1.25rem' }}>⛅ Climate, Forecast & Packing Guidance</h3>
                  <button className="btn-secondary" onClick={() => copyToClipboard(result.weather_results)}>
                    <Copy size={15} /> <span>Copy</span>
                  </button>
                </div>
                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {result.weather_results || 'No weather forecast available.'}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {activeTab === 'budget' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: '1.25rem' }}>💰 Cost Breakdown & Financial Planning</h3>
                  <button className="btn-secondary" onClick={() => copyToClipboard(result.budget_results)}>
                    <Copy size={15} /> <span>Copy</span>
                  </button>
                </div>
                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {result.budget_results || 'No budget analysis available.'}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.2rem' }}>API & Session Configuration</h3>
              <button className="btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setShowSettings(false)}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">FastAPI Endpoint URL (/ask)</label>
              <input
                className="form-input"
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                  onClick={() => setApiUrl('http://localhost:8002/ask')}
                >
                  Direct TravelService (:8002)
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                  onClick={() => setApiUrl('http://localhost:8080/travelService/ask')}
                >
                  API Gateway (:8080)
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                  onClick={() => setApiUrl('http://localhost:8000/travel/ask')}
                >
                  Backend Proxy (:8000)
                </button>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 4 }}>
                Choose direct port 8002, Gateway port 8080, or Backend port 8000
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">User ID</label>
              <input
                className="form-input"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Session Thread ID</label>
              <input
                className="form-input"
                type="text"
                value={threadId}
                onChange={(e) => setThreadId(e.target.value)}
              />
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%', marginTop: 8 }}
              onClick={() => {
                setShowSettings(false);
                triggerToast('Configuration updated');
              }}
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="toast-notice">
          <Sparkles size={16} color="var(--accent-secondary)" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
