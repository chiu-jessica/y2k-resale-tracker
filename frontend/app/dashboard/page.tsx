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
import FilterChips, { toggle } from "@/components/FilterChips";
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
  // No chips selected by default = no filter, so the page opens showing
  // all data.
  const [brands, setBrands] = useState<string[]>([]);
  const [itemTypes, setItemTypes] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Toggling a chip fires a new request before the previous one may have
    // resolved. Without this, an older response can land after a newer one
    // and silently overwrite it with stale data — abort the previous
    // request whenever the filters change again (or the component unmounts).
    const controller = new AbortController();

    const params = new URLSearchParams();
    brands.forEach((b) => params.append("brand", b));
    itemTypes.forEach((t) => params.append("item_type", t));
    conditions.forEach((c) => params.append("condition", c));

    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/api/listings?${params.toString()}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
      })
      .then((data) => setListings(data))
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [brands, itemTypes, conditions]);

  const byBrand = aggregateAvgPrice(listings, "brand");
  const byItemType = aggregateAvgPrice(listings, "item_type");

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <h1 className="font-grunge text-3xl text-[#ff006e]">Dashboard</h1>

      <div className="flex flex-wrap gap-8">
        <FilterChips
          label="Brand"
          options={BRANDS}
          selected={brands}
          onToggle={(v) => setBrands((prev) => toggle(prev, v))}
          onClear={() => setBrands([])}
        />
        <FilterChips
          label="Item type"
          options={ITEM_TYPES}
          selected={itemTypes}
          onToggle={(v) => setItemTypes((prev) => toggle(prev, v))}
          onClear={() => setItemTypes([])}
        />
        <FilterChips
          label="Condition"
          options={CONDITIONS}
          selected={conditions}
          onToggle={(v) => setConditions((prev) => toggle(prev, v))}
          onClear={() => setConditions([])}
        />
      </div>

      {error && (
        <p className="text-[#ffb3d9]">
          Couldn&apos;t reach the API ({error}). Is the backend running at {API_BASE}?
        </p>
      )}
      {!error && !loading && (
        <p className="text-[#ffb3d9] text-sm">{listings.length} listings match these filters.</p>
      )}

      <div className="grid grid-cols-1 gap-8">
        <ChartCard title="Average Price by Brand">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byBrand}>
                <CartesianGrid stroke="#333" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#f5f5f5" tick={{ fontSize: 12 }} interval={0} />
                <YAxis stroke="#f5f5f5" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: "#1a1a1a", border: "1px solid #ff006e" }}
                  labelStyle={{ color: "#f5f5f5" }}
                />
                <Bar dataKey="avg_price" fill="#c20054" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Average Price by Item Type">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byItemType}>
                <CartesianGrid stroke="#333" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#f5f5f5" tick={{ fontSize: 12 }} interval={0} />
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
