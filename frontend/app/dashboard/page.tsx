"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "@/components/ChartCard";
import { API_BASE, BRANDS, CONDITIONS, ITEM_TYPES, Listing } from "@/lib/api";

function aggregateAvgPrice(listings: Listing[], key: "brand" | "item_type") {
  const groups = new Map<string, { sum: number; count: number }>();
  for (const listing of listings) {
    const k = listing[key];
    const g = groups.get(k) ?? { sum: 0, count: 0 };
    g.sum += listing.price;
    g.count += 1;
    groups.set(k, g);
  }
  return Array.from(groups.entries())
    .map(([name, g]) => ({ name, avg_price: Math.round((g.sum / g.count) * 100) / 100 }))
    .sort((a, b) => b.avg_price - a.avg_price);
}

export default function DashboardPage() {
  const [brand, setBrand] = useState("");
  const [itemType, setItemType] = useState("");
  const [condition, setCondition] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (brand) params.set("brand", brand);
    if (itemType) params.set("item_type", itemType);
    if (condition) params.set("condition", condition);

    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/api/listings?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
      })
      .then((data) => setListings(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [brand, itemType, condition]);

  const byBrand = aggregateAvgPrice(listings, "brand");
  const byItemType = aggregateAvgPrice(listings, "item_type");

  const selectClass =
    "bg-[#1a1a1a] border border-[#ff006e] text-[#f5f5f5] rounded-lg px-3 py-2 text-sm";

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <h1 className="font-grunge text-3xl text-[#ff1493]">Dashboard</h1>

      <div className="flex flex-wrap gap-4">
        <select className={selectClass} value={brand} onChange={(e) => setBrand(e.target.value)}>
          <option value="">All brands</option>
          {BRANDS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        <select
          className={selectClass}
          value={itemType}
          onChange={(e) => setItemType(e.target.value)}
        >
          <option value="">All item types</option>
          {ITEM_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          className={selectClass}
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
        >
          <option value="">All conditions</option>
          {CONDITIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-[#ffb3d9]">
          Couldn&apos;t reach the API ({error}). Is the backend running at {API_BASE}?
        </p>
      )}
      {!error && !loading && (
        <p className="text-[#ffb3d9] text-sm">{listings.length} listings match these filters.</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard title="Avg Price by Brand">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byBrand}>
                <CartesianGrid stroke="#333" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#f5f5f5" tick={{ fontSize: 12 }} />
                <YAxis stroke="#f5f5f5" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: "#1a1a1a", border: "1px solid #ff006e" }}
                  labelStyle={{ color: "#f5f5f5" }}
                />
                <Bar dataKey="avg_price" fill="#ff006e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Avg Price by Item Type">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byItemType}>
                <CartesianGrid stroke="#333" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#f5f5f5" tick={{ fontSize: 12 }} />
                <YAxis stroke="#f5f5f5" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: "#1a1a1a", border: "1px solid #ff006e" }}
                  labelStyle={{ color: "#f5f5f5" }}
                />
                <Bar dataKey="avg_price" fill="#ffb3d9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
