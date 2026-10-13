import React, { useState } from "react";
import { X } from "lucide-react";

const VILLAGES = ["Kopargaon", "Rahata", "Shirdi", "Yeola", "Niphad", "Sangamner", "Rahuri", "Shrirampur"];

interface Props {
  onClose: () => void;
  onSave: (f: { name: string; village: string; sugarcane_tons: number; amount_paid: number; payment_pending: number }) => Promise<any>;
}

export const AddFarmerModal: React.FC<Props> = ({ onClose, onSave }) => {
  const [form, setForm] = useState({ name: "", village: "Kopargaon", sugarcane_tons: "", amount_paid: "", payment_pending: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.sugarcane_tons) return;
    setSaving(true);
    try {
      await onSave({
        name: form.name.trim(),
        village: form.village,
        sugarcane_tons: parseFloat(form.sugarcane_tons) || 0,
        amount_paid: parseFloat(form.amount_paid) || 0,
        payment_pending: parseFloat(form.payment_pending) || 0,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span>Add Farmer Delivery</span>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="mf-group">
            <label>Farmer Name *</label>
            <input required placeholder="e.g. Ramesh Shinde" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="mf-group">
            <label>Village</label>
            <select value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })}>
              {VILLAGES.map((v) => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div className="mf-row">
            <div className="mf-group">
              <label>Sugarcane (MT) *</label>
              <input required type="number" step="0.01" placeholder="e.g. 120.50" value={form.sugarcane_tons} onChange={(e) => setForm({ ...form, sugarcane_tons: e.target.value })} />
            </div>
            <div className="mf-group">
              <label>Amount Paid (₹)</label>
              <input type="number" step="0.01" placeholder="e.g. 85000" value={form.amount_paid} onChange={(e) => setForm({ ...form, amount_paid: e.target.value })} />
            </div>
          </div>
          <div className="mf-group">
            <label>Payment Pending (₹)</label>
            <input type="number" step="0.01" placeholder="e.g. 45000" value={form.payment_pending} onChange={(e) => setForm({ ...form, payment_pending: e.target.value })} />
          </div>
          <div className="modal-buttons">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Farmer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
