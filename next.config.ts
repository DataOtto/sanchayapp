import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export', // Uncomment for production build
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
