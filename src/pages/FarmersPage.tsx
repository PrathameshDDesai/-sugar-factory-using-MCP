import React, { useState } from "react";
import { Search, CheckCircle2, AlertCircle } from "lucide-react";
import { useFarmers } from "../hooks/useFarmers";
import { AddFarmerModal } from "../components/AddFarmerModal";
import { Topbar } from "../components/Topbar";

export default function FarmersPage() {
  const { farmers, villages, loading, fetchFarmers, addFarmer } = useFarmers();
  const [search, setSearch] = useState("");
  const [village, setVillage] = useState("ALL");
  const [sortKey, setSortKey] = useState<"name" | "sugarcane_tons" | "payment_pending" | "amount_paid">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showModal, setShowModal] = useState(false);

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filtered = farmers
    .filter((f) => {
      const q = search.toLowerCase();
      return (
        (f.name.toLowerCase().includes(q) || f.village.toLowerCase().includes(q)) &&
        (village === "ALL" || f.village === village)
      );
    })
    .sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });

  const SortIcon = ({ col }: { col: typeof sortKey }) =>
    sortKey === col ? (sortDir === "asc" ? <span> ↑</span> : <span> ↓</span>) : <span className="sort-hint"> ⇅</span>;

  return (
    <>
      <Topbar onMenuClick={() => {}} onRefresh={fetchFarmers} onAddFarmer={() => setShowModal(true)} loading={loading} />
      <div className="page-content">
        {/* Stats Strip */}
        <div className="stats-strip">
          <div className="stat-chip">Total Records: <strong>{farmers.length}</strong></div>
          <div className="stat-chip">Filtered: <strong>{filtered.length}</strong></div>
          <div className="stat-chip">Villages: <strong>{villages.length}</strong></div>
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <div className="search-box">
            <Search size={14} className="search-icon" />
            <input
              className="search-input"
              placeholder="Search by name or village..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch("")}>✕</button>
            )}
          </div>
          <select className="filter-select" value={village} onChange={(e) => setVillage(e.target.value)}>
            <option value="ALL">All Villages</option>
            {villages.map((v) => <option key={v._id} value={v._id}>{v._id}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="section-card">
          <div className="table-wrap">
            <table className="ftable">
              <thead>
                <tr>
                  <th className="th-idx">#</th>
                  <th className="th-sort" onClick={() => handleSort("name")}>
                    Farmer Name <SortIcon col="name" />
                  </th>
                  <th>Village</th>
                  <th className="th-sort" onClick={() => handleSort("sugarcane_tons")}>
                    Tons (MT) <SortIcon col="sugarcane_tons" />
                  </th>
                  <th className="th-sort" onClick={() => handleSort("amount_paid")}>
                    Paid (₹) <SortIcon col="amount_paid" />
                  </th>
                  <th className="th-sort" onClick={() => handleSort("payment_pending")}>
                    Pending (₹) <SortIcon col="payment_pending" />
                  </th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f, i) => (
                  <tr key={i}>
                    <td className="td-idx">{i + 1}</td>
                    <td className="td-name">{f.name}</td>
                    <td><span className="village-tag">{f.village}</span></td>
                    <td className="td-num">{Number(f.sugarcane_tons).toFixed(2)}</td>
                    <td className="td-paid">₹{Number(f.amount_paid).toLocaleString("en-IN")}</td>
                    <td className="td-num" style={{ color: Number(f.payment_pending) > 40000 ? "var(--rose)" : "var(--amber)" }}>
                      ₹{Number(f.payment_pending).toLocaleString("en-IN")}
                    </td>
                    <td>
                      {Number(f.payment_pending) === 0
                        ? <span className="badge badge--green"><CheckCircle2 size={11} /> Cleared</span>
                        : Number(f.payment_pending) > 40000
                        ? <span className="badge badge--red"><AlertCircle size={11} /> High Pending</span>
                        : <span className="badge badge--amber">Partial</span>}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="td-empty">No farmers found matching your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && <AddFarmerModal onClose={() => setShowModal(false)} onSave={addFarmer} />}
    </>
  );
}
