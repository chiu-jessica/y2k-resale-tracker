"use client";
import { useState, useEffect } from "react";
import ChartCard from "@/components/ChartCard";
import StatCard from "@/components/StatCard";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BRANDS, CONDITIONS, ITEM_TYPES } from "@/lib/api";

// The model reports raw one-hot feature names like "cat__brand_Baby Phat" —
// turn those into something a user can actually read, e.g. "Brand: Baby Phat".
const FEATURE_COLUMN_LABELS: Record<string, string> = {
  brand: "Brand",
  condition: "Condition",
  item_type: "Item Type",
};

function formatFeatureName(feature: string): string {
  const stripped = feature.replace(/^cat__/, "");
  for (const [column, label] of Object.entries(FEATURE_COLUMN_LABELS)) {
    if (stripped.startsWith(`${column}_`)) {
      return `${label}: ${stripped.slice(column.length + 1)}`;
    }
  }
  return stripped;
}

type FeatureImportance = { feature: string; importance: number };

export default function PredictorPage() {
  const [brand, setBrand] = useState("Juicy Couture");
  const [condition, setCondition] = useState("Pre-owned");
  const [itemType, setItemType] = useState("hoodie");
  const [prediction, setPrediction] = useState<number | null>(null);
  const [importance, setImportance] = useState<FeatureImportance[]>([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/feature-importance")
      .then((res) => res.json())
      .then(setImportance);
  }, []);

  const handlePredict = async () => {
    const res = await fetch(
      `http://localhost:8000/api/predict?brand=${brand}&condition=${condition}&item_type=${itemType}`,
      { method: "POST" }
    );
    const data = await res.json();
    setPrediction(data.predicted_price);
  };

  const selectClass =
    "bg-[#0a0a0a] border border-[#ff006e] text-[#f5f5f5] rounded-lg px-3 py-2 text-sm";

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <ChartCard>
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-0 lg:items-start">
          <div className="shrink-0 space-y-4">
            <h3 className="font-grunge text-xl text-[#ff006e]">Price Predictor</h3>

            <div className="flex flex-wrap gap-4">
              <label className="flex flex-col gap-1 text-sm text-[#ffb3d9]">
                Brand
                <select
                  className={selectClass}
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                >
                  {BRANDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm text-[#ffb3d9]">
                Condition
                <select
                  className={selectClass}
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm text-[#ffb3d9]">
                Item Type
                <select
                  className={selectClass}
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value)}
                >
                  {ITEM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button onClick={handlePredict} className="bg-[#ff006e] px-6 py-2 rounded-lg">
              Predict Price
            </button>
          </div>

          <div className="flex-1 self-stretch flex items-center justify-end pr-6">
            <div className="w-72">
              <StatCard
                label="Estimated Price"
                value={prediction !== null ? `$${prediction.toFixed(2)}` : "..."}
                accent
                size="lg"
              />
            </div>
          </div>
        </div>
      </ChartCard>

      <ChartCard title="What Drives Price?">
        <div className="h-[420px] w-full max-w-4xl">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={importance.map((row) => ({ ...row, label: formatFeatureName(row.feature) }))}
              layout="vertical"
              margin={{ left: 10, right: 20 }}
            >
              <CartesianGrid stroke="#333" strokeDasharray="3 3" />
              <XAxis type="number" stroke="#f5f5f5" tick={{ fontSize: 12 }} />
              <YAxis
                dataKey="label"
                type="category"
                stroke="#f5f5f5"
                tick={{ fontSize: 12 }}
                width={190}
              />
              <Tooltip
                contentStyle={{ background: "#1a1a1a", border: "1px solid #ff006e" }}
                labelStyle={{ color: "#f5f5f5" }}
                formatter={(value) => Number(value).toFixed(3)}
              />
              <Bar dataKey="importance" fill="#ff006e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
