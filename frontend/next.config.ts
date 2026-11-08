import type { NextConfig } from "next";

const config: NextConfig = {
  devIndicators: false,
  agentRules: false,
  output: "standalone",
  async rewrites() {
    const backendUrl = (
      process.env.BACKEND_URL ?? "http://127.0.0.1:3333"
    ).replace(/\/$/, "");
    return [{ source: "/api/:path*", destination: `${backendUrl}/:path*` }];
  },
};

export default config;
