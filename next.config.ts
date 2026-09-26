import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA ?? "",
  },
  turbopack: {
    root: path.join(__dirname),
  },
  transpilePackages: ["@qrafty/qr"],
  experimental: {
    optimizePackageImports: ["@hugeicons/core-free-icons"],
  },
  async redirects() {
    return [{ source: "/desktop", destination: "/design", permanent: true }];
  },
};

export default nextConfig;
