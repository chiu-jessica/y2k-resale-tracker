"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "@/components/ChartCard";
import { API_BASE, TrendPoint } from "@/lib/api";

const LINE_COLORS = ["#ff006e", "#ffb3d9", "#f5f5f5"];

export default function TrendsPage() {
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/trends`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
      })
      .then(setTrends)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Long -> wide: one row per week, one column per brand, so Recharts can
  // draw one <Line> per brand against a shared week axis.
  const weeks = Array.from(new Set(trends.map((t) => t.week))).sort();
  const brandsPresent = Array.from(new Set(trends.map((t) => t.brand)));
  const chartData = weeks.map((week) => {
    const row: Record<string, string | number> = { week };
    for (const t of trends) {
      if (t.week === week) row[t.brand] = t.avg_price;
    }
    return row;
  });

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <h1 className="font-grunge text-3xl text-[#ff1493]">Price Trends</h1>
      <p className="text-[#ffb3d9] text-sm">
        Average price per brand, bucketed by week. New points appear each time the
        collector runs.
      </p>

      {error && (
        <p className="text-[#ffb3d9]">
          Couldn&apos;t reach the API ({error}). Is the backend running at {API_BASE}?
        </p>
      )}
      {!error && !loading && trends.length === 0 && (
        <p className="text-[#ffb3d9] text-sm">
          No dated listings yet — run the pipeline again to add another point.
        </p>
      )}

      <ChartCard title="Average Price Over Time">
        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid stroke="#333" strokeDasharray="3 3" />
              <XAxis dataKey="week" stroke="#f5f5f5" tick={{ fontSize: 12 }} />
              <YAxis stroke="#f5f5f5" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: "#1a1a1a", border: "1px solid #ff006e" }}
                labelStyle={{ color: "#f5f5f5" }}
              />
              <Legend />
              {brandsPresent.map((b, i) => (
                <Line
                  key={b}
                  type="monotone"
                  dataKey={b}
                  stroke={LINE_COLORS[i % LINE_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
