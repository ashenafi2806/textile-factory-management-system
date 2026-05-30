import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Proxy known backend API prefixes directly so frontend can call them
      // without the `/api` prefix (except auth, which remains under `/api`).
      {
        source: "/workforce/:path*",
        destination: "http://localhost:5000/workforce/:path*",
      },
      {
        source: "/inventory/:path*",
        destination: "http://localhost:5000/inventory/:path*",
      },
      {
        source: "/production/:path*",
        destination: "http://localhost:5000/production/:path*",
      },
      { source: "/qa/:path*", destination: "http://localhost:5000/qa/:path*" },
      {
        source: "/maintenance/:path*",
        destination: "http://localhost:5000/maintenance/:path*",
      },
      {
        source: "/notifications/:path*",
        destination: "http://localhost:5000/notifications/:path*",
      },
      {
        source: "/training/:path*",
        destination: "http://localhost:5000/training/:path*",
      },
      {
        source: "/users/:path*",
        destination: "http://localhost:5000/users/:path*",
      },
      {
        source: "/mail/:path*",
        destination: "http://localhost:5000/mail/:path*",
      },
      // Keep the generic `/api` proxy for auth and any other API routes that use the `/api` prefix.
      { source: "/api/:path*", destination: "http://localhost:5000/:path*" },
    ];
  },
};

export default nextConfig;
