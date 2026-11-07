import type { NextConfig } from "next";

const backendUrl = (process.env.BACKEND_URL ?? "http://127.0.0.1:3333").replace(/\/$/, "");

const config: NextConfig = {
  devIndicators: false,
  agentRules: false,
  output: "standalone",
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backendUrl}/:path*` }];
  },
};

export default config;
