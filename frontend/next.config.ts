import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this folder; without it Next.js walks up and
  // finds an unrelated package-lock.json outside the repo (OneDrive home dir).
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
