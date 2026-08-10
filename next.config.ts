import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
  transpilePackages: ["@new-qr/qr"],
};

export default nextConfig;
