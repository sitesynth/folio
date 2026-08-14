import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Vercel handles output automatically — do not set output:"standalone" */
  experimental: {
    turbo: {},
  },
};

export default nextConfig;
