// Backend base URL. Hardcoded to match main.py's CORS allowlist
// (http://localhost:3000) and the exact predictor page code, which
// fetches http://localhost:8000 directly.
export const API_BASE = "http://localhost:8000";

export const BRANDS = ["Ed Hardy", "Baby Phat", "Juicy Couture"];
export const CONDITIONS = ["New", "New without tags", "Pre-owned", "Very Good"];
export const ITEM_TYPES = ["hoodie", "tee", "jacket", "pants", "accessory", "other"];

export type Listing = {
  title: string;
  brand: string;
  condition: string;
  item_type: string;
  price: number;
  item_url: string;
  fetched_at: string | null;
};

export type StatsResponse = {
  total_listings: number;
  avg_price_by_brand: { brand: string; listing_count: number; avg_price: number }[];
  highest_avg_price_brand: string | null;
};

export type TrendPoint = {
  brand: string;
  week: string;
  avg_price: number;
  listing_count: number;
};

export type Deal = Listing & {
  predicted_price: number;
  discount_pct: number;
};
