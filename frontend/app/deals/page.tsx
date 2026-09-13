"use client";

import { useEffect, useState } from "react";
import ChartCard from "@/components/ChartCard";
import FilterChips, { toggle } from "@/components/FilterChips";
import { API_BASE, BRANDS, ITEM_TYPES, Deal } from "@/lib/api";

export default function DealsPage() {
  // No chips selected by default = no filter, so the page opens showing
  // every deal.
  const [brands, setBrands] = useState<string[]>([]);
  const [itemTypes, setItemTypes] = useState<string[]>([]);
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

  // An empty selection in a group means "no filter" for that dimension,
  // not "exclude everything".
  const filteredDeals = deals.filter(
    (deal) =>
      (brands.length === 0 || brands.includes(deal.brand)) &&
      (itemTypes.length === 0 || itemTypes.includes(deal.item_type))
  );

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="font-grunge text-3xl text-[#ff006e]">Deals</h1>
        <p className="text-[#ffb3d9] text-sm mt-1">
          Listings priced well below what the model predicts for a similar item.
        </p>
      </div>

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
      </div>

      {error && (
        <p className="text-[#ffb3d9]">
          Couldn&apos;t reach the API ({error}). Is the backend running at {API_BASE}?
        </p>
      )}
      {!error && !loading && filteredDeals.length === 0 && (
        <p className="text-[#ffb3d9] text-sm">
          No underpriced listings match these filters right now.
        </p>
      )}

      <div className="space-y-4">
        {filteredDeals.map((deal, i) => {
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
                  <div className="text-[#ff006e] font-semibold">
                    {Math.round(deal.discount_pct * 100)}% below predicted
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <a
                    href={deal.item_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#ffb3d9] underline hover:text-[#ff006e]"
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
