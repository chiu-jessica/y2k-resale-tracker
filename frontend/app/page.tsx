"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import HalftoneBackground from "@/components/HalftoneBackground";
import GrungeDivider from "@/components/GrungeDivider";
import StatCard from "@/components/StatCard";
import { API_BASE, StatsResponse } from "@/lib/api";

export default function Home() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/stats`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
      })
      .then(setStats)
      .catch((err) => setError(err.message));
  }, []);

  let overallAvgPrice: number | null = null;
  if (stats && stats.avg_price_by_brand.length > 0) {
    const totalValue = stats.avg_price_by_brand.reduce(
      (sum, b) => sum + b.avg_price * b.listing_count,
      0
    );
    const totalCount = stats.avg_price_by_brand.reduce((sum, b) => sum + b.listing_count, 0);
    overallAvgPrice = totalCount > 0 ? totalValue / totalCount : null;
  }

  return (
    <div>
      <section className="relative overflow-hidden px-6 py-28 text-center">
        <HalftoneBackground />
        <div className="relative">
          <h1 className="font-grunge text-5xl sm:text-7xl text-[#ff006e] tracking-wide">
            Y2K RESALE TRACKER
          </h1>
          <p className="mt-4 text-[#ffb3d9] max-w-xl mx-auto">
            Live resale prices for popular Y2K brands pulled straight from eBay.
          </p>
          <Link
            href="/dashboard"
            className="inline-block mt-8 bg-[#ff006e] text-[#f5f5f5] font-semibold px-8 py-3 rounded-lg hover:brightness-90 transition"
          >
            Explore the Dashboard
          </Link>
        </div>
      </section>

      <GrungeDivider />

      <section className="px-8 py-12 max-w-6xl mx-auto">
        {error && (
          <p className="text-[#ffb3d9] text-center mb-6">
            Couldn&apos;t reach the API ({error}). Is the backend running at {API_BASE}?
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard label="Listings Tracked" value={stats ? stats.total_listings : "…"} />
          <StatCard
            label="Avg Price"
            value={overallAvgPrice !== null ? `$${overallAvgPrice.toFixed(2)}` : "…"}
          />
          <StatCard label="Priciest Brand" value={stats?.highest_avg_price_brand ?? "…"} accent />
        </div>
      </section>
    </div>
  );
}
