import React, { useState, useEffect } from "react";
import { Bot, Database, Zap, CheckCircle2, Send } from "lucide-react";
import { Topbar } from "../components/Topbar";

const QUICK_PROMPTS = [
  "Which farmer has the highest pending payment?",
  "What is the total sugarcane supplied and payment status?",
  "List farmers who supplied over 120 metric tons.",
  "Summarize village-wise payment breakdown.",
];

const TRACE_STEPS = [
  { label: "MCP Client spawns server.ts via StdioClientTransport", done: true },
  { label: "JSON-RPC 2.0 handshake — capabilities exchanged", done: true },
  { label: "Client calls tools/call → get_farmer_report", done: true },
  { label: "Server queries sanjivani_sugar.farmers on MongoDB Atlas", done: true },
  { label: "Serialized JSON report written to stdout", done: true },
  { label: "Client forwards report + question to OpenAI gpt-4o-mini", done: true },
  { label: "Natural language answer returned to React UI", done: true },
];

export default function ConsolePage() {
  const [question, setQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [mcpTrace, setMcpTrace] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"direct" | "ai" | "trace">("direct");
  const [directOutput, setDirectOutput] = useState<string>("");
  const [directLoading, setDirectLoading] = useState(false);

  useEffect(() => {
    fetchDirect();
  }, []);

  const fetchDirect = async () => {
    setDirectLoading(true);
    try {
      const res = await fetch("/api/mcp/direct-tool");
      const data = await res.json();
      if (data.success) setDirectOutput(data.rawOutput);
    } catch (e) {}
    finally { setDirectLoading(false); }
  };

  const runAi = async (q?: string) => {
    const query = q || question;
    if (!query.trim()) return;
    if (q) setQuestion(q);
    setAiLoading(true);
    setAiAnswer(null);
    setActiveTab("ai");
    try {
      const res = await fetch("/api/mcp/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }),
      });
      const data = await res.json();
      if (data.success) { setAiAnswer(data.answer); setMcpTrace(data.mcpTrace); }
      else setAiAnswer(`Error: ${data.error}`);
    } catch (e: any) {
      setAiAnswer(`Error: ${e.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <>
      <Topbar onMenuClick={() => {}} />
      <div className="page-content">
        {/* Info Banner */}
        <div className="console-banner">
          <div className="console-banner-icon"><Bot size={22} /></div>
          <div>
            <div className="console-banner-title">MCP Intelligence Layer</div>
            <div className="console-banner-sub">
              Queries run through the Model Context Protocol — your question is answered by OpenAI <strong>gpt-4o-mini</strong> using live MongoDB data fetched by the <code>get_farmer_report</code> MCP tool.
            </div>
          </div>
        </div>

        {/* Query Box */}
        <div className="section-card console-query-card">
          <div className="cq-label">Ask a question about your farmer data</div>
          <div className="cq-row">
            <input
              className="cq-input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Which village has the highest total pending payment?"
              onKeyDown={(e) => e.key === "Enter" && runAi()}
            />
            <button className="btn-primary" onClick={() => runAi()} disabled={aiLoading || !question.trim()}>
              <Send size={15} />{aiLoading ? "Running..." : "Ask AI"}
            </button>
            <button className="btn-secondary" onClick={() => { setActiveTab("direct"); fetchDirect(); }} disabled={directLoading}>
              <Database size={14} />{directLoading ? "..." : "Direct Output"}
            </button>
          </div>

          {/* Quick Prompts */}
          <div className="quick-prompt-label">Quick prompts</div>
          <div className="chip-row">
            {QUICK_PROMPTS.map((q, i) => (
              <button key={i} className="chip" onClick={() => runAi(q)}>{q}</button>
            ))}
          </div>
        </div>

        {/* Output Tabs */}
        <div className="section-card console-output-card">
          <div className="ctabs">
            {[
              { id: "direct" as const, icon: <Database size={13} />, label: "Direct Tool Output" },
              { id: "ai" as const, icon: <Bot size={13} />, label: "AI Analysis" },
              { id: "trace" as const, icon: <Zap size={13} />, label: "MCP Trace" },
            ].map(({ id, icon, label }) => (
              <button key={id} className={`ctab ${activeTab === id ? "ctab--active" : ""}`} onClick={() => setActiveTab(id)}>
                {icon} {label}
              </button>
            ))}
          </div>

          <div className="console-output-body">
            {activeTab === "direct" && (
              <pre className="code-output">{directOutput || "Click 'Direct Output' to fetch raw MCP tool result."}</pre>
            )}

            {activeTab === "ai" && (
              aiLoading ? (
                <div className="loading-state">
                  <div className="spinner" />
                  <span>Executing MCP tool → querying MongoDB → generating AI answer...</span>
                </div>
              ) : aiAnswer ? (
                <div className="ai-result">
                  {mcpTrace && (
                    <div className="ai-meta">
                      Tool: {mcpTrace.toolDurationMs}ms · OpenAI: {mcpTrace.aiDurationMs}ms · Total: {mcpTrace.totalDurationMs}ms · Model: {mcpTrace.model}
                    </div>
                  )}
                  <div className="ai-text">{aiAnswer}</div>
                </div>
              ) : (
                <div className="empty-output">Run a query above to see the AI analysis here.</div>
              )
            )}

            {activeTab === "trace" && (
              <div className="trace-list">
                {TRACE_STEPS.map((step, i) => (
                  <div key={i} className="trace-item">
                    <CheckCircle2 size={15} color="var(--emerald)" className="trace-icon" />
                    <span><strong>Step {i + 1}:</strong> {step.label}</span>
                  </div>
                ))}
                {mcpTrace && (
                  <div className="trace-timing-box">
                    Tool: <strong>{mcpTrace.toolDurationMs}ms</strong> · AI: <strong>{mcpTrace.aiDurationMs}ms</strong> · Total: <strong>{mcpTrace.totalDurationMs}ms</strong>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
