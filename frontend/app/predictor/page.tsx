"use client";
import { useState, useEffect } from "react";
import ChartCard from "@/components/ChartCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { BRANDS, CONDITIONS, ITEM_TYPES } from "@/lib/api";

export default function PredictorPage() {
  const [brand, setBrand] = useState("Juicy Couture");
  const [condition, setCondition] = useState("Pre-owned");
  const [itemType, setItemType] = useState("hoodie");
  const [prediction, setPrediction] = useState<number | null>(null);
  const [importance, setImportance] = useState([]);

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
    <div className="p-8 space-y-8">
      <ChartCard title="Price Predictor">
        <div className="flex flex-wrap gap-4">
          <label className="flex flex-col gap-1 text-sm text-[#ffb3d9]">
            Brand
            <select className={selectClass} value={brand} onChange={(e) => setBrand(e.target.value)}>
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

        <button onClick={handlePredict} className="bg-[#ff006e] px-6 py-2 rounded-lg mt-4">
          Predict Price
        </button>
        {prediction !== null && (
          <div className="mt-4 text-2xl">
            Estimated price: <span className="text-[#ff1493]">${prediction}</span>
          </div>
        )}
      </ChartCard>

      <ChartCard title="What Drives Price?">
        <BarChart width={500} height={300} data={importance} layout="vertical">
          <XAxis type="number" stroke="#f5f5f5" />
          <YAxis dataKey="feature" type="category" stroke="#f5f5f5" width={150} />
          <Tooltip />
          <Bar dataKey="importance" fill="#ff006e" />
        </BarChart>
      </ChartCard>
    </div>
  );
}
