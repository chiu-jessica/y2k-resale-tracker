"use client";

import { useEffect, useState } from "react";
import ChartCard from "@/components/ChartCard";
import { API_BASE, Deal } from "@/lib/api";

// The backend already filters to >=25% under prediction; this just marks
// the standouts within that set with a badge.
const HIGH_DISCOUNT_THRESHOLD = 0.4;

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/deals`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
      })
      .then(setDeals)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="font-grunge text-3xl text-[#ff1493]">Deals</h1>
        <p className="text-[#ffb3d9] text-sm mt-1">
          Listings priced well below what the model predicts for a similar item.
        </p>
      </div>

      {error && (
        <p className="text-[#ffb3d9]">
          Couldn&apos;t reach the API ({error}). Is the backend running at {API_BASE}?
        </p>
      )}
      {!error && !loading && deals.length === 0 && (
        <p className="text-[#ffb3d9] text-sm">
          No underpriced listings right now — check back after the next collection run.
        </p>
      )}

      <div className="space-y-4">
        {deals.map((deal, i) => {
          const isHighDiscount = deal.discount_pct >= HIGH_DISCOUNT_THRESHOLD;
          return (
            <ChartCard key={`${deal.item_url}-${i}`} title={deal.title}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1 text-sm">
                  <div className="text-[#ffb3d9]">
                    {deal.brand} · {deal.condition} · {deal.item_type}
                  </div>
                  <div>
                    <span className="text-[#f5f5f5]">${deal.price.toFixed(2)}</span>
                    <span className="text-[#ffb3d9]"> vs predicted </span>
                    <span className="text-[#f5f5f5]">${deal.predicted_price.toFixed(2)}</span>
                  </div>
                  <div className="text-[#ff1493] font-semibold">
                    {Math.round(deal.discount_pct * 100)}% below predicted
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {isHighDiscount && (
                    <span className="bg-[#ff006e] text-[#0a0a0a] text-xs font-bold px-3 py-1 rounded-full tracking-wide">
                      ✦ DEAL ✦
                    </span>
                  )}
                  <a
                    href={deal.item_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#ffb3d9] underline hover:text-[#ff1493]"
                  >
                    View listing →
                  </a>
                </div>
              </div>
            </ChartCard>
          );
        })}
      </div>
    </div>
  );
}
