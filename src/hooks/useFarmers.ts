import { useState, useEffect, useCallback } from "react";

export interface Farmer {
  _id?: string;
  name: string;
  village: string;
  sugarcane_tons: number;
  payment_pending: number;
  amount_paid: number;
}

export interface Summary {
  total_farmers: number;
  total_tons: number;
  total_pending: number;
  total_paid: number;
}

export interface VillageStat {
  _id: string;
  farmer_count: number;
  total_tons: number;
  total_pending: number;
  total_paid: number;
}

export function useFarmers() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total_farmers: 0,
    total_tons: 0,
    total_pending: 0,
    total_paid: 0,
  });
  const [villages, setVillages] = useState<VillageStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFarmers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/farmers");
      const data = await res.json();
      if (data.success) {
        setFarmers(data.farmers || []);
        setSummary(data.summary || {});
        setVillages(data.villages || []);
      } else {
        setError("Failed to load data.");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFarmers();
  }, [fetchFarmers]);

  const addFarmer = async (farmer: Omit<Farmer, "_id">) => {
    const res = await fetch("/api/farmers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(farmer),
    });
    const data = await res.json();
    if (data.success) await fetchFarmers();
    return data;
  };

  return { farmers, summary, villages, loading, error, fetchFarmers, addFarmer };
}
