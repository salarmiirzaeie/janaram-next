import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ["janaram.storage.c2.liara.space"],
  },
  experimental: {
    inlineCss: true,
    optimizeCss: true,
    optimizePackageImports: ["lucide-react"],
    cssChunking: true, // default
  },
};

export default nextConfig;
