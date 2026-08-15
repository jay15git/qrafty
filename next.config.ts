import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
    ],
  },
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
  transpilePackages: ["@new-qr/qr"],
};

export default nextConfig;
