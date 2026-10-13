import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, AreaChart, Area
} from "recharts";
import { FileBarChart2, TrendingUp, DollarSign, PieChart as PieChartIcon } from "lucide-react";
import { useFarmers } from "../hooks/useFarmers";
import { Topbar } from "../components/Topbar";

const CustomReportTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} style={{ color: entry.color, fontWeight: 600, fontSize: "12px", margin: "2px 0" }}>
          {entry.name}: {typeof entry.value === "number" ? entry.value.toLocaleString("en-IN") : entry.value}
        </p>
      ))}
    </div>
  );
};

export default function ReportsPage() {
  const { villages, farmers, summary, loading, fetchFarmers } = useFarmers();

  const reportData = villages.map((v) => ({
    name: v._id,
    tons: Number(v.total_tons.toFixed(2)),
    farmers: v.farmer_count,
    paid: v.total_paid,
    pending: v.total_pending,
    avgTonsPerFarmer: Number((v.total_tons / (v.farmer_count || 1)).toFixed(2)),
  }));

  return (
    <>
      <Topbar onMenuClick={() => {}} onRefresh={fetchFarmers} loading={loading} />
      <div className="page-content">
        {/* Summary Header */}
        <div className="section-card">
          <div className="section-head">
            <div>
              <div className="chart-title">Executive Sugar Season Summary</div>
              <div className="chart-sub">Comprehensive yield, procurement, and financial analysis</div>
            </div>
          </div>
          <div className="metrics-grid" style={{ marginTop: "12px" }}>
            <div className="metric-card">
              <div className="metric-icon metric-icon--emerald"><TrendingUp size={20} /></div>
              <div className="metric-body">
                <div className="metric-label">Avg Yield Per Farmer</div>
                <div className="metric-value">
                  {summary.total_farmers ? (summary.total_tons / summary.total_farmers).toFixed(2) : "0"} MT
                </div>
                <div className="metric-sub">Average supply volume</div>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon metric-icon--teal"><DollarSign size={20} /></div>
              <div className="metric-body">
                <div className="metric-label">Disbursement Rate</div>
                <div className="metric-value">
                  {summary.total_paid + summary.total_pending > 0
                    ? ((summary.total_paid / (summary.total_paid + summary.total_pending)) * 100).toFixed(1)
                    : "0"}%
                </div>
                <div className="metric-sub">Settlement percentage</div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Comparison Chart */}
        <div className="section-card">
          <div className="section-head">
            <div>
              <div className="chart-title">Village Financial Distribution</div>
              <div className="chart-sub">Disbursed vs. pending payments across collection zones (in ₹)</div>
            </div>
          </div>
          <div style={{ width: "100%", height: 300, marginTop: "16px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                <Tooltip content={<CustomReportTooltip />} />
                <Legend />
                <Bar dataKey="paid" name="Amount Paid (₹)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="Payment Pending (₹)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tonnage vs Farmers Density Chart */}
        <div className="section-card">
          <div className="section-head">
            <div>
              <div className="chart-title">Procurement Density & Tonnage Trends</div>
              <div className="chart-sub">Sugarcane yield (MT) in relation to active supplier count</div>
            </div>
          </div>
          <div style={{ width: "100%", height: 280, marginTop: "16px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reportData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id="tonsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                <Tooltip content={<CustomReportTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="tons" name="Sugarcane Tons (MT)" stroke="#2dd4bf" fillOpacity={1} fill="url(#tonsGrad)" />
                <Line type="monotone" dataKey="avgTonsPerFarmer" name="Avg Tons / Farmer" stroke="#f59e0b" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Breakdown Table */}
        <div className="section-card">
          <div className="section-head">
            <div>
              <div className="chart-title">Zone Statistics Ledger</div>
              <div className="chart-sub">Aggregated performance by village</div>
            </div>
          </div>
          <div className="table-wrap">
            <table className="ftable">
              <thead>
                <tr>
                  <th>Village / Zone</th>
                  <th>Farmers Count</th>
                  <th>Total Tons (MT)</th>
                  <th>Avg MT / Farmer</th>
                  <th>Total Paid (₹)</th>
                  <th>Total Pending (₹)</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((r, i) => (
                  <tr key={i}>
                    <td className="td-name">{r.name}</td>
                    <td className="td-num">{r.farmers}</td>
                    <td className="td-num">{r.tons.toFixed(2)}</td>
                    <td className="td-num">{r.avgTonsPerFarmer.toFixed(2)}</td>
                    <td className="td-paid">₹{r.paid.toLocaleString("en-IN")}</td>
                    <td className="td-pend" style={{ color: r.pending > 100000 ? "var(--rose)" : "var(--amber)" }}>
                      ₹{r.pending.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
                {reportData.length === 0 && (
                  <tr><td colSpan={6} className="td-empty">No reports available.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
