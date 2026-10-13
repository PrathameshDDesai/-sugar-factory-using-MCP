import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Users, Wheat, IndianRupee, TrendingUp, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { useFarmers } from "../hooks/useFarmers";
import { AddFarmerModal } from "../components/AddFarmerModal";
import { Topbar } from "../components/Topbar";

const BAR_COLORS = ["#10b981", "#2dd4bf", "#34d399", "#6ee7b7", "#059669", "#0d9488", "#047857", "#14b8a6"];

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      <p className="tooltip-val">{Number(payload[0].value).toFixed(2)} MT</p>
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p style={{ color: payload[0].payload.color, fontWeight: 700 }}>
        {payload[0].name}: ₹{Number(payload[0].value).toLocaleString("en-IN")}
      </p>
    </div>
  );
};

export default function DashboardPage() {
  const { farmers, summary, villages, loading, fetchFarmers, addFarmer } = useFarmers();
  const [showModal, setShowModal] = useState(false);

  const barData = villages.map((v) => ({ name: v._id, tons: v.total_tons }));
  const pieData = [
    { name: "Amount Paid", value: summary.total_paid, color: "#10b981" },
    { name: "Pending", value: summary.total_pending, color: "#f59e0b" },
  ];
  const topFarmers = [...farmers].sort((a, b) => b.sugarcane_tons - a.sugarcane_tons).slice(0, 5);

  return (
    <>
      <Topbar
        onMenuClick={() => {}}
        onRefresh={fetchFarmers}
        onAddFarmer={() => setShowModal(true)}
        loading={loading}
      />
      <div className="page-content">
        {/* Metric Cards */}
        <div className="metrics-grid">
          {[
            { icon: <Users size={20} />, color: "emerald", label: "Total Farmers", val: summary.total_farmers, sub: "Registered suppliers" },
            { icon: <Wheat size={20} />, color: "teal", label: "Sugarcane Supplied", val: `${(summary.total_tons || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT`, sub: "Total metric tons" },
            { icon: <IndianRupee size={20} />, color: "green", label: "Amount Paid", val: `₹${(summary.total_paid || 0).toLocaleString("en-IN")}`, sub: "Disbursed to farmers", accent: "emerald" },
            { icon: <TrendingUp size={20} />, color: "amber", label: "Payment Pending", val: `₹${(summary.total_pending || 0).toLocaleString("en-IN")}`, sub: "Awaiting disbursement", accent: "amber" },
          ].map((m, i) => (
            <div key={i} className="metric-card">
              <div className={`metric-icon metric-icon--${m.color}`}>{m.icon}</div>
              <div className="metric-body">
                <div className="metric-label">{m.label}</div>
                <div className={`metric-value ${m.accent ? `metric-value--${m.accent}` : ""}`}>{m.val}</div>
                <div className="metric-sub">{m.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="charts-grid">
          {/* Bar Chart */}
          <div className="chart-card chart-card--wide">
            <div className="chart-header">
              <div className="chart-title">Village-wise Sugarcane Supply</div>
              <div className="chart-sub">Metric tons supplied per village</div>
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 20, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "var(--chart-hover)" }} />
                <Bar dataKey="tons" radius={[0, 5, 5, 0]}>
                  {barData.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="chart-card">
            <div className="chart-header">
              <div className="chart-title">Payment Status</div>
              <div className="chart-sub">Paid vs pending ratio</div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="45%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend formatter={(v) => <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{v}</span>} iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Farmers */}
          <div className="chart-card">
            <div className="chart-header">
              <div className="chart-title">Top 5 Suppliers</div>
              <div className="chart-sub">By sugarcane tonnage</div>
            </div>
            <div className="top-list">
              {topFarmers.map((f, i) => {
                const pct = (f.sugarcane_tons / (topFarmers[0]?.sugarcane_tons || 1)) * 100;
                return (
                  <div key={i} className="top-row">
                    <div className="top-rank">{i + 1}</div>
                    <div className="top-info">
                      <div className="top-name">{f.name}</div>
                      <div className="top-track"><div className="top-fill" style={{ width: `${pct}%` }} /></div>
                    </div>
                    <div className="top-val">{f.sugarcane_tons.toFixed(1)} MT</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Farmers Preview */}
        <div className="section-card">
          <div className="section-head">
            <div>
              <div className="chart-title">Recent Farmer Entries</div>
              <div className="chart-sub">Latest 5 records</div>
            </div>
            <Link to="/farmers" className="link-btn">View All <ArrowRight size={14} /></Link>
          </div>
          <div className="table-wrap">
            <table className="ftable">
              <thead>
                <tr>
                  <th>Farmer Name</th><th>Village</th><th>Tons (MT)</th>
                  <th>Amount Paid</th><th>Pending</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {farmers.slice(0, 5).map((f, i) => (
                  <tr key={i}>
                    <td className="td-name">{f.name}</td>
                    <td><span className="village-tag">{f.village}</span></td>
                    <td className="td-num">{Number(f.sugarcane_tons).toFixed(2)}</td>
                    <td className="td-paid">₹{Number(f.amount_paid).toLocaleString("en-IN")}</td>
                    <td className="td-pend" style={{ color: Number(f.payment_pending) > 40000 ? "var(--rose)" : "var(--amber)" }}>
                      ₹{Number(f.payment_pending).toLocaleString("en-IN")}
                    </td>
                    <td>
                      {Number(f.payment_pending) === 0
                        ? <span className="badge badge--green"><CheckCircle2 size={11} /> Cleared</span>
                        : Number(f.payment_pending) > 40000
                        ? <span className="badge badge--red"><AlertCircle size={11} /> High</span>
                        : <span className="badge badge--amber">Partial</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <AddFarmerModal onClose={() => setShowModal(false)} onSave={addFarmer} />
      )}
    </>
  );
}
