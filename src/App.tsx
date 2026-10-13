import React, { useState, useEffect } from "react";
import {
  Database,
  Send,
  RefreshCw,
  Search,
  Plus,
  CheckCircle,
  AlertTriangle,
  Code2,
  Bot,
  Table,
  Zap,
} from "lucide-react";

interface Farmer {
  _id?: string;
  name: string;
  village: string;
  sugarcane_tons: number;
  payment_pending: number;
  amount_paid: number;
}

interface Summary {
  total_farmers: number;
  total_tons: number;
  total_pending: number;
  total_paid: number;
}

interface DirectMcpOutput {
  tool: string;
  executionTimeMs: number;
  rawOutput: string;
  data?: {
    source?: string;
    farmers?: Farmer[];
    summary?: Summary;
  };
}

interface McpTrace {
  serverName: string;
  toolName: string;
  protocol: string;
  toolDurationMs: number;
  aiDurationMs: number;
  totalDurationMs: number;
  model: string;
  dataSnippet: string;
}

export default function App() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total_farmers: 0,
    total_tons: 0,
    total_pending: 0,
    total_paid: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("ALL");

  // Output Views & Tabs: 'ai' | 'direct' | 'trace'
  const [activeTab, setActiveTab] = useState<"ai" | "direct" | "trace">("direct");

  // Question & Query State
  const [question, setQuestion] = useState(
    "How many farmers supply sugarcane to Sanjivani Sugar Factory? What is the total sugarcane supplied, total amount paid, total payment pending, and which farmer has the highest pending payment?"
  );
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [mcpTrace, setMcpTrace] = useState<McpTrace | null>(null);

  // Direct Output State
  const [directOutput, setDirectOutput] = useState<DirectMcpOutput | null>(null);
  const [directLoading, setDirectLoading] = useState<boolean>(false);

  // Add Farmer Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFarmer, setNewFarmer] = useState({
    name: "",
    village: "Kopargaon",
    sugarcane_tons: "",
    payment_pending: "",
    amount_paid: "",
  });

  // 1. Fetch live farmers table
  const fetchFarmers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/farmers");
      const data = await res.json();
      if (data.success) {
        setFarmers(data.farmers || []);
        setSummary(data.summary || { total_farmers: 0, total_tons: 0, total_pending: 0, total_paid: 0 });
      }
    } catch (err) {
      console.error("Error fetching farmers:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Direct MCP Tool Output
  const fetchDirectToolOutput = async () => {
    try {
      setDirectLoading(true);
      const res = await fetch("/api/mcp/direct-tool");
      const data = await res.json();
      if (data.success) {
        setDirectOutput(data);
      }
    } catch (err) {
      console.error("Error fetching direct MCP tool output:", err);
    } finally {
      setDirectLoading(false);
    }
  };

  // 3. Execute Full MCP + OpenAI Query
  const handleRunAiQuery = async (customQ?: string) => {
    const q = customQ || question;
    if (!q.trim()) return;

    try {
      setAiLoading(true);
      setActiveTab("ai");
      setAiAnswer(null);

      const res = await fetch("/api/mcp/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });

      const data = await res.json();
      if (data.success) {
        setAiAnswer(data.answer);
        setMcpTrace(data.mcpTrace);
      } else {
        setAiAnswer(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setAiAnswer(`Connection error: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  // On page load, fetch both farmers table AND direct MCP output immediately
  useEffect(() => {
    fetchFarmers();
    fetchDirectToolOutput();
  }, []);

  // Add new farmer
  const handleAddFarmer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFarmer.name || !newFarmer.sugarcane_tons) return;

    try {
      const res = await fetch("/api/farmers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFarmer.name,
          village: newFarmer.village,
          sugarcane_tons: parseFloat(newFarmer.sugarcane_tons),
          payment_pending: parseFloat(newFarmer.payment_pending) || 0,
          amount_paid: parseFloat(newFarmer.amount_paid) || 0,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setNewFarmer({ name: "", village: "Kopargaon", sugarcane_tons: "", payment_pending: "", amount_paid: "" });
        await fetchFarmers();
        await fetchDirectToolOutput();
      }
    } catch (err) {
      console.error("Failed to add farmer:", err);
    }
  };

  // Filtered farmers
  const filteredFarmers = farmers.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.village.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVillage = selectedVillage === "ALL" || f.village === selectedVillage;
    return matchesSearch && matchesVillage;
  });

  const villagesList = Array.from(new Set(farmers.map((f) => f.village)));

  return (
    <div className="container">
      {/* 1. Header */}
      <header className="header">
        <div>
          <h1>Sanjivani Sugar Factory — Farmer Management & MCP Portal</h1>
          <p className="subtitle">
            Model Context Protocol (MCP) Standard Client & Server with MongoDB Atlas & OpenAI
          </p>
        </div>
        <div className="header-actions">
          <span className="badge badge-success">
            <CheckCircle size={14} /> MCP Server: Active
          </span>
          <button className="btn btn-secondary" onClick={() => { fetchFarmers(); fetchDirectToolOutput(); }}>
            <RefreshCw size={14} className={loading || directLoading ? "spin" : ""} /> Refresh Data
          </button>
        </div>
      </header>

      {/* 2. Key Metrics Cards */}
      <section className="metrics-grid">
        <div className="metric-card">
          <span className="metric-label">Total Sugarcane Supplied</span>
          <div className="metric-value">
            {summary.total_tons?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
          </div>
          <span className="metric-sub">Metric Tons delivered</span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Total Farmers Registered</span>
          <div className="metric-value">{summary.total_farmers}</div>
          <span className="metric-sub">Active suppliers</span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Total Amount Paid</span>
          <div className="metric-value">₹{summary.total_paid?.toLocaleString("en-IN")}</div>
          <span className="metric-sub">Disbursed via bank transfer</span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Total Payment Pending</span>
          <div className="metric-value text-danger">₹{summary.total_pending?.toLocaleString("en-IN")}</div>
          <span className="metric-sub">Scheduled for next batch</span>
        </div>
      </section>

      {/* 3. Output & MCP Query Section */}
      <section className="card">
        <div className="card-header">
          <h2>Model Context Protocol (MCP) Output Console</h2>
          <span className="tag">Tool: get_farmer_report</span>
        </div>

        {/* Question & Run Controls */}
        <div className="query-section">
          <label className="input-label">Query Prompt / Question:</label>
          <div className="query-input-row">
            <input
              type="text"
              className="form-control"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter your question for the MCP tool and AI..."
            />
            <button
              className="btn btn-primary"
              onClick={() => handleRunAiQuery()}
              disabled={aiLoading}
            >
              <Bot size={16} /> {aiLoading ? "Running AI..." : "Run with AI"}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => { setActiveTab("direct"); fetchDirectToolOutput(); }}
              disabled={directLoading}
            >
              <Zap size={16} /> {directLoading ? "Fetching..." : "Fetch Direct Tool Output"}
            </button>
          </div>

          {/* Quick preset questions */}
          <div className="preset-chips">
            <span style={{ fontSize: "12px", color: "#64748b" }}>Quick questions:</span>
            <button className="chip" onClick={() => handleRunAiQuery("Which farmer has the highest pending payment?")}>
              Highest pending payment?
            </button>
            <button className="chip" onClick={() => handleRunAiQuery("What is the total sugarcane supplied and total amount paid?")}>
              Total tonnage & payment summary
            </button>
            <button className="chip" onClick={() => handleRunAiQuery("List farmers from Rahata village with their tons.")}>
              Rahata village farmers
            </button>
            <button className="chip" onClick={() => handleRunAiQuery("Which farmers supplied more than 120 tons?")}>
              Farmers over 120 tons
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="tabs-bar">
          <button
            className={`tab-btn ${activeTab === "direct" ? "active" : ""}`}
            onClick={() => setActiveTab("direct")}
          >
            <Code2 size={15} /> Direct Tool Output (JSON & Database Records)
          </button>
          <button
            className={`tab-btn ${activeTab === "ai" ? "active" : ""}`}
            onClick={() => setActiveTab("ai")}
          >
            <Bot size={15} /> AI Answer (OpenAI Summary)
          </button>
          <button
            className={`tab-btn ${activeTab === "trace" ? "active" : ""}`}
            onClick={() => setActiveTab("trace")}
          >
            <Database size={15} /> MCP Protocol Trace & Telemetry
          </button>
        </div>

        {/* Tab 1: Direct Tool Output */}
        {activeTab === "direct" && (
          <div className="tab-content">
            <div className="output-status-bar">
              <span>
                <strong>Tool Name:</strong> <code>get_farmer_report</code>
              </span>
              <span>
                <strong>Latency:</strong> {directOutput?.executionTimeMs || 0} ms
              </span>
              <span>
                <strong>Source:</strong> {directOutput?.data?.source || "Live Database"}
              </span>
            </div>

            <h4 style={{ margin: "16px 0 8px 0", fontSize: "14px", color: "#334155" }}>
              Direct Raw JSON Output (Returned by MCP Server via stdio):
            </h4>
            <pre className="code-viewer">
              {directOutput?.rawOutput || "Loading direct output..."}
            </pre>
          </div>
        )}

        {/* Tab 2: AI Answer */}
        {activeTab === "ai" && (
          <div className="tab-content">
            {aiLoading && (
              <div className="loading-state">
                <div className="spinner"></div>
                <span>Calling MCP Server over stdio → Querying Database → Asking OpenAI...</span>
              </div>
            )}
            {!aiLoading && aiAnswer && (
              <div className="ai-result-box">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px" }}>
                  <strong>AI Response:</strong>
                  {mcpTrace && <span style={{ fontSize: "12px", color: "#64748b" }}>Model: {mcpTrace.model} ({mcpTrace.totalDurationMs} ms)</span>}
                </div>
                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{aiAnswer}</div>
              </div>
            )}
            {!aiLoading && !aiAnswer && (
              <div style={{ color: "#64748b", padding: "20px 0" }}>
                Click <strong>"Run with AI"</strong> or one of the quick questions above to generate an AI answer.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: MCP Protocol Trace */}
        {activeTab === "trace" && (
          <div className="tab-content">
            <div className="trace-info-box">
              <p><strong>Protocol:</strong> Model Context Protocol (MCP) JSON-RPC 2.0 over standard I/O (`stdio`)</p>
              <p><strong>MCP Server Process:</strong> <code>node --import tsx server.ts</code></p>
              <p><strong>Registered Tool:</strong> <code>get_farmer_report</code></p>
              <p><strong>Database Target:</strong> MongoDB Atlas <code>sanjivani_sugar.farmers</code></p>
              {mcpTrace && (
                <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #cbd5e1" }}>
                  <p><strong>Tool Execution Time:</strong> {mcpTrace.toolDurationMs} ms</p>
                  <p><strong>OpenAI Processing Time:</strong> {mcpTrace.aiDurationMs} ms</p>
                  <p><strong>Total Pipeline Latency:</strong> {mcpTrace.totalDurationMs} ms</p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 4. Farmers Database Table */}
      <section className="card">
        <div className="card-header">
          <div>
            <h2>Farmers Database Records</h2>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
              Live records currently stored in the database
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div className="search-box">
              <Search size={14} color="#64748b" />
              <input
                type="text"
                placeholder="Search name or village..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="select-box"
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
            >
              <option value="ALL">All Villages</option>
              {villagesList.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>

            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={15} /> Add Farmer
            </button>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Farmer Name</th>
                <th>Village</th>
                <th>Sugarcane Supplied (Tons)</th>
                <th>Amount Paid (INR)</th>
                <th>Payment Pending (INR)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredFarmers.map((f, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{f.name}</td>
                  <td>{f.village}</td>
                  <td>{Number(f.sugarcane_tons).toFixed(2)} MT</td>
                  <td style={{ color: "#166534" }}>₹{Number(f.amount_paid).toLocaleString("en-IN")}</td>
                  <td style={{ color: Number(f.payment_pending) > 40000 ? "#b91c1c" : "#b45309" }}>
                    ₹{Number(f.payment_pending).toLocaleString("en-IN")}
                  </td>
                  <td>
                    {Number(f.payment_pending) === 0 ? (
                      <span className="badge badge-success">Cleared</span>
                    ) : Number(f.payment_pending) > 40000 ? (
                      <span className="badge badge-danger">High Pending</span>
                    ) : (
                      <span className="badge badge-warning">Partial</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredFarmers.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                    No farmer records found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Add Farmer Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Farmer Delivery</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleAddFarmer} className="modal-form">
              <div className="form-field">
                <label>Farmer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Shinde"
                  className="form-control"
                  value={newFarmer.name}
                  onChange={(e) => setNewFarmer({ ...newFarmer, name: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label>Village</label>
                <select
                  className="form-control"
                  value={newFarmer.village}
                  onChange={(e) => setNewFarmer({ ...newFarmer, village: e.target.value })}
                >
                  <option value="Kopargaon">Kopargaon</option>
                  <option value="Rahata">Rahata</option>
                  <option value="Shirdi">Shirdi</option>
                  <option value="Yeola">Yeola</option>
                  <option value="Niphad">Niphad</option>
                </select>
              </div>

              <div className="form-field">
                <label>Sugarcane Supplied (Metric Tons)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 120.50"
                  className="form-control"
                  value={newFarmer.sugarcane_tons}
                  onChange={(e) => setNewFarmer({ ...newFarmer, sugarcane_tons: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label>Amount Paid (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 85000"
                  className="form-control"
                  value={newFarmer.amount_paid}
                  onChange={(e) => setNewFarmer({ ...newFarmer, amount_paid: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label>Payment Pending (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 45000"
                  className="form-control"
                  value={newFarmer.payment_pending}
                  onChange={(e) => setNewFarmer({ ...newFarmer, payment_pending: e.target.value })}
                />
              </div>

              <div className="modal-buttons">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Farmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
