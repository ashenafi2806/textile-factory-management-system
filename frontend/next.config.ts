import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Only proxy backend API routes under /api/* so frontend pages
      // and nested routes like /production/[id] are not hijacked.
      { source: "/api/:path*", destination: "http://localhost:5000/:path*" },
    ];
  },
};

export default nextConfig;
